import { ConversationContext, ActivityState } from "./state";
import { ExtractedActivity } from "@/lib/ai/types";
import { normalizeEntityName, normalizeActivityType } from "./activity-rules";

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
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
    if (lowerValue === "bugün" || lowerValue === "bugun") return { value: formatDate(today) };
    if (lowerValue === "dün" || lowerValue === "dun") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { value: formatDate(yesterday) };
    }
    return { value: fieldValue };
  }

  if (fieldType === "farm") {
    const triggers = ["oraya", "aynı yere", "ayni yere", "burada", "şuraya", "suraya"];
    let matchedName = fieldValue;
    
    if (triggers.includes(lowerValue)) {
      if (context.completedActivities.length > 0) {
        matchedName = context.completedActivities[context.completedActivities.length - 1].farm || fieldValue;
      }
    }

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
    const triggers = ["ona", "bunlara", "aynı ürüne", "buna", "aynısına", "aynisina"];
    let matchedName = fieldValue;

    if (triggers.includes(lowerValue)) {
      if (context.completedActivities.length > 0) {
        matchedName = context.completedActivities[context.completedActivities.length - 1].crop || fieldValue;
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

  // Farm (Locked if exists)
  if (!current.farm && extracted.farm?.value && extracted.farm.confidence >= CONFIDENCE_THRESHOLD) {
    const resolved = resolveContext(extracted.farm.value, "farm", context, farmerStatus);
    current.farm = resolved.value;
    if (resolved.id) current.farm_id = resolved.id;
  }

  // Crop (Locked if exists)
  if (!current.crop && extracted.crop?.value && extracted.crop.confidence >= CONFIDENCE_THRESHOLD) {
    const resolved = resolveContext(extracted.crop.value, "crop", context, farmerStatus);
    current.crop = resolved.value;
    if (resolved.id) current.crop_id = resolved.id;
  }

  // Product (Overwrite only if we have high confidence)
  if (!current.product && extracted.product?.value && extracted.product.confidence >= CONFIDENCE_THRESHOLD) {
    current.product = extracted.product.value;
  }

  // Quantity (Overwrite only if we have high confidence)
  if (!current.quantity && extracted.quantity?.value && extracted.quantity.confidence >= CONFIDENCE_THRESHOLD) {
    current.quantity = extracted.quantity.value;
  }

  // Date (Overwrite only if we have high confidence)
  if (!current.date && extracted.date?.value && extracted.date.confidence >= CONFIDENCE_THRESHOLD) {
    const resolved = resolveContext(extracted.date.value, "date", context, farmerStatus);
    current.date = resolved.value;
  }
}
