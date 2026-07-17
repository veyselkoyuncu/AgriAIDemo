// DataCard — consistently styled card for list items (farms, crops, etc.)
// Usage: <DataCard icon={Trees} title="..." iconColor="emerald" info={[...]} actions={<DeleteButton />} />

import { LucideProps } from "lucide-react";

interface InfoRow {
  icon: React.ComponentType<LucideProps>;
  label: string;
  value: string;
}

interface DataCardProps {
  icon: React.ComponentType<LucideProps>;
  iconColor?: string; // tailwind color name: "emerald", "teal", etc.
  title: string;
  info: InfoRow[];
  actions?: React.ReactNode;
}

const colorMap: Record<string, string> = {
  emerald:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  teal: "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400",
  amber:
    "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function DataCard({ icon: Icon, iconColor = "emerald", title, info, actions }: DataCardProps) {
  const iconClass = colorMap[iconColor] || colorMap.emerald;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-900">
      <div className="mb-4 flex items-start justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        {actions && (
          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            {actions}
          </div>
        )}
      </div>

      <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{title}</h4>

      <div className="mt-4 space-y-2.5">
        {info.map((row, idx) => {
          const RowIcon = row.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
            >
              <RowIcon className="h-4 w-4 text-zinc-400" />
              <span>
                {row.label}
                <strong className="text-zinc-700 dark:text-zinc-300">
                  {row.value}
                </strong>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
