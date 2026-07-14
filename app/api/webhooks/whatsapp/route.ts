import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getConversation, createConversation, updateConversation, deleteConversation, isConversationExpired, ConversationContext, ConversationStatus } from "@/lib/conversation/state";
import { getAIProvider } from "@/lib/ai/provider";
import { sendWhatsAppMessage, downloadWhatsAppMedia } from "@/lib/whatsapp";
import { PerformanceTracker } from "@/lib/utils/perf";
import { optimizeFarmerStatus, optimizeHistory } from "@/lib/ai/payload-optimizer";
import { getMissingFields } from "@/lib/conversation/activity-rules";
import { resolveContext, inheritContext, mergeExtractedActivity } from "@/lib/conversation/context-resolver";

// Meta Webhook Verification (GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("WhatsApp Webhook Verified Successfully!");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("WhatsApp Webhook Verification Failed.");
  return new NextResponse("Forbidden", { status: 403 });
}

// Meta Webhook Message Processing (POST)
export async function POST(request: NextRequest) {
  const perf = new PerformanceTracker();
  try {
    const body = await request.json();

    console.log("[DEBUG] WhatsApp Webhook POST raw body:", JSON.stringify(body, null, 2));

    // Verify it is a WhatsApp business payload
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Invalid webhook object" }, { status: 400 });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    // If there is no message payload, return 200 (could be status updates)
    if (!message) {
      return NextResponse.json({ status: "ignored" });
    }

    // Extract details
    const from = message.from;
    console.log(`[DEBUG] WhatsApp Webhook - Extracted from: "${from}"`);
    const messageId = message.id;
    const messageType = message.type;

    // 1. Duplicate webhook protection
    const { data: existingMessage } = await supabase
      .from("messages")
      .select("id")
      .eq("message_id", messageId)
      .maybeSingle();

    perf.milestone("Check duplicate");

    if (existingMessage) {
      console.log(`[INFO] Duplicate webhook ignored: ${messageId}`);
      return NextResponse.json({ status: "duplicate_ignored" });
    }

    let rawMessageText = "";
    let audioData: { base64: string; mimeType: string } | undefined = undefined;

    // 2. Process Message Content (Text vs Audio)
    if (messageType === "text") {
      rawMessageText = message.text?.body || "";
    } else if (messageType === "audio") {
      const audioId = message.audio?.id;
      const mimeType = message.audio?.mime_type || "audio/ogg";

      if (audioId) {
        console.log(`Downloading audio file with Media ID: ${audioId}`);
        const downloaded = await downloadWhatsAppMedia(audioId);
        if (downloaded) {
          audioData = downloaded;
        } else {
          console.warn("Failed to download WhatsApp audio attachment");
        }
      }
    } else {
      console.warn(`Unsupported message type: ${messageType}`);
      return NextResponse.json({ status: "unsupported_type" });
    }

    if (!rawMessageText && !audioData) {
      return NextResponse.json({ error: "No message text or audio file processed" }, { status: 400 });
    }

    // 3. Fetch Farmer Profile Status
    const { data: farmerStatus, error: statusError } = await supabase.rpc("get_farmer_status", {
      p_phone: from,
    });
    console.log("farmerStatus =>", JSON.stringify(farmerStatus, null, 2));

    if (statusError) {
      console.error("Supabase error fetching farmer status:", statusError);
    }

    perf.milestone("Load Farmer");

    const isRegistered = farmerStatus && farmerStatus.registered;

    if (!isRegistered) {
      // User is not registered in the system
      const reply = `Merhaba! Tarım Günlüğü sisteminde bu telefon numarasıyla (${from}) kayıtlı bir çiftçi profili bulamadık. Lütfen sisteme kayıt olmak için web sitemizi ziyaret edin ve bu telefon numarasını profilinize kaydedin.`;

      // Log the message raw
      await supabase.from("messages").insert({
        phone: from,
        raw_message: rawMessageText || "[Ses Mesajı]",
        intent: "unknown",
        extracted_data: null,
        reply_message: reply,
      });

      // Send outbound WhatsApp message
      await sendWhatsAppMessage(from, reply);

      perf.milestone("WhatsApp API (Not Registered)");
      console.log(perf.getSummary());

      return NextResponse.json({ status: "not_registered", phone: from });
    }

    // 4. Fetch Farmer Activity History
    const { data: historyData, error: historyError } = await supabase.rpc("get_farmer_history", {
      p_phone: from,
    });

    if (historyError) {
      console.error("Supabase error fetching history:", historyError);
    }

    const history = historyData || [];
    perf.milestone("Load History");

    const optimizedStatus = optimizeFarmerStatus(farmerStatus);
    const optimizedHist = optimizeHistory(history);

    // 5. Fetch and Validate Conversation State
    let conversation = await getConversation(from);
    if (conversation && isConversationExpired(conversation, 15)) {
      console.log(`[INFO] Conversation expired for ${from}. Deleting...`);
      await deleteConversation(from);
      conversation = null;
    }
    perf.milestone("Load Conversation");

    // 6. Check for Explicit Cancellation Words
    const isCancel = messageType === "text" &&
      /^\s*(iptal|vazgeçtim|vazgec*tim|boşver|bosver|baştan başlayalım|bastan baslayalim)\s*$/i.test(rawMessageText);

    let responderStatus: "idle" | "collecting" | "completed" | "cancelled" = "idle";
    let responderIntent: "activity" | "question" | "unknown" = "unknown";
    let responderPendingData: any = null;
    let responderNextMissingField: string | null = null;

    let ctx: ConversationContext = conversation?.state_data || {
      currentActivity: null,
      pendingActivities: [],
      completedActivities: [],
      resolvedContext: {},
      extractedEntities: null,
      history: optimizedHist
    };

    if (isCancel) {
      console.log(`[INFO] Farmer ${from} requested cancellation.`);
      if (conversation) {
        await deleteConversation(from);
      }
      responderStatus = "cancelled";
      responderIntent = "unknown";
      responderPendingData = null;
      responderNextMissingField = null;
      perf.milestone("Cancel Handling");
    } else {
      console.log(`Extracting entities from message for ${from}...`);
      const ai = getAIProvider();

      let activeSession = undefined;
      if (ctx.currentActivity && ctx.currentActivity.activity_type && getMissingFields(ctx.currentActivity).length > 0) {
        activeSession = {
          activity_type: ctx.currentActivity.activity_type,
          next_missing_field: getMissingFields(ctx.currentActivity)[0],
          pending_data: ctx.currentActivity
        };
      }

      const extractorResult: any = await ai.extract({
        message: rawMessageText,
        farmerStatus: optimizedStatus,
        history: optimizedHist,
        audioData,
        activeSession
      });
      console.log("Extractor Result:", JSON.stringify(extractorResult, null, 2));
      perf.milestone("Extractor");

      ctx.extractedEntities = extractorResult;

      let stateStatus: ConversationStatus = conversation ? conversation.status : "NEW";

      if (stateStatus === "NEW" || extractorResult.intent === "activity" || stateStatus === "WAITING_REQUIRED_FIELDS") {
        stateStatus = "EXTRACTING";
      }

      if (stateStatus !== "EXTRACTING" && (extractorResult.intent === "question" || extractorResult.intent === "unknown")) {
        responderIntent = extractorResult.intent;
        responderStatus = "idle";
      } else {
        responderIntent = "activity";
        let runLoop = true;
        
        while(runLoop) {
          console.log(`[STATE MACHINE] Current State: ${stateStatus}`);
          switch(stateStatus) {
            case "EXTRACTING":
              if (extractorResult.activities && extractorResult.activities.length > 0) {
                if (ctx.currentActivity) {
                   const extracted = extractorResult.activities[0];
                   mergeExtractedActivity(ctx.currentActivity, extracted, ctx, farmerStatus);
                   for (let i = 1; i < extractorResult.activities.length; i++) {
                     ctx.pendingActivities.push(extractorResult.activities[i]);
                   }
                } else {
                   for (const act of extractorResult.activities) {
                     ctx.pendingActivities.push(act);
                   }
                }
              }
              stateStatus = "NEXT_ACTIVITY";
              break;

            case "NEXT_ACTIVITY":
              if (!ctx.currentActivity) {
                if (ctx.pendingActivities.length > 0) {
                  const rawAct = ctx.pendingActivities.shift();
                  ctx.currentActivity = {
                     activity_type: null,
                     farm: null,
                     crop: null,
                     product: null,
                     quantity: null,
                     date: null,
                     farm_id: null,
                     crop_id: null
                  };
                  mergeExtractedActivity(ctx.currentActivity, rawAct, ctx, farmerStatus);
                  stateStatus = "MERGING";
                } else {
                  stateStatus = "FINISHED";
                }
              } else {
                 stateStatus = "MERGING";
              }
              break;

            case "MERGING":
              if (ctx.currentActivity) {
                inheritContext(ctx.currentActivity, ctx);
              }
              stateStatus = "WAITING_REQUIRED_FIELDS";
              break;

            case "WAITING_REQUIRED_FIELDS":
              const missing = getMissingFields(ctx.currentActivity);
              
              console.log("[STATE] Waiting for Required Fields");
              console.log(`[STATE] Current Activity: \n${JSON.stringify(ctx.currentActivity, null, 2)}`);
              console.log(`[STATE] Missing Fields: ${JSON.stringify(missing)}`);
              
              if (missing.length > 0) {
                 responderStatus = "collecting";
                 responderPendingData = ctx.currentActivity;
                 responderNextMissingField = missing[0];
                 runLoop = false; // WAIT FOR USER
              } else {
                 stateStatus = "READY_TO_SAVE";
              }
              break;

            case "READY_TO_SAVE":
              if (ctx.currentActivity) {
                if (!ctx.currentActivity.date) {
                  const trDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
                  ctx.currentActivity.date = `${trDate.getFullYear()}-${String(trDate.getMonth() + 1).padStart(2, '0')}-${String(trDate.getDate()).padStart(2, '0')}`;
                }
                
                // FINAL STRICT VALIDATION
                const finalMissing = getMissingFields(ctx.currentActivity);
                if (finalMissing.length > 0) {
                   console.warn("[WARNING] Activity reached READY_TO_SAVE but is missing required fields. Bouncing back to WAITING_REQUIRED_FIELDS.", finalMissing);
                   stateStatus = "WAITING_REQUIRED_FIELDS";
                   break;
                }
              }
              
              stateStatus = "SAVED";
              break;

            case "SAVED":
              if (!ctx.currentActivity) {
                stateStatus = "NEXT_ACTIVITY";
                break;
              }
              
              console.log(`[INFO] Activity complete. Logging activity for ${from}...`);
              
              // Duplication Check
              const actKey = `${ctx.currentActivity.activity_type}-${ctx.currentActivity.farm}-${ctx.currentActivity.date}-${messageId}`;
              if ((ctx as any)._last_saved_key === actKey) {
                 console.log("[INFO] Skipping duplicate save within same session.");
                 stateStatus = "NEXT_ACTIVITY";
                 break;
              }
              
              const { data: logResult, error: logError } = await supabase.rpc("log_farmer_activity", {
                p_phone: from,
                p_farm_name: ctx.currentActivity.farm,
                p_crop_name: ctx.currentActivity.crop,
                p_activity_data: {
                  activity_type: ctx.currentActivity.activity_type,
                  product: ctx.currentActivity.product,
                  quantity: ctx.currentActivity.quantity,
                  farm_name: ctx.currentActivity.farm,
                  farm_id: ctx.currentActivity.farm_id,
                  crop_name: ctx.currentActivity.crop,
                  crop_id: ctx.currentActivity.crop_id,
                  date: ctx.currentActivity.date,
                  message_id: messageId
                }
              });

              if (logError) {
                console.error("Supabase error saving activity via RPC:", logError);
              } else {
                console.log("Successfully saved activity:", logResult);
                (ctx as any)._last_saved_key = actKey;
              }
              
              ctx.completedActivities.push({ ...ctx.currentActivity });
              ctx.currentActivity = null;
              
              stateStatus = "NEXT_ACTIVITY";
              break;

            case "FINISHED":
              responderStatus = "completed";
              responderPendingData = ctx.completedActivities.length > 0 ? ctx.completedActivities[ctx.completedActivities.length - 1] : null;
              responderNextMissingField = null;
              runLoop = false;
              break;
          }
        }
        
      if (stateStatus === "FINISHED") {
         if (conversation) {
            await deleteConversation(from);
         }
      } else {
         if (conversation) {
            await updateConversation(from, { intent: responderIntent, status: stateStatus, state_data: ctx });
         } else {
            await createConversation(from, responderIntent, stateStatus, ctx);
         }
      }
      }
      perf.milestone("State Machine & Flow");
    }

    // 9. Generate reply message
    console.log(`Generating responder reply for ${from}...`);
    const ai = getAIProvider();
    const replyMessage = await ai.respond({
      message: rawMessageText || "[Ses Mesajı]",
      status: responderStatus,
      intent: responderIntent,
      pendingData: responderPendingData,
      nextMissingField: responderNextMissingField,
      farmerStatus: optimizedStatus,
      history: optimizedHist
    });
    console.log(`Generated reply: "${replyMessage}"`);
    perf.milestone("Responder");

    // 10. Save message log to DB
    const savedMessageText = rawMessageText || "[Ses Mesajı: Gemini tarafından çözümlendi]";
    const { error: msgInsertError } = await supabase.from("messages").upsert({
      message_id: messageId,
      phone: from,
      raw_message: savedMessageText,
      intent: responderIntent,
      extracted_data: responderPendingData,
      reply_message: replyMessage,
    }, { onConflict: 'message_id', ignoreDuplicates: true });

    if (msgInsertError) {
      console.error("Error inserting message log:", msgInsertError);
    }

    // 11. Send response via WhatsApp
    await sendWhatsAppMessage(from, replyMessage);
    perf.milestone("WhatsApp API");

    console.log(perf.getSummary());

    return NextResponse.json({
      status: "success",
      intent: responderIntent,
      reply: replyMessage,
    });

  } catch (error: any) {
    console.error("Error processing WhatsApp Webhook POST request:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
