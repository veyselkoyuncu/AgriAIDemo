// FilterBar — activity type filter buttons
'use client';

import { ACTIVITY_FILTERS } from "@/lib/constants/activity-types";

interface FilterBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function FilterBar({ value, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-zinc-200/50 pb-4 dark:border-zinc-800/50">
      {ACTIVITY_FILTERS.map((btn) => (
        <button
          key={btn.value}
          onClick={() => onChange(btn.value)}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
            value === btn.value
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
              : "bg-white text-zinc-600 border border-zinc-200/60 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800/80 dark:hover:bg-zinc-800"
          }`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
