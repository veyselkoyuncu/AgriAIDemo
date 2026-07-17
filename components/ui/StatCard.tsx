// StatCard — premium stat/değer göstergesi kartı
// Usage: <StatCard name="Tarlalar" value={5} icon={Trees} href="/dashboard/farms" />

import Link from "next/link";
import { LucideProps } from "lucide-react";

interface StatCardProps {
  name: string;
  value: number;
  icon: React.ComponentType<LucideProps>;
  href: string;
  trend?: "up" | "down" | null;
}

export default function StatCard({ name, value, icon: Icon, href, trend }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 dark:border-zinc-800/60 dark:bg-zinc-900 dark:hover:border-emerald-700"
    >
      {/* Subtle gradient accent */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:via-emerald-600" />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{name}</p>
          <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {value}
            {trend && (
              <span
                className={`ml-2 inline-block text-sm ${
                  trend === "up" ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {trend === "up" ? "↑" : "↓"}
              </span>
            )}
          </p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-400 dark:group-hover:bg-emerald-600">
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </Link>
  );
}
