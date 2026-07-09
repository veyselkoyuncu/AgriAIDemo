import { AIProvider, ExtractorRequest, ExtractorResponse, ResponderRequest } from "./types";
import { GeminiProvider } from "./providers/gemini";
import { DeepSeekProvider } from "./providers/deepseek";

class FailoverAIProvider implements AIProvider {
  private providers: AIProvider[];

  constructor(providers: AIProvider[]) {
    this.providers = providers;
  }

  get name(): string {
    return `FailoverChain(${this.providers.map(p => p.name).join(" -> ")})`;
  }

  async extract(request: ExtractorRequest): Promise<ExtractorResponse> {
    let lastError: any = null;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const start = Date.now();
      try {
        console.log(`[AI Failover] Attempting extract with: ${provider.name}`);
        const result = await provider.extract(request);
        const duration = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`[AI Log] AI Provider: ${provider.name} | Extractor | duration: ${duration}s | status: success`);
        return result;
      } catch (err: any) {
        const duration = ((Date.now() - start) / 1000).toFixed(1);
        console.warn(`[AI Log] AI Provider: ${provider.name} | Extractor | duration: ${duration}s | status: error | error: ${err.message || err}`);
        lastError = err;
        
        // Log transition to next provider if available
        if (i < this.providers.length - 1) {
          console.warn(`[AI Failover] Extraction failed with ${provider.name}, falling back to ${this.providers[i + 1].name}...`);
        }
      }
    }

    throw new Error(`All configured AI providers failed for extract. Last error: ${lastError?.message || lastError}`);
  }

  async respond(request: ResponderRequest): Promise<string> {
    let lastError: any = null;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const start = Date.now();
      try {
        console.log(`[AI Failover] Attempting respond with: ${provider.name}`);
        const result = await provider.respond(request);
        const duration = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`[AI Log] AI Provider: ${provider.name} | Responder | duration: ${duration}s | status: success`);
        return result;
      } catch (err: any) {
        const duration = ((Date.now() - start) / 1000).toFixed(1);
        console.warn(`[AI Log] AI Provider: ${provider.name} | Responder | duration: ${duration}s | status: error | error: ${err.message || err}`);
        lastError = err;

        // Log transition to next provider if available
        if (i < this.providers.length - 1) {
          console.warn(`[AI Failover] Response failed with ${provider.name}, falling back to ${this.providers[i + 1].name}...`);
        }
      }
    }

    throw new Error(`All configured AI providers failed for respond. Last error: ${lastError?.message || lastError}`);
  }
}

/**
 * Factory to retrieve the prioritised failover chain of AI Providers.
 */
export function getAIProvider(): AIProvider {
  const preferred = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  const list: AIProvider[] = [];

  // Discovery checks: only register models with configured API credentials
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;

  if (preferred === "deepseek") {
    if (hasDeepSeek) list.push(new DeepSeekProvider());
    if (hasGemini) list.push(new GeminiProvider());
  } else {
    // Default to Gemini preference
    if (hasGemini) list.push(new GeminiProvider());
    if (hasDeepSeek) list.push(new DeepSeekProvider());
  }

  // Fallback in case no keys are configured (so it doesn't crash on bootup)
  if (list.length === 0) {
    console.warn("⚠️ No AI provider API keys configured! Defaulting to GeminiProvider placeholder.");
    list.push(new GeminiProvider());
  }

  return new FailoverAIProvider(list);
}
