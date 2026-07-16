import { AIProvider, ExtractorRequest, ExtractorResponse, ResponderRequest, ProviderError, EXTRACTION_TIMEOUT_MS, RESPONDER_TIMEOUT_MS, DEFAULT_COOLDOWN_SECONDS } from "./types";
import { GeminiProvider } from "./providers/gemini";
import { DeepSeekProvider } from "./providers/deepseek";
import { AIProviderHealthRegistry } from "./provider-health";
import { validateExtractorResponse } from "./output-validator";

/**
 * Sprint 2.5: Timeout-aware wrapper. Wraps a promise with an AbortController
 * timeout. On timeout, throws a ProviderError so the failover chain can react.
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  providerName: string,
  operation: "extract" | "respond"
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Race the original promise against a timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    controller.signal.addEventListener("abort", () => {
      reject(
        new ProviderError(
          `[TIMEOUT] ${providerName} ${operation} timed out after ${timeoutMs}ms`,
          408,
          DEFAULT_COOLDOWN_SECONDS
        )
      );
    }, { once: true });
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

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
      
      // Check if provider is healthy
      if (!AIProviderHealthRegistry.isAvailable(provider.name)) {
        const remaining = AIProviderHealthRegistry.getRemainingCooldown(provider.name);
        console.warn(`[AI Failover] Bypassing unhealthy provider ${provider.name} (cooling down for ${remaining}s)...`);
        continue;
      }

      const start = Date.now();
      try {
        console.log(`[AI Failover] Attempting extract with: ${provider.name}`);
        const rawResult = await withTimeout(
          provider.extract(request),
          EXTRACTION_TIMEOUT_MS,
          provider.name,
          "extract"
        );
        // Sprint 2 Item 7: Validate AI output structure before using
        const result = validateExtractorResponse(rawResult);
        const duration = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`[AI Log] AI Provider: ${provider.name} | Extractor | duration: ${duration}s | status: success`);
        return result;
      } catch (err: any) {
        const duration = ((Date.now() - start) / 1000).toFixed(1);
        console.warn(`[AI Log] AI Provider: ${provider.name} | Extractor | duration: ${duration}s | status: error | error: ${err.message || err}`);
        lastError = err;

        // Mark provider as unhealthy if it is a ProviderError with status 429 or 5xx or timeout (408)
        if (err instanceof ProviderError) {
          const cooldown = err.retryAfterSeconds || DEFAULT_COOLDOWN_SECONDS;
          AIProviderHealthRegistry.markUnhealthy(provider.name, cooldown, err.message);
        } else {
          // If it's a generic error (e.g. fetch network failure), apply a default cooldown
          AIProviderHealthRegistry.markUnhealthy(provider.name, DEFAULT_COOLDOWN_SECONDS, err.message || "Network Error");
        }
        
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

      // Check if provider is healthy
      if (!AIProviderHealthRegistry.isAvailable(provider.name)) {
        const remaining = AIProviderHealthRegistry.getRemainingCooldown(provider.name);
        console.warn(`[AI Failover] Bypassing unhealthy provider ${provider.name} (cooling down for ${remaining}s)...`);
        continue;
      }

      const start = Date.now();
      try {
        console.log(`[AI Failover] Attempting respond with: ${provider.name}`);
        const result = await withTimeout(
          provider.respond(request),
          RESPONDER_TIMEOUT_MS,
          provider.name,
          "respond"
        );
        const duration = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`[AI Log] AI Provider: ${provider.name} | Responder | duration: ${duration}s | status: success`);
        return result;
      } catch (err: any) {
        const duration = ((Date.now() - start) / 1000).toFixed(1);
        console.warn(`[AI Log] AI Provider: ${provider.name} | Responder | duration: ${duration}s | status: error | error: ${err.message || err}`);
        lastError = err;

        // Mark provider as unhealthy
        if (err instanceof ProviderError) {
          const cooldown = err.retryAfterSeconds || DEFAULT_COOLDOWN_SECONDS;
          AIProviderHealthRegistry.markUnhealthy(provider.name, cooldown, err.message);
        } else {
          AIProviderHealthRegistry.markUnhealthy(provider.name, DEFAULT_COOLDOWN_SECONDS, err.message || "Network Error");
        }

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
