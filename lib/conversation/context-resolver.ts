import { ConversationContext } from "./state";

/**
 * Resolves context words ("bugün", "dün", "oraya", "aynı yere", "ona")
 * based on the conversation context.
 */
export function resolveContext(
  fieldValue: string | null | undefined,
  fieldType: "farm" | "crop" | "date",
  context: ConversationContext
): string | null {
  if (!fieldValue) return null;

  const lowerValue = fieldValue.toLowerCase().trim();

  if (fieldType === "date") {
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
    
    if (lowerValue === "bugün" || lowerValue === "bugun") {
      return formatDate(today);
    }
    if (lowerValue === "dün" || lowerValue === "dun") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return formatDate(yesterday);
    }
    // Eger 2 gün önce vs gelirse, ileride burayı genisletebiliriz.
    // Şimdilik sadece extract edileni döndür
    return fieldValue;
  }

  if (fieldType === "farm") {
    if (lowerValue === "oraya" || lowerValue === "aynı yere" || lowerValue === "ayni yere" || lowerValue === "burada") {
      // Look at completed activities
      if (context.completedActivities.length > 0) {
        return context.completedActivities[context.completedActivities.length - 1].farm || fieldValue;
      }
      // If we don't have completed activities, check current pending activities?
      // For now, if no context, just return what they said. We will prompt them again.
      return null;
    }
  }

  if (fieldType === "crop") {
    if (lowerValue === "ona" || lowerValue === "aynı ürüne" || lowerValue === "buna") {
      if (context.completedActivities.length > 0) {
        return context.completedActivities[context.completedActivities.length - 1].crop || fieldValue;
      }
      return null;
    }
  }

  return fieldValue;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Inherits missing values from previous activities in the same batch or completed activities.
 */
export function inheritContext(currentActivity: any, context: ConversationContext) {
  // If we have a previous completed activity, inherit from that if fields are null
  const previousActivity = context.completedActivities.length > 0 
    ? context.completedActivities[context.completedActivities.length - 1] 
    : null;

  if (previousActivity) {
    if (!currentActivity.farm && previousActivity.farm) {
      currentActivity.farm = previousActivity.farm;
    }
    if (!currentActivity.crop && previousActivity.crop) {
      currentActivity.crop = previousActivity.crop;
    }
    if (!currentActivity.date && previousActivity.date) {
      currentActivity.date = previousActivity.date;
    }
  }
}
