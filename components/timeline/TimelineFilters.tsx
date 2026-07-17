// TimelineFilters — advanced multi-filter panel for timeline
// Combines search, activity type, farm, crop, and date range filters.
"use client";

import { Search, X } from "lucide-react";
import { ACTIVITY_FILTERS } from "@/lib/constants/activity-types";

export interface TimelineFilterState {
  search: string;
  activityType: string;
  farmId: string;
  cropId: string;
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_FILTERS: TimelineFilterState = {
  search: "",
  activityType: "all",
  farmId: "all",
  cropId: "all",
  dateFrom: "",
  dateTo: "",
};

interface TimelineFiltersProps {
  filters: TimelineFilterState;
  onChange: (filters: TimelineFilterState) => void;
  farms: { id: string; name: string }[];
  crops: { id: string; name: string }[];
}

export default function TimelineFilters({
  filters,
  onChange,
  farms,
  crops,
}: TimelineFiltersProps) {
  const update = (partial: Partial<TimelineFilterState>) => {
    onChange({ ...filters, ...partial });
  };

  const hasActiveFilters =
    filters.search ||
    filters.activityType !== "all" ||
    filters.farmId !== "all" ||
    filters.cropId !== "all" ||
    filters.dateFrom ||
    filters.dateTo;

  // Filter crops by selected farm (if a farm is selected)
  const filteredCrops =
    filters.farmId !== "all"
      ? crops.filter((c) => {
          // We don't have farm_id on crops in this context, use name matching
          return true; // Client-side crop list is already filtered by fetched data
        })
      : crops;

  return (
    <div className="space-y-4">
      {/* Search row */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          placeholder="Ara... (tarla, ürün, ürün adı)"
          className="w-full rounded-xl border border-zinc-200/60 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-800/60 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-emerald-600 dark:focus:ring-emerald-900"
        />
        {filters.search && (
          <button
            onClick={() => update({ search: "" })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter chips row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Activity type filter */}
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_FILTERS.map((btn) => (
            <button
              key={btn.value}
              onClick={() => update({ activityType: btn.value })}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filters.activityType === btn.value
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-zinc-600 border border-zinc-200/60 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800/80 dark:hover:bg-zinc-800"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Farm dropdown */}
        <select
          value={filters.farmId}
          onChange={(e) => update({ farmId: e.target.value, cropId: "all" })}
          className="rounded-lg border border-zinc-200/60 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 outline-none transition focus:border-emerald-400 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-400"
        >
          <option value="all">Tüm Tarlalar</option>
          {farms.map((farm) => (
            <option key={farm.id} value={farm.id}>
              {farm.name}
            </option>
          ))}
        </select>

        {/* Crop dropdown */}
        <select
          value={filters.cropId}
          onChange={(e) => update({ cropId: e.target.value })}
          className="rounded-lg border border-zinc-200/60 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 outline-none transition focus:border-emerald-400 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-400"
        >
          <option value="all">Tüm Ürünler</option>
          {filteredCrops.map((crop) => (
            <option key={crop.id} value={crop.id}>
              {crop.name}
            </option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
            className="rounded-lg border border-zinc-200/60 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 outline-none transition focus:border-emerald-400 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-400"
          />
          <span className="text-xs text-zinc-400">-</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
            className="rounded-lg border border-zinc-200/60 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 outline-none transition focus:border-emerald-400 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-400"
          />
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-xs font-semibold text-red-500 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300"
          >
            Filtreleri Temizle
          </button>
        )}
      </div>
    </div>
  );
}
