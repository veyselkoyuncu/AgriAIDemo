import { ConversationContext, ActivityState } from "./state";
import { ExtractedActivity } from "@/lib/ai/types";
import { normalizeEntityName, normalizeActivityType } from "./activity-rules";
import { parseTurkishDate } from "@/lib/normalization/date-parser";
import { normalizeProduct } from "@/lib/normalization/product-dictionary";
import { normalizeQuantity } from "@/lib/normalization/quantity";

// ─── Farm & Crop Alias Engine (Sprint 2, Item 4) ────────────────────────────

const FARM_ALIASES: Record<string, string[]> = {
  "ev önü": ["evin önü", "ev onu", "evin onu"],
  "ön taraf": ["evin önü", "on taraf"],
};

const FARM_CONTEXT_TRIGGERS = [
  "oraya", "aynı yere", "ayni yere", "burada", "şuraya", "suraya",
  "orda", "orda", "orası", "orasi", "aynı tarla", "ayni tarla",
  "öbürü", "oburu", "öbür tarla", "obur tarla",
];

const CROP_CONTEXT_TRIGGERS = [
  "ona", "bunlara", "aynı ürüne", "buna", "aynısına", "aynisina",
  "aynı ürün", "ayni urun", "öbürü", "oburu",
];

/** Resolve farm alias → canonical name if found. */
function resolveFarmAlias(raw: string): string {
  const lower = raw.toLocaleLowerCase("tr-TR").trim();
  for (const [alias, targets] of Object.entries(FARM_ALIASES)) {
    if (lower === alias || targets.some(t => t === lower)) {
      // Return the first target as canonical
      return targets[0].charAt(0).toUpperCase() + targets[0].slice(1);
    }
  }
  return raw;
}

/**
 * Resolves context words and matches against the database entities
 * to populate farm_id and crop_id.
 */
export function resolveContext(
  fieldValue: string | null | undefined,
  fieldType: "farm" | "crop" | "date",
  context: ConversationContext,
  farmerStatus: any
): { value: string | null; id?: string | null } {
  if (!fieldValue) return { value: null };

  const lowerValue = fieldValue.toLowerCase().trim();

  if (fieldType === "date") {
    // Sprint 2: delegate to the full Turkish date parser
    const parsed = parseTurkishDate(fieldValue);
    return { value: parsed }; // null if unresolvable — will be asked again
  }

  if (fieldType === "farm") {
    let matchedName = fieldValue;
    
    // Sprint 2: expanded context triggers
    if (FARM_CONTEXT_TRIGGERS.includes(lowerValue)) {
      if (context.completedActivities.length > 0) {
        matchedName = context.completedActivities[context.completedActivities.length - 1].farm || fieldValue;
      } else if (context.currentActivity?.farm) {
        matchedName = context.currentActivity.farm;
      }
    }

    // Sprint 2: farm alias resolution
    matchedName = resolveFarmAlias(matchedName);

    // Try to resolve farm_id from raw farmerStatus
    const normMatched = normalizeEntityName(matchedName);
    const farms = farmerStatus?.farms || [];
    const foundFarm = farms.find((f: any) => normalizeEntityName(f.name) === normMatched);
    
    if (foundFarm) {
      return { value: foundFarm.name, id: foundFarm.id };
    }
    return { value: matchedName };
  }

  if (fieldType === "crop") {
    let matchedName = fieldValue;

    // Sprint 2: expanded context triggers
    if (CROP_CONTEXT_TRIGGERS.includes(lowerValue)) {
      if (context.completedActivities.length > 0) {
        matchedName = context.completedActivities[context.completedActivities.length - 1].crop || fieldValue;
      } else if (context.currentActivity?.crop) {
        matchedName = context.currentActivity.crop;
      }
    }

    const normMatched = normalizeEntityName(matchedName);
    const crops = farmerStatus?.crops || [];
    const foundCrop = crops.find((c: any) => normalizeEntityName(c.name) === normMatched);
    
    if (foundCrop) {
      return { value: foundCrop.name, id: foundCrop.id };
    }
    return { value: matchedName };
  }

  return { value: fieldValue };
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function inheritContext(currentActivity: ActivityState, context: ConversationContext) {
  const previousActivity = context.completedActivities.length > 0 
    ? context.completedActivities[context.completedActivities.length - 1] 
    : null;

  if (previousActivity) {
    if (!currentActivity.farm && previousActivity.farm) {
      currentActivity.farm = previousActivity.farm;
      currentActivity.farm_id = previousActivity.farm_id;
    }
    if (!currentActivity.crop && previousActivity.crop) {
      currentActivity.crop = previousActivity.crop;
      currentActivity.crop_id = previousActivity.crop_id;
    }
    if (!currentActivity.date && previousActivity.date) {
      currentActivity.date = previousActivity.date;
    }
  }
}

/**
 * Deterministically merges an extracted activity into the current activity.
 * Locked fields (already having valid data) are NOT overwritten.
 */
export function mergeExtractedActivity(
  current: ActivityState, 
  extracted: ExtractedActivity,
  context: ConversationContext,
  farmerStatus: any
) {
  const CONFIDENCE_THRESHOLD = 0.7;

  // Activity Type (Locked if exists)
  if (!current.activity_type && extracted.activity_type?.value && extracted.activity_type.confidence >= CONFIDENCE_THRESHOLD) {
    current.activity_type = normalizeActivityType(extracted.activity_type.value);
  }

  // Farm (Locked if exists) — Sprint 2: entity confidence validation
  if (!current.farm && extracted.farm?.value && extracted.farm.confidence >= CONFIDENCE_THRESHOLD) {
    const resolved = resolveContext(extracted.farm.value, "farm", context, farmerStatus);
    // Sprint 2 Item 5: If AI returned a high-confidence value but it's not a real farm
    // (e.g. "orda" with confidence=1), resolveContext already falls back to context.
    // If resolved.value is still a trigger word and no match was found, set null to force re-ask.
    if (resolved.value && FARM_CONTEXT_TRIGGERS.includes(resolved.value.toLowerCase().trim()) && !resolved.id) {
      console.log(`[CONFIDENCE_CHECK] Farm "${extracted.farm.value}" is a context trigger but no match found. Setting null.`);
      // Don't set — will be asked again
    } else {
      current.farm = resolved.value;
      if (resolved.id) current.farm_id = resolved.id;
    }
  }

  // Crop (Locked if exists) — Sprint 2: entity confidence validation
  if (!current.crop && extracted.crop?.value && extracted.crop.confidence >= CONFIDENCE_THRESHOLD) {
    const resolved = resolveContext(extracted.crop.value, "crop", context, farmerStatus);
    if (resolved.value && CROP_CONTEXT_TRIGGERS.includes(resolved.value.toLowerCase().trim()) && !resolved.id) {
      console.log(`[CONFIDENCE_CHECK] Crop "${extracted.crop.value}" is a context trigger but no match found. Setting null.`);
    } else {
      current.crop = resolved.value;
      if (resolved.id) current.crop_id = resolved.id;
    }
  }

  // Product — Sprint 2: normalize via product dictionary
  if (!current.product && extracted.product?.value && extracted.product.confidence >= CONFIDENCE_THRESHOLD) {
    current.product = normalizeProduct(extracted.product.value);
  }

  // Quantity — Sprint 2: normalize via quantity normalizer
  if (!current.quantity && extracted.quantity?.value && extracted.quantity.confidence >= CONFIDENCE_THRESHOLD) {
    current.quantity = normalizeQuantity(extracted.quantity.value);
  }

  // Date — Sprint 2: parse via Turkish date parser
  if (!current.date && extracted.date?.value && extracted.date.confidence >= CONFIDENCE_THRESHOLD) {
    const resolved = resolveContext(extracted.date.value, "date", context, farmerStatus);
    current.date = resolved.value;
  }
}
