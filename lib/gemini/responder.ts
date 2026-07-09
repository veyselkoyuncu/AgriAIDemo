import { getResponderPrompt } from "@/lib/ai/prompts";

export async function generateResponse(
  message: string,
  status: "idle" | "collecting" | "completed" | "cancelled",
  intent: "activity" | "question" | "unknown",
  pendingData: any,
  nextMissingField: string | null,
  farmerStatus: any,
  history: any[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }

  const systemPrompt = getResponderPrompt(
    status,
    intent,
    pendingData,
    nextMissingField,
    farmerStatus,
    history
  );

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
          parts: [{ text: message || "Selam" }],
        },
      ],
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

  return rawText.trim();
}
