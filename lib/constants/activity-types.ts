// Activity Types — shared constants for activity type mapping
// Centralizes labels, icons, and color schemes used across the dashboard.

import {
  Activity,
  Droplet,
  ShoppingBag,
  Leaf,
  Layers,
  LucideProps,
} from "lucide-react";
import React from "react";

export interface ActivityTypeConfig {
  label: string;
  icon: React.ComponentType<LucideProps>;
  color: string; // Tailwind classes for icon wrapper
}

const activityTypeMap: Record<string, ActivityTypeConfig> = {
  fertilization: {
    label: "Gübreleme",
    icon: Leaf,
    color:
      "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200",
  },
  spraying: {
    label: "İlaçlama",
    icon: Activity,
    color:
      "text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200",
  },
  irrigation: {
    label: "Sulama",
    icon: Droplet,
    color:
      "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200",
  },
  harvesting: {
    label: "Hasat",
    icon: ShoppingBag,
    color:
      "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200",
  },
  planting: {
    label: "Ekim/Dikim",
    icon: Layers,
    color:
      "text-green-600 bg-green-50 dark:bg-green-950/40 dark:text-green-400 border-green-200",
  },
};

const defaultConfig: ActivityTypeConfig = {
  label: "Faaliyet",
  icon: Activity,
  color:
    "text-zinc-600 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200",
};

export function getActivityConfig(type: string | null | undefined): ActivityTypeConfig {
  if (!type) return defaultConfig;
  return activityTypeMap[type] ?? defaultConfig;
}

export function getActivityLabel(type: string | null | undefined): string {
  return getActivityConfig(type).label;
}

export const ACTIVITY_FILTERS = [
  { label: "Tümü", value: "all" },
  { label: "Gübreleme", value: "fertilization" },
  { label: "İlaçlama", value: "spraying" },
  { label: "Sulama", value: "irrigation" },
  { label: "Hasat", value: "harvesting" },
  { label: "Ekim", value: "planting" },
] as const;
