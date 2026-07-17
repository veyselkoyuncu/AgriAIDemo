// DataCard — premium card for list items (farms, crops, etc.)
// Usage: <DataCard icon={Trees} title="..." iconColor="emerald" info={[...]} actions={<DeleteButton />} />

import { LucideProps } from "lucide-react";

interface InfoRow {
  icon: React.ComponentType<LucideProps>;
  label: string;
  value: string;
  highlight?: boolean;
}

interface DataCardProps {
  icon: React.ComponentType<LucideProps>;
  iconColor?: string;
  title: string;
  subtitle?: string;
  info: InfoRow[];
  actions?: React.ReactNode;
  badge?: { text: string; color?: string } | null;
}

const colorMap: Record<string, string> = {
  emerald:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white",
  teal: "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 group-hover:bg-teal-500 group-hover:text-white",
  amber:
    "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white",
  zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const badgeColorMap: Record<string, string> = {
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  amber:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function DataCard({
  icon: Icon,
  iconColor = "emerald",
  title,
  subtitle,
  info,
  actions,
  badge,
}: DataCardProps) {
  const iconClass = colorMap[iconColor] || colorMap.emerald;
  const badgeClass = badge?.color
    ? badgeColorMap[badge.color] || badgeColorMap.zinc
    : badgeColorMap.zinc;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 dark:border-zinc-800/60 dark:bg-zinc-900 dark:hover:border-emerald-700">
      {/* Accent bar */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:via-emerald-600" />

      <div className="mb-4 flex items-start justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex items-center gap-2">
          {badge && (
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${badgeClass}`}
            >
              {badge.text}
            </span>
          )}
          {actions && (
            <div className="opacity-0 transition-opacity group-hover:opacity-100">
              {actions}
            </div>
          )}
        </div>
      </div>

      <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{title}</h4>

      {subtitle && (
        <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{subtitle}</p>
      )}

      <div className="mt-4 space-y-2.5">
        {info.map((row, idx) => {
          const RowIcon = row.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-400"
            >
              <RowIcon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
              <span>
                {row.label && (
                  <span className="mr-1 text-zinc-400 dark:text-zinc-500">
                    {row.label}
                  </span>
                )}
                <span
                  className={
                    row.highlight
                      ? "font-bold text-emerald-700 dark:text-emerald-300"
                      : "font-medium text-zinc-800 dark:text-zinc-200"
                  }
                >
                  {row.value}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
