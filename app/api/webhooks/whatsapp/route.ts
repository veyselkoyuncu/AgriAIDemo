import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { analyzeMessage } from "@/lib/gemini";
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

    // Log the full webhook body for easy debugging in Vercel console
    console.log("[DEBUG] WhatsApp Webhook POST raw body:", JSON.stringify(body, null, 2));

    // Verify it is a WhatsApp business payload
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Invalid webhook object" }, { status: 400 });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    // If there is no message payload, return 200 (could be statuses update)
    if (!message) {
      return NextResponse.json({ status: "ignored" });
    }

    // Target the sender's phone number directly from the message payload (messages[0].from)
    const from = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
    console.log(`[DEBUG] WhatsApp Webhook - Extracted from: "${from}", Typeof: "${typeof from}"`);
    const messageId = message.id;
    const messageType = message.type;

    let rawMessageText = "";
    let audioData: { base64: string; mimeType: string } | undefined = undefined;

    // 1. Process Message Content (Text vs Audio)
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
          rawMessageText = ""; // The text content will be parsed directly from audio by Gemini
        } else {
          console.warn("Failed to download WhatsApp audio attachment");
        }
      }
    } else {
      // Ignore other media types for now
      console.warn(`Unsupported message type: ${messageType}`);
      return NextResponse.json({ status: "unsupported_type" });
    }

    if (!rawMessageText && !audioData) {
      return NextResponse.json({ error: "No message text or audio file processed" }, { status: 400 });
    }

    // 2. Fetch Farmer Profile Status
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

    // 3. Fetch Farmer Activity History
    const { data: historyData, error: historyError } = await supabase.rpc("get_farmer_history", {
      p_phone: from,
    });

    if (historyError) {
      console.error("Supabase error fetching history:", historyError);
    }

    const history = historyData || [];

    // 4. Send to Gemini 1.5 Flash for Structured Analysis
    console.log(`Analyzing message from ${from}...`);
    const aiResponse = await analyzeMessage(rawMessageText, farmerStatus, history, audioData);
    console.log("Gemini parsed response:", aiResponse);

    // If message was audio, we should save Gemini's summary or the transcription in messages if possible.
    // For simplicity, we save rawMessageText. If it was empty, we can write an indicator.
    const savedMessageText = rawMessageText || "[Ses Mesajı: Gemini tarafından çözümlendi]";

    // 5. Save the Message Log to DB
    const { error: msgInsertError } = await supabase.from("messages").insert({
      phone: from,
      raw_message: savedMessageText,
      intent: aiResponse.intent,
      extracted_data: aiResponse.data,
      reply_message: aiResponse.reply_message,
    });

    if (msgInsertError) {
      console.error("Error inserting message log:", msgInsertError);
    }

    // 6. If it's a valid activity and has no missing fields, record it!
    if (aiResponse.intent === "activity" && aiResponse.missing_fields.length === 0) {
      const { data: logResult, error: logError } = await supabase.rpc("log_farmer_activity", {
        p_phone: from,
        p_farm_name: aiResponse.data.farm_name,
        p_crop_name: aiResponse.data.crop_name,
        p_activity_data: aiResponse.data,
      });

      if (logError) {
        console.error("Supabase error saving activity via RPC:", logError);
      } else {
        console.log("Successfully saved activity:", logResult);
      }
    }

    // 7. Send the Reply Message back to the Farmer via WhatsApp
    await sendWhatsAppMessage(from, aiResponse.reply_message);

    return NextResponse.json({
      status: "success",
      intent: aiResponse.intent,
      reply: aiResponse.reply_message,
    });

  } catch (error: any) {
    console.error("Error processing WhatsApp Webhook POST request:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
