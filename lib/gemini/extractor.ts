import { ExtractorResponse, ActiveSession } from "@/lib/ai/types";
import { getExtractorPrompt } from "@/lib/ai/prompts";

export type { ExtractorResponse };

export async function extractFromMessage(
  message: string,
  farmerStatus: any,
  history: any[],
  audioData?: { base64: string; mimeType: string },
  activeSession?: ActiveSession
): Promise<ExtractorResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }

  const todayStr = new Date().toLocaleDateString("tr-TR");
  const systemPrompt = getExtractorPrompt(farmerStatus, history, todayStr, activeSession);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const parts: any[] = [];

  // Add audio content if available
  if (audioData) {
    parts.push({
      inlineData: {
        mimeType: audioData.mimeType,
        data: audioData.base64,
      },
    });
  }

  // Add text content (always add message or instructions)
  parts.push({
    text: message || "Lütfen ekteki ses kaydını analiz et ve çıkarım yap.",
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          parts: parts,
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Invalid response structure from Gemini API");
  }

  try {
    return JSON.parse(rawText.trim()) as ExtractorResponse;
  } catch (err) {
    console.error("Failed to parse Gemini JSON output:", rawText);
    return {
      intent: "unknown",
      activity_type: null,
      farm: null,
      crop: null,
      product: null,
      quantity: null,
      date: null,
      is_new_activity: false,
    };
  }
}
