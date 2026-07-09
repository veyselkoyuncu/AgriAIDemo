import { AIProvider, ExtractorRequest, ExtractorResponse, ResponderRequest, ProviderError } from "../types";
import { getExtractorPrompt, getResponderPrompt } from "../prompts";

export class DeepSeekProvider implements AIProvider {
  get name(): string {
    return "DeepSeek";
  }

  async extract(request: ExtractorRequest): Promise<ExtractorResponse> {
    // Graceful fallback for audio input (DeepSeek only supports text input)
    if (request.audioData) {
      console.warn("[DeepSeek] Audio input is not supported by DeepSeek. Returning unknown intent.");
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

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is not defined in environment variables.");
    }

    const todayStr = new Date().toLocaleDateString("tr-TR");
    const systemPrompt = getExtractorPrompt(request.farmerStatus, request.history, todayStr, request.activeSession);

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: request.message || "Lütfen analiz et ve çıkarım yap." }
        ],
        response_format: {
          type: "json_object"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      const retryAfter = response.headers.get("retry-after");
      const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;
      throw new ProviderError(
        `DeepSeek API error: ${response.status} - ${errorText}`,
        response.status,
        retryAfterSeconds
      );
    }

    const result = await response.json();
    const rawText = result.choices?.[0]?.message?.content;

    if (!rawText) {
      throw new Error("Invalid response structure from DeepSeek API");
    }

    try {
      return JSON.parse(rawText.trim()) as ExtractorResponse;
    } catch (err) {
      console.error("Failed to parse DeepSeek JSON output:", rawText);
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

  async respond(request: ResponderRequest): Promise<string> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is not defined in environment variables.");
    }

    const systemPrompt = getResponderPrompt(
      request.status,
      request.intent,
      request.pendingData,
      request.nextMissingField,
      request.farmerStatus,
      request.history
    );

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: request.message || "Selam" }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      const retryAfter = response.headers.get("retry-after");
      const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;
      throw new ProviderError(
        `DeepSeek API error: ${response.status} - ${errorText}`,
        response.status,
        retryAfterSeconds
      );
    }

    const result = await response.json();
    const rawText = result.choices?.[0]?.message?.content;

    if (!rawText) {
      throw new Error("Invalid response structure from DeepSeek API");
    }

    return rawText.trim();
  }
}
