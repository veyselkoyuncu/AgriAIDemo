// Dashboard Insights — pure helper functions for computing dashboard insight cards
// These functions receive raw data and return computed insights.
// No Supabase calls — business logic is separated from data fetching.

import { FarmRow, CropRow, ActivityRow, ActivityData } from "@/lib/types/dashboard";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LatestActivity {
  type: string;
  farm: string;
  crop: string;
  product?: string;
  quantity?: string;
  date?: string;
}

export interface InsightResult {
  latestActivity: LatestActivity | null;
  todayCount: number;
  upcomingHarvests: { crop: string; farm: string; plantingDate: string }[];
  latestSprayProduct: string | null;
  mostIrrigatedFarm: { name: string; count: number } | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Get today's date in YYYY-MM-DD format (Turkish timezone) */
function todayDate(): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Extract activity data from a raw activity row (handles JSONB data field) */
function getActivityData(act: ActivityRow): ActivityData {
  return act.data || {};
}

/** Find the farm name for a given crop_id */
function findFarmForCrop(cropId: string, crops: CropRow[], farms: FarmRow[]): string {
  const crop = crops.find((c) => c.id === cropId);
  if (!crop) return "Bilinmeyen Tarla";
  if (crop.farms?.name) return crop.farms.name;
  const farm = farms.find((f) => f.id === crop.farm_id);
  return farm?.name || "Bilinmeyen Tarla";
}

// ─── Insight Calculators ────────────────────────────────────────────────────

/**
 * Find the most recent activity across all activities.
 */
export function computeLatestActivity(
  activities: ActivityRow[],
  crops: CropRow[],
  farms: FarmRow[]
): LatestActivity | null {
  if (activities.length === 0) return null;

  const latest = activities[0]; // already sorted desc by created_at
  const data = getActivityData(latest);
  const farmName = findFarmForCrop(latest.crop_id, crops, farms);
  const crop = crops.find((c) => c.id === latest.crop_id);

  return {
    type: data.activity_type || "bilinmiyor",
    farm: farmName,
    crop: crop?.name || "Bilinmiyor",
    product: data.product || undefined,
    quantity: data.quantity || undefined,
    date: data.date || undefined,
  };
}

/**
 * Count activities that happened today (by data.date or created_at).
 */
export function computeTodayCount(activities: ActivityRow[]): number {
  const today = todayDate();
  return activities.filter((act) => {
    const data = getActivityData(act);
    // Check data.date first (normalized), fallback to created_at date
    if (data.date === today) return true;
    const createdDate = act.created_at?.split("T")[0];
    return createdDate === today;
  }).length;
}

/**
 * Find crops whose planting_date is within the next 30 days.
 */
export function computeUpcomingHarvests(
  crops: CropRow[],
  farms: FarmRow[]
): { crop: string; farm: string; plantingDate: string }[] {
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return crops
    .filter((c) => {
      if (!c.planting_date) return false;
      const d = new Date(c.planting_date);
      return d >= now && d <= thirtyDaysLater;
    })
    .map((c) => ({
      crop: c.name,
      farm: findFarmForCrop(c.id, crops, farms),
      plantingDate: new Date(c.planting_date!).toLocaleDateString("tr-TR"),
    }))
    .sort((a, b) => new Date(a.plantingDate).getTime() - new Date(b.plantingDate).getTime());
}

/**
 * Find the most recently used spraying product.
 */
export function computeLatestSprayProduct(activities: ActivityRow[]): string | null {
  const sprayActivities = activities.filter((act) => {
    const data = getActivityData(act);
    return data.activity_type === "spraying" && data.product;
  });

  if (sprayActivities.length === 0) return null;
  return sprayActivities[0].data!.product || null;
}

/**
 * Find the farm with the most irrigation activities.
 */
export function computeMostIrrigatedFarm(
  activities: ActivityRow[],
  crops: CropRow[],
  farms: FarmRow[]
): { name: string; count: number } | null {
  const irrigationActivities = activities.filter((act) => {
    const data = getActivityData(act);
    return data.activity_type === "irrigation";
  });

  if (irrigationActivities.length === 0) return null;

  // Count per farm
  const farmCounts = new Map<string, number>();
  for (const act of irrigationActivities) {
    const farmName = findFarmForCrop(act.crop_id, crops, farms);
    farmCounts.set(farmName, (farmCounts.get(farmName) || 0) + 1);
  }

  // Find max
  let maxFarm: { name: string; count: number } | null = null;
  for (const [name, count] of farmCounts) {
    if (!maxFarm || count > maxFarm.count) {
      maxFarm = { name, count };
    }
  }

  return maxFarm;
}

/**
 * Compute all dashboard insights at once.
 * This is the main entry point — call once with all data.
 */
export function computeAllInsights(
  activities: ActivityRow[],
  crops: CropRow[],
  farms: FarmRow[]
): InsightResult {
  return {
    latestActivity: computeLatestActivity(activities, crops, farms),
    todayCount: computeTodayCount(activities),
    upcomingHarvests: computeUpcomingHarvests(crops, farms),
    latestSprayProduct: computeLatestSprayProduct(activities),
    mostIrrigatedFarm: computeMostIrrigatedFarm(activities, crops, farms),
  };
}
