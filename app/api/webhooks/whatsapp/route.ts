import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getConversation, createConversation, updateConversation, deleteConversation, isConversationExpired } from "@/lib/conversation/state";
import { getAIProvider } from "@/lib/ai/provider";
import { sendWhatsAppMessage, downloadWhatsAppMedia } from "@/lib/whatsapp";

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

    // 5. Fetch and Validate Conversation State
    let conversation = await getConversation(from);
    if (conversation && isConversationExpired(conversation, 15)) {
      console.log(`[INFO] Conversation expired for ${from}. Deleting...`);
      await deleteConversation(from);
      conversation = null;
    }

    // 6. Check for Explicit Cancellation Words
    const isCancel = messageType === "text" &&
      /^\s*(iptal|vazgeçtim|vazgec*tim|boşver|bosver|baştan başlayalım|bastan baslayalim)\s*$/i.test(rawMessageText);

    let responderStatus: "idle" | "collecting" | "completed" | "cancelled" = "idle";
    let responderIntent: "activity" | "question" | "unknown" = "unknown";
    let responderPendingData: any = null;
    let responderNextMissingField: string | null = null;

    if (isCancel) {
      console.log(`[INFO] Farmer ${from} requested cancellation.`);
      if (conversation) {
        await deleteConversation(from);
      }
      responderStatus = "cancelled";
      responderIntent = "unknown";
      responderPendingData = null;
      responderNextMissingField = null;
    } else {
      // 7. Extract structured data from the latest message
      console.log(`Extracting entities from message for ${from}...`);
      const ai = getAIProvider();

      let activeSession = undefined;
      if (conversation && conversation.status === "collecting") {
        const activity_type = conversation.pending_data?.activity_type;
        const next_missing_field = conversation.pending_data?.missing_fields?.[0];
        if (activity_type && next_missing_field) {
          activeSession = {
            activity_type,
            next_missing_field,
            pending_data: conversation.pending_data
          };
        }
      }

      const extractorResult = await ai.extract({
        message: rawMessageText,
        farmerStatus,
        history,
        audioData,
        activeSession
      });
      console.log("Extractor Result:", JSON.stringify(extractorResult, null, 2));

      // 8. Merge and flow logic
      let isCurrentlyCollecting = conversation && conversation.status === "collecting";

      if (isCurrentlyCollecting && extractorResult.is_new_activity) {
        console.log(`[INFO] New activity detected during active session for ${from}. Resetting session...`);
        await deleteConversation(from);
        conversation = null;
        isCurrentlyCollecting = false;
      }

      if (extractorResult.intent === "activity" || isCurrentlyCollecting) {
        // Run Node.js Merge Logic
        const baseActivity = conversation?.pending_data || {
          activity_type: null,
          farm: null,
          crop: null,
          product: null,
          quantity: null,
          date: null,
          missing_fields: []
        };

        const mergedActivity = { ...baseActivity };

        // Overwrite only if the extractor returned a new non-null value
        const fields = ["activity_type", "farm", "crop", "product", "quantity", "date"] as const;
        for (const field of fields) {
          // Lock activity_type if we are currently collecting
          if (field === "activity_type" && isCurrentlyCollecting && baseActivity.activity_type) {
            continue;
          }
          const val = extractorResult[field];
          if (val !== undefined && val !== null && val !== "") {
            mergedActivity[field] = val as any;
          }
        }

        // Default the date field to today's date if missing
        if (!mergedActivity.date) {
          const trDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
          const year = trDate.getFullYear();
          const month = String(trDate.getMonth() + 1).padStart(2, '0');
          const day = String(trDate.getDate()).padStart(2, '0');
          mergedActivity.date = `${year}-${month}-${day}`;
        }

        // Calculate missing fields programmatically
        const missingFields: string[] = [];
        if (!mergedActivity.activity_type) {
          missingFields.push("activity_type");
        } else {
          if (!mergedActivity.farm) missingFields.push("farm");
          if (!mergedActivity.crop) missingFields.push("crop");
          
          if (mergedActivity.activity_type === "fertilization" || mergedActivity.activity_type === "spraying") {
            if (!mergedActivity.product) missingFields.push("product");
          }
          if (!mergedActivity.quantity) missingFields.push("quantity");
        }

        const nextMissingField = missingFields.length > 0 ? missingFields[0] : null;
        mergedActivity.missing_fields = missingFields;

        if (missingFields.length === 0) {
          // Activity is complete!
          responderStatus = "completed";
          responderIntent = "activity";
          responderPendingData = mergedActivity;
          responderNextMissingField = null;

          // Save Activity via Supabase RPC
          console.log(`[INFO] Activity complete. Logging activity for ${from}...`);
          const { data: logResult, error: logError } = await supabase.rpc("log_farmer_activity", {
            p_phone: from,
            p_farm_name: mergedActivity.farm,
            p_crop_name: mergedActivity.crop,
            p_activity_data: {
              activity_type: mergedActivity.activity_type,
              product: mergedActivity.product,
              quantity: mergedActivity.quantity,
              farm_name: mergedActivity.farm,
              crop_name: mergedActivity.crop,
              date: mergedActivity.date
            }
          });

          if (logError) {
            console.error("Supabase error saving activity via RPC:", logError);
          } else {
            console.log("Successfully saved activity:", logResult);
          }

          // Delete conversation state
          await deleteConversation(from);
        } else {
          // Incomplete. Save state and continue collecting
          responderStatus = "collecting";
          responderIntent = "activity";
          responderPendingData = mergedActivity;
          responderNextMissingField = nextMissingField;

          if (conversation) {
            await updateConversation(from, {
              intent: "activity",
              status: "collecting",
              pending_data: mergedActivity
            });
          } else {
            await createConversation(from, "activity", "collecting", mergedActivity);
          }
        }
      } else if (extractorResult.intent === "question") {
        // Question interruption - keep existing session alive if any
        responderStatus = conversation ? (conversation.status as any) : "idle";
        responderIntent = "question";
        responderPendingData = conversation ? conversation.pending_data : null;
        responderNextMissingField = conversation?.pending_data?.missing_fields?.[0] || null;
      } else {
        // Unknown interruption (greetings, emoji, acknowledgment) - keep existing session alive
        responderStatus = conversation ? (conversation.status as any) : "idle";
        responderIntent = "unknown";
        responderPendingData = conversation ? conversation.pending_data : null;
        responderNextMissingField = conversation?.pending_data?.missing_fields?.[0] || null;
      }
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
      farmerStatus,
      history
    });
    console.log(`Generated reply: "${replyMessage}"`);

    // 10. Save message log to DB
    const savedMessageText = rawMessageText || "[Ses Mesajı: Gemini tarafından çözümlendi]";
    const { error: msgInsertError } = await supabase.from("messages").insert({
      message_id: messageId,
      phone: from,
      raw_message: savedMessageText,
      intent: responderIntent,
      extracted_data: responderPendingData,
      reply_message: replyMessage,
    });

    if (msgInsertError) {
      console.error("Error inserting message log:", msgInsertError);
    }

    // 11. Send response via WhatsApp
    await sendWhatsAppMessage(from, replyMessage);

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
