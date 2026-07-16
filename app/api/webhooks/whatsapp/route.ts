import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getConversation, createConversation, updateConversation, deleteConversation, isConversationExpired, isPendingActivityExpired, bumpConversationVersion, markPendingActivityStart, ConversationContext, ConversationStatus } from "@/lib/conversation/state";
import { getAIProvider } from "@/lib/ai/provider";
import { sendWhatsAppMessage, downloadWhatsAppMedia } from "@/lib/whatsapp";
import { PerformanceTracker } from "@/lib/utils/perf";
import { optimizeFarmerStatus, optimizeHistory } from "@/lib/ai/payload-optimizer";
import { getMissingFields } from "@/lib/conversation/activity-rules";
import { inheritContext, mergeExtractedActivity } from "@/lib/conversation/context-resolver";
import { isMessageProcessed, markMessageProcessed } from "@/lib/conversation/idempotency";
import { acquireUserLock } from "@/lib/conversation/user-queue";
import { LifecycleLogger, generateRequestId } from "@/lib/conversation/logging";
import { MAX_REQUEST_DURATION_MS } from "@/lib/ai/types";
import { saveToInbox, getPendingMessages, markMessagesProcessed, hasNewMessagesSince } from "@/lib/conversation/inbox";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Deep-clone any serialisable value to prevent reference mutation. */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** Log every state transition with full context. */
function logTransition(fromState: string, toState: string, ctx: ConversationContext) {
  const missing = getMissingFields(ctx.currentActivity);
  console.log(
    `[TRANSITION] ${fromState} → ${toState} | ` +
    `activity_type=${ctx.currentActivity?.activity_type ?? "null"} | ` +
    `pending=${ctx.pendingActivities.length} | ` +
    `completed=${ctx.completedActivities.length} | ` +
    `missing=[${missing.join(",")}]`
  );
}

/** Check if a duplicate activity exists in the history within the last 5 minutes. */
function checkDuplicateInHistory(current: any, history: any[]): boolean {
  if (!current || !current.activity_type) return false;
  
  const now = new Date().getTime();
  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  
  for (const h of history) {
    if (!h.created_at) continue;
    
    const createdAtTime = new Date(h.created_at).getTime();
    if (now - createdAtTime > FIVE_MINUTES_MS) continue;
    
    // Compare activity details
    const typeMatch = h.activity_data?.activity_type === current.activity_type;
    const farmMatch = h.farm_name === current.farm;
    const cropMatch = h.crop_name === current.crop;
    const productMatch = h.activity_data?.product === current.product;
    const quantityMatch = h.activity_data?.quantity === current.quantity;
    const dateMatch = h.activity_data?.date === current.date;
    
    if (typeMatch && farmMatch && cropMatch && productMatch && quantityMatch && dateMatch) {
      return true;
    }
  }
  
  return false;
}

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

// ─── Sprint 2.5.1: Conversation Worker ──────────────────────────────────────
//
// The worker processes ALL pending inbox messages for a user in a single
// execution. This eliminates the "one step behind" problem where the bot
// asks questions the user already answered in rapid-fire messages.
//
// Only one worker runs per user at a time (per-user lock).

interface WorkerResult {
  status: string;
  intent?: string;
  reply?: string;
  lifecycle: LifecycleLogger | null;
  pendingCount: number;
}

async function conversationWorker(
  phone: string,
  perf: PerformanceTracker,
  requestStartTime: number
): Promise<WorkerResult> {
  let lifecycle: LifecycleLogger | null = null;

  // ─── 1. Load all pending inbox messages ────────────────────────────────
  const pendingMessages = await getPendingMessages(phone);

  if (pendingMessages.length === 0) {
    return { status: "no_pending", lifecycle: null, pendingCount: 0 };
  }

  console.log(`[WORKER] Processing ${pendingMessages.length} pending message(s) for ${phone.slice(-4)}.`);

  // Mark them all as processed immediately to prevent double-processing
  const messageIds = pendingMessages.map(m => m.id);
  const wamids = pendingMessages.map(m => m.wamid);
  await markMessagesProcessed(messageIds);

  // Also mark wamids in the processed_messages store
  for (const wamid of wamids) {
    await markMessageProcessed(wamid);
  }

  perf.milestone("Load Inbox");

  // ─── 2. Combine texts & handle audio ─────────────────────────────────
  // Use the first message's id as the primary for logging
  const primaryMessageId = pendingMessages[0].wamid;
  const requestId = generateRequestId();

  // Combine all text messages, separated by newlines
  const combinedText = pendingMessages
    .map(m => m.text)
    .filter(Boolean)
    .join("\n");

  // Take audio from the first message that has it (if any)
  const audioMsg = pendingMessages.find(m => m.audio_data);
  const audioData = audioMsg?.audio_data ?? undefined;

  const firstMsgType = pendingMessages[0].message_type;

  // ─── 3. Fetch Farmer Profile ──────────────────────────────────────────
  const { data: farmerStatus, error: statusError } = await supabase.rpc("get_farmer_status", {
    p_phone: phone,
  });
  console.log("farmerStatus =>", JSON.stringify(farmerStatus, null, 2));

  if (statusError) {
    console.error("Supabase error fetching farmer status:", statusError);
  }

  perf.milestone("Load Farmer");

  const isRegistered = farmerStatus && farmerStatus.registered;

  if (!isRegistered) {
    const reply = `Merhaba! Tarım Günlüğü sisteminde bu telefon numarasıyla (${phone}) kayıtlı bir çiftçi profili bulamadık. Lütfen sisteme kayıt olmak için web sitemizi ziyaret edin ve bu telefon numarasını profilinize kaydedin.`;

    await supabase.from("messages").insert({
      phone,
      raw_message: combinedText || "[Ses Mesajı]",
      intent: "unknown",
      extracted_data: null,
      reply_message: reply,
    });

    await sendWhatsAppMessage(phone, reply);
    perf.milestone("WhatsApp API (Not Registered)");
    console.log(perf.getSummary());
    return { status: "not_registered", lifecycle: null, pendingCount: pendingMessages.length };
  }

  // ─── 4. Fetch History ─────────────────────────────────────────────────
  const { data: historyData, error: historyError } = await supabase.rpc("get_farmer_history", {
    p_phone: phone,
  });

  if (historyError) {
    console.error("Supabase error fetching history:", historyError);
  }

  const history = historyData || [];
  perf.milestone("Load History");

  const optimizedStatus = optimizeFarmerStatus(farmerStatus);
  const optimizedHist = optimizeHistory(history);

  // ─── 5. Load Conversation State ────────────────────────────────────────
  let conversation = await getConversation(phone);
  if (conversation && isConversationExpired(conversation, 15)) {
    console.log(`[INFO] Conversation expired for ${phone}. Deleting...`);
    await deleteConversation(phone);
    conversation = null;
  }
  perf.milestone("Load Conversation");

  // ─── 6. Build Context ──────────────────────────────────────────────────
  let ctx: ConversationContext = conversation?.state_data || {
    currentActivity: null,
    pendingActivities: [],
    completedActivities: [],
    resolvedContext: {},
    extractedEntities: null,
    history: optimizedHist,
  };

  const currentVersion = bumpConversationVersion(ctx);
  lifecycle = new LifecycleLogger(requestId, currentVersion, primaryMessageId, phone);
  lifecycle.transition("QUEUED", { QUEUE_STATUS: "active" });
  lifecycle.transition("STARTED");

  // Check pending activity expiration
  if (isPendingActivityExpired(ctx)) {
    console.log(`[INFO] Pending activity expired for ${phone}. Clearing...`);
    ctx.currentActivity = null;
    ctx.pendingActivities = [];
    ctx.pendingActivitySince = undefined;
  }

  // ─── 7. Check Cancel ──────────────────────────────────────────────────
  const isCancel =
    firstMsgType === "text" &&
    /^\s*(iptal|vazgeçtim|vazgec*tim|boşver|bosver|baştan başlayalım|bastan baslayalim)\s*$/i.test(
      combinedText.split("\n")[0]
    );

  let stateStatus: ConversationStatus = conversation ? conversation.status : "NEW";
  let responderStatus: "idle" | "collecting" | "completed" | "cancelled" = "idle";
  let responderIntent: "activity" | "question" | "unknown" = "unknown";
  let responderPendingData: any = null;
  let responderNextMissingField: string | null = null;
  let bypassAI = false;

  // Handle duplicate confirmation
  if (ctx && (ctx as any).waitingDuplicateConfirmation) {
    const lowerMsg = combinedText.trim().toLowerCase();
    const affirmativeWords = ["evet", "kaydet", "onayla", "tekrar", "yes", "olur", "istiyorum", "aynen", "kabul"];
    const negativeWords = ["hayır", "hayir", "iptal", "vazgeç", "vazgec", "boşver", "bosver", "istemiyorum", "no", "red"];

    if (affirmativeWords.some(w => lowerMsg.includes(w))) {
      console.log("[INFO] User confirmed duplicate save.");
      ctx.currentActivity = (ctx as any).waitingDuplicateConfirmation;
      (ctx as any).duplicateConfirmed = true;
      (ctx as any).waitingDuplicateConfirmation = null;
      stateStatus = "READY_TO_SAVE";
      bypassAI = true;
    } else {
      console.log("[INFO] User did not confirm duplicate save. Clearing duplicate state.");
      ctx.currentActivity = null;
      (ctx as any).waitingDuplicateConfirmation = null;
      (ctx as any).duplicateConfirmed = false;
      if (negativeWords.some(w => lowerMsg.includes(w))) {
        if (conversation) await deleteConversation(phone);
        responderStatus = "cancelled";
        responderIntent = "unknown";
        responderPendingData = null;
        responderNextMissingField = null;
        perf.milestone("Cancel Handling");
        // Save to messages and respond
        await finalizeAndRespond(
          phone, combinedText, primaryMessageId,
          "cancelled", "unknown", null, null,
          optimizedStatus, optimizedHist, null,
          perf, lifecycle
        );
        return { status: "cancelled", lifecycle, pendingCount: pendingMessages.length };
      }
    }
  }

  if (isCancel) {
    console.log(`[INFO] Farmer ${phone} requested cancellation.`);
    if (conversation) await deleteConversation(phone);
    responderStatus = "cancelled";
    responderIntent = "unknown";
    responderPendingData = null;
    responderNextMissingField = null;
    perf.milestone("Cancel Handling");
    await finalizeAndRespond(
      phone, combinedText, primaryMessageId,
      "cancelled", "unknown", null, null,
      optimizedStatus, optimizedHist, null,
      perf, lifecycle
    );
    return { status: "cancelled", lifecycle, pendingCount: pendingMessages.length };
  }

  // ─── 8. AI Extraction ──────────────────────────────────────────────────
  let extractorResult: any = null;
  if (bypassAI) {
    console.log("[INFO] Bypassing AI extraction because user confirmed/canceled duplicate.");
    extractorResult = { intent: "activity", activities: [] };
  } else {
    console.log(`Extracting entities from combined message for ${phone}...`);
    const ai = getAIProvider();

    let activeSession = undefined;
    if (
      ctx.currentActivity &&
      ctx.currentActivity.activity_type &&
      getMissingFields(ctx.currentActivity).length > 0
    ) {
      activeSession = {
        activity_type: ctx.currentActivity.activity_type,
        next_missing_field: getMissingFields(ctx.currentActivity)[0],
        pending_data: ctx.currentActivity,
      };
    }

    const rawExtractorResult = await ai.extract({
      message: combinedText,
      farmerStatus: optimizedStatus,
      history: optimizedHist,
      audioData,
      activeSession,
    });
    extractorResult = rawExtractorResult;
  }
  console.log("Extractor Result:", JSON.stringify(extractorResult, null, 2));
  perf.milestone("Extractor");
  lifecycle.transition("AI");

  ctx.extractedEntities = extractorResult;

  // ─── 9. State Machine (unchanged from Sprint 2.5) ──────────────────────
  if (!bypassAI) {
    if (stateStatus === "NEW" || extractorResult.intent === "activity" || stateStatus === "WAITING_REQUIRED_FIELDS") {
      stateStatus = "EXTRACTING";
    }
  }

  if (stateStatus !== "EXTRACTING" && (extractorResult.intent === "question" || extractorResult.intent === "unknown")) {
    responderIntent = extractorResult.intent;
    responderStatus = "idle";
  } else {
    responderIntent = "activity";
    let runLoop = true;
    let prevState: string = stateStatus;

    while (runLoop) {
      console.log(`[STATE MACHINE] Current State: ${stateStatus}`);
      switch (stateStatus) {
        case "EXTRACTING":
          if (extractorResult.activities && extractorResult.activities.length > 0) {
            if (ctx.currentActivity) {
              const extracted = extractorResult.activities[0];
              mergeExtractedActivity(ctx.currentActivity, extracted, ctx, farmerStatus);
              for (let i = 1; i < extractorResult.activities.length; i++) {
                ctx.pendingActivities.push(deepClone(extractorResult.activities[i]));
              }
            } else {
              for (const act of extractorResult.activities) {
                ctx.pendingActivities.push(deepClone(act));
              }
            }
          }
          logTransition(prevState, "NEXT_ACTIVITY", ctx);
          prevState = "EXTRACTING";
          stateStatus = "NEXT_ACTIVITY";
          break;

        case "NEXT_ACTIVITY":
          if (!ctx.currentActivity) {
            if (ctx.pendingActivities.length > 0) {
              const rawAct = deepClone(ctx.pendingActivities.shift());
              ctx.currentActivity = {
                activity_type: null, farm: null, crop: null,
                product: null, quantity: null, date: null,
                farm_id: null, crop_id: null,
              };
              mergeExtractedActivity(ctx.currentActivity, rawAct, ctx, farmerStatus);
              logTransition(prevState, "MERGING", ctx);
              prevState = "NEXT_ACTIVITY";
              stateStatus = "MERGING";
            } else {
              logTransition(prevState, "FINISHED", ctx);
              prevState = "NEXT_ACTIVITY";
              stateStatus = "FINISHED";
            }
          } else {
            logTransition(prevState, "MERGING", ctx);
            prevState = "NEXT_ACTIVITY";
            stateStatus = "MERGING";
          }
          break;

        case "MERGING":
          if (ctx.currentActivity) {
            inheritContext(ctx.currentActivity, ctx);
          }
          lifecycle.transition("MERGE");
          logTransition(prevState, "WAITING_REQUIRED_FIELDS", ctx);
          prevState = "MERGING";
          stateStatus = "WAITING_REQUIRED_FIELDS";
          break;

        case "WAITING_REQUIRED_FIELDS": {
          const missing = getMissingFields(ctx.currentActivity);

          console.log("[STATE] WAITING_REQUIRED_FIELDS check");
          console.log(`[STATE] currentActivity: ${JSON.stringify(ctx.currentActivity)}`);
          console.log(`[STATE] missingFields: ${JSON.stringify(missing)}`);

          if (missing.length > 0) {
            responderStatus = "collecting";
            responderPendingData = deepClone(ctx.currentActivity);
            responderNextMissingField = missing[0];
            markPendingActivityStart(ctx);
            logTransition(prevState, "WAITING_REQUIRED_FIELDS [paused]", ctx);
            runLoop = false;
          } else {
            logTransition(prevState, "READY_TO_SAVE", ctx);
            prevState = "WAITING_REQUIRED_FIELDS";
            stateStatus = "READY_TO_SAVE";
          }
          break;
        }

        case "READY_TO_SAVE": {
          if (ctx.currentActivity) {
            if (!ctx.currentActivity.date) {
              const trDate = new Date(
                new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" })
              );
              ctx.currentActivity.date = `${trDate.getFullYear()}-${String(trDate.getMonth() + 1).padStart(2, "0")}-${String(trDate.getDate()).padStart(2, "0")}`;
            }

            const finalMissing = getMissingFields(ctx.currentActivity);
            if (finalMissing.length > 0) {
              console.warn("[WARNING] READY_TO_SAVE guard: still missing required fields:", finalMissing);
              logTransition(prevState, "WAITING_REQUIRED_FIELDS [bounced]", ctx);
              stateStatus = "WAITING_REQUIRED_FIELDS";
              break;
            }

            if (!(ctx as any).duplicateConfirmed) {
              const isDuplicate = checkDuplicateInHistory(ctx.currentActivity, history);
              if (isDuplicate) {
                console.log("[WARNING] Duplicate activity detected within 5 minutes. Asking for confirmation.");
                (ctx as any).waitingDuplicateConfirmation = deepClone(ctx.currentActivity);
                responderStatus = "collecting";
                responderPendingData = deepClone(ctx.currentActivity);
                responderNextMissingField = "duplicate_confirmation";
                logTransition(prevState, "WAITING_REQUIRED_FIELDS [duplicate check paused]", ctx);
                stateStatus = "WAITING_REQUIRED_FIELDS";
                runLoop = false;
                break;
              }
            }
          }
          logTransition(prevState, "SAVED", ctx);
          prevState = "READY_TO_SAVE";
          stateStatus = "SAVED";
          break;
        }

        case "SAVED": {
          if (!ctx.currentActivity) {
            stateStatus = "NEXT_ACTIVITY";
            break;
          }

          const activitySnapshot = deepClone(ctx.currentActivity);
          console.log(`[INFO] SAVED — snapshotted activity: ${JSON.stringify(activitySnapshot)}`);

          const actKey = `${activitySnapshot.activity_type}-${activitySnapshot.farm}-${activitySnapshot.date}-${primaryMessageId}`;
          if ((ctx as any)._last_saved_key === actKey) {
            console.log("[INFO] Skipping duplicate save within same session.");
            stateStatus = "NEXT_ACTIVITY";
            break;
          }

          const { error: logError } = await supabase.rpc("log_farmer_activity", {
            p_phone: phone,
            p_farm_name: activitySnapshot.farm,
            p_crop_name: activitySnapshot.crop,
            p_activity_data: {
              activity_type: activitySnapshot.activity_type,
              product: activitySnapshot.product,
              quantity: activitySnapshot.quantity,
              farm_name: activitySnapshot.farm,
              farm_id: activitySnapshot.farm_id,
              crop_name: activitySnapshot.crop,
              crop_id: activitySnapshot.crop_id,
              date: activitySnapshot.date,
              message_id: primaryMessageId,
            },
          });

          if (logError) {
            console.error("Supabase error saving activity via RPC:", logError);
          } else {
            console.log("Successfully saved activity");
            (ctx as any)._last_saved_key = actKey;
          }

          ctx.completedActivities.push(activitySnapshot);
          ctx.currentActivity = null;
          (ctx as any).duplicateConfirmed = false;

          lifecycle.transition("SAVE");
          logTransition(prevState, "NEXT_ACTIVITY [after save]", ctx);
          prevState = "SAVED";
          stateStatus = "NEXT_ACTIVITY";
          break;
        }

        case "FINISHED":
          responderStatus = "completed";
          responderPendingData =
            ctx.completedActivities.length > 0
              ? deepClone(ctx.completedActivities[ctx.completedActivities.length - 1])
              : null;
          responderNextMissingField = null;
          logTransition(prevState, "FINISHED [loop end]", ctx);
          runLoop = false;
          break;
      }
    }

    // Persist conversation state
    if (stateStatus === "FINISHED") {
      if (conversation) await deleteConversation(phone);
    } else {
      if (conversation) {
        await updateConversation(phone, { intent: responderIntent, status: stateStatus, state_data: ctx });
      } else {
        await createConversation(phone, responderIntent, stateStatus, ctx);
      }
    }
  }
  perf.milestone("State Machine & Flow");

  // ─── 10. Sprint 2.5.1: Smart Response Suppression ─────────────────────
  // If conversation became complete, skip follow-up questions.
  // If COLLECTING but all fields are already filled → treat as completed.
  if (responderStatus === "collecting" && ctx.currentActivity) {
    const stillMissing = getMissingFields(ctx.currentActivity);
    if (stillMissing.length === 0) {
      console.log("[SMART_SUPPRESS] Conversation became complete while collecting. Suppressing follow-up.");
      responderStatus = "completed";
      responderPendingData = deepClone(ctx.currentActivity);
      responderNextMissingField = null;
    }
  }

  // ─── 11. Sprint 2.5.1: Queue Flush Before Responding ─────────────────
  // Check if new messages arrived while we were processing
  const flushCheckStart = pendingMessages[pendingMessages.length - 1]?.created_at ?? new Date(0).toISOString();
  const hasNew = await hasNewMessagesSince(phone, flushCheckStart);

  if (hasNew && responderStatus === "collecting") {
    console.log("[FLUSH] New messages arrived during processing. Re-running extraction...");
    // Recurse: load new messages and merge
    const moreMessages = await getPendingMessages(phone);
    if (moreMessages.length > 0) {
      const extraText = moreMessages.map(m => m.text).filter(Boolean).join("\n");
      const combinedWithNew = combinedText + "\n" + extraText;

      const moreIds = moreMessages.map(m => m.id);
      const moreWamids = moreMessages.map(m => m.wamid);
      await markMessagesProcessed(moreIds);
      for (const w of moreWamids) await markMessageProcessed(w);

      // Re-extract with combined text
      const ai2 = getAIProvider();
      const activeSession2 =
        ctx.currentActivity && ctx.currentActivity.activity_type &&
        getMissingFields(ctx.currentActivity).length > 0
          ? {
              activity_type: ctx.currentActivity.activity_type,
              next_missing_field: getMissingFields(ctx.currentActivity)[0],
              pending_data: ctx.currentActivity,
            }
          : undefined;

      const rawResult2 = await ai2.extract({
        message: extraText, // Only the new text; context comes from activeSession
        farmerStatus: optimizedStatus,
        history: optimizedHist,
        audioData: undefined,
        activeSession: activeSession2,
      });

      // Merge new extraction into existing activity
      if (rawResult2.activities && rawResult2.activities.length > 0 && ctx.currentActivity) {
        mergeExtractedActivity(ctx.currentActivity, rawResult2.activities[0], ctx, farmerStatus);
      }

      // Re-check: are we complete now?
      if (ctx.currentActivity) {
        const stillMissing2 = getMissingFields(ctx.currentActivity);
        if (stillMissing2.length === 0) {
          responderStatus = "completed";
          responderPendingData = deepClone(ctx.currentActivity);
          responderNextMissingField = null;
        } else {
          responderNextMissingField = stillMissing2[0];
        }
      }
    }
  }

  // ─── 12. Finalize & Respond ────────────────────────────────────────────
  await finalizeAndRespond(
    phone, combinedText, primaryMessageId,
    responderStatus, responderIntent, responderPendingData, responderNextMissingField,
    optimizedStatus, optimizedHist, ctx,
    perf, lifecycle
  );

  return { status: "success", intent: responderIntent, lifecycle, pendingCount: pendingMessages.length };
}

// ─── Finalize & Respond Helper ──────────────────────────────────────────────
// Generates the AI response, saves the message log, sends WhatsApp message,
// and completes lifecycle logging.

async function finalizeAndRespond(
  phone: string,
  rawMessageText: string,
  primaryMessageId: string,
  responderStatus: "idle" | "collecting" | "completed" | "cancelled",
  responderIntent: "activity" | "question" | "unknown",
  responderPendingData: any,
  responderNextMissingField: string | null,
  optimizedStatus: any,
  optimizedHist: any[],
  ctx: ConversationContext | null,
  perf: PerformanceTracker,
  lifecycle: LifecycleLogger | null
) {
  const savedMessageText = rawMessageText || "[Ses Mesajı: AI tarafından çözümlendi]";

  // Generate reply
  let replyMessage: string;
  try {
    const ai = getAIProvider();
    replyMessage = await ai.respond({
      message: savedMessageText,
      status: responderStatus,
      intent: responderIntent,
      pendingData: responderPendingData,
      nextMissingField: responderNextMissingField,
      farmerStatus: optimizedStatus,
      history: optimizedHist,
    });
    console.log(`Generated reply: "${replyMessage}"`);
  } catch (responderError: any) {
    console.error(`[ERROR] Responder failed for ${phone}:`, responderError.message);
    replyMessage = "Mesajınızı aldık ancak şu anda yanıt oluşturamıyoruz. Lütfen kısa bir süre sonra tekrar deneyin.";
  }
  perf.milestone("Responder");

  // Save to message log
  const { error: msgInsertError } = await supabase.from("messages").upsert(
    {
      message_id: primaryMessageId,
      phone,
      raw_message: savedMessageText,
      intent: responderIntent,
      extracted_data: responderPendingData,
      reply_message: replyMessage,
    },
    { onConflict: "message_id", ignoreDuplicates: true }
  );

  if (msgInsertError) {
    console.error("Error inserting message log:", msgInsertError);
  }

  // Send WhatsApp
  await sendWhatsAppMessage(phone, replyMessage);
  perf.milestone("WhatsApp API");

  if (lifecycle) {
    lifecycle.transition("SEND");
    lifecycle.transition("COMPLETED");
  }

  console.log(perf.getSummary());
}

// ─── Meta Webhook Message Processing (POST) ─────────────────────────────────
//
// Sprint 2.5.1: Webhook is now lightweight.
//  1. Validate & parse
//  2. Idempotency check
//  3. Save to inbox
//  4. Try to acquire per-user lock
//     → If acquired: run conversationWorker (process ALL pending messages)
//     → If not: return 200 — another request is already processing this user

export async function POST(request: NextRequest) {
  const perf = new PerformanceTracker();
  const requestStartTime = Date.now();
  let releaseLock: (() => void) | null = null;
  let from = "";

  try {
    const body = await request.json();
    console.log("[DEBUG] WhatsApp Webhook POST raw body:", JSON.stringify(body, null, 2));

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Invalid webhook object" }, { status: 400 });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ status: "ignored" });
    }

    from = message.from;
    console.log(`[DEBUG] WhatsApp Webhook - Extracted from: "${from}"`);
    const messageId = message.id;
    const messageType = message.type;

    // ─── 1. Idempotency Check ─────────────────────────────────────────────
    if (await isMessageProcessed(messageId)) {
      console.log(`[INFO] DUPLICATE_MESSAGE_SKIPPED: ${messageId}`);
      return NextResponse.json({ status: "duplicate_ignored" });
    }
    perf.milestone("Idempotency Check");

    // ─── 2. Parse Message Content ─────────────────────────────────────────
    let rawMessageText = "";
    let audioData: { base64: string; mimeType: string } | null = null;

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
    perf.milestone("Parse Message");

    // ─── 3. Save to Inbox ─────────────────────────────────────────────────
    await saveToInbox({
      wamid: messageId,
      phone: from,
      text: rawMessageText,
      messageType,
      audioData,
    });
    perf.milestone("Save to Inbox");

    // ─── 4. Acquire Per-User Lock & Run Worker ───────────────────────────
    // Only the first request for a user becomes the "worker".
    // Subsequent requests return 200 immediately — their messages
    // will be picked up by the worker's next batch.
    releaseLock = await acquireUserLock(from);

    try {
      // Check total duration before starting the worker
      if (Date.now() - requestStartTime > MAX_REQUEST_DURATION_MS) {
        console.warn(`[TIMEOUT] Request exceeded max duration before worker started.`);
        return NextResponse.json({ status: "timeout" });
      }

      // Become the worker — process ALL pending messages for this user
      const result = await conversationWorker(from, perf, requestStartTime);

      return NextResponse.json({
        status: result.status,
        intent: result.intent || "unknown",
        reply: result.reply || "",
        pendingProcessed: result.pendingCount,
      });
    } finally {
      // Worker done — release lock so the next batch can proceed
      if (releaseLock) releaseLock();
    }

  } catch (error: any) {
    console.error("Error processing WhatsApp Webhook POST request:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    // Always release lock on unexpected errors
    if (releaseLock) releaseLock();
  }
}
