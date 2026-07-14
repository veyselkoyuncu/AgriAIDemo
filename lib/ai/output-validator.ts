/**
 * AI Output Validator — Sprint 2, Item 7
 * 
 * Validates the raw output from any AI provider before it enters the state machine.
 * On invalid/malformed responses, returns a safe fallback instead of crashing the webhook.
 */

import { ExtractorResponse } from "./types";

const VALID_INTENTS = ["activity", "question", "unknown"];

/**
 * Validates and normalizes AI extractor output.
 * Returns a safe fallback on any structural error — webhook never crashes from bad AI output.
 */
export function validateExtractorResponse(raw: any): ExtractorResponse {
  try {
    // Must be an object
    if (!raw || typeof raw !== "object") {
      console.warn("[AI_VALIDATION] Response is not an object:", typeof raw);
      return fallback();
    }

    // Intent must be valid
    const intent = VALID_INTENTS.includes(raw.intent) ? raw.intent : "unknown";

    // Activities must be an array
    if (!Array.isArray(raw.activities)) {
      // If intent is question/unknown, no activities needed
      if (intent === "question" || intent === "unknown") {
        return { intent, activities: [] };
      }
      console.warn("[AI_VALIDATION] activities is not an array:", typeof raw.activities);
      return fallback();
    }

    // Validate each activity
    const validatedActivities = raw.activities
      .filter((act: any) => act && typeof act === "object")
      .map((act: any) => ({
        activity_type: validateEntity(act.activity_type),
        farm: validateEntity(act.farm),
        crop: validateEntity(act.crop),
        product: validateEntity(act.product),
        quantity: validateEntity(act.quantity),
        date: validateEntity(act.date),
      }));

    return { intent, activities: validatedActivities };
  } catch (err) {
    console.error("[AI_VALIDATION] Unexpected error during validation:", err);
    return fallback();
  }
}

function validateEntity(entity: any): { value: any; confidence: number } {
  if (!entity || typeof entity !== "object") {
    return { value: null, confidence: 0 };
  }

  const value = entity.value !== undefined ? entity.value : null;
  let confidence = typeof entity.confidence === "number" ? entity.confidence : 0;

  // Clamp confidence to [0, 1]
  if (confidence < 0) confidence = 0;
  if (confidence > 1) confidence = 1;

  return { value, confidence };
}

function fallback(): ExtractorResponse {
  console.warn("[AI_VALIDATION] Returning safe fallback response.");
  return { intent: "unknown", activities: [] };
}
