export async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn("⚠️ WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing. Outbound message was not sent, but saved in DB:", text);
    return false;
  }

  // 1. Sanitization: remove all non-digits
  const cleanRecipientPhone = to.replace(/\D/g, "");

  // 2. Debug logs to Vercel/Next.js console
  console.log(`[DEBUG] sendWhatsAppMessage - Original to: "${to}", Typeof to: "${typeof to}"`);
  console.log(`[DEBUG] sendWhatsAppMessage - Cleaned to: "${cleanRecipientPhone}", Typeof Cleaned to: "${typeof cleanRecipientPhone}"`);

  // 3. Hardcoded recipient to isolate sandbox allowed list issues
  const finalRecipient = "905522617090";
  console.log(`[DEBUG] sendWhatsAppMessage - Using hardcoded recipient for isolation: "${finalRecipient}"`);

  const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: finalRecipient,
        type: "text",
        text: {
          preview_url: false,
          body: text,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`WhatsApp Send API Error: ${response.status} - ${errorText}`);
      return false;
    }

    const data = await response.json();
    return !!data.messages?.[0]?.id;
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    return false;
  }
}

export async function downloadWhatsAppMedia(mediaId: string): Promise<{ base64: string; mimeType: string } | null> {
  const token = process.env.WHATSAPP_TOKEN;

  if (!token) {
    console.warn("⚠️ WHATSAPP_TOKEN is missing. Cannot download audio media.");
    return null;
  }

  try {
    // 1. Get media URL
    const metaUrl = `https://graph.facebook.com/v25.0/${mediaId}`;
    const metaResponse = await fetch(metaUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!metaResponse.ok) {
      const errorText = await metaResponse.text();
      console.error(`Meta Media Info Error: ${metaResponse.status} - ${errorText}`);
      return null;
    }

    const mediaInfo = await metaResponse.json();
    const downloadUrl = mediaInfo.url;
    const mimeType = mediaInfo.mime_type;

    if (!downloadUrl) {
      console.error("No download URL returned from Meta Media API");
      return null;
    }

    // 2. Download media binary
    const fileResponse = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!fileResponse.ok) {
      console.error(`Meta Media Download File Error: ${fileResponse.status}`);
      return null;
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      base64,
      mimeType,
    };
  } catch (error) {
    console.error("Failed to retrieve or download WhatsApp media:", error);
    return null;
  }
}
