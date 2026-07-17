// StatCard — stat/değer göstergesi kartı
// Usage: <StatCard name="Tarlalar" value={5} icon={Trees} href="/dashboard/farms" />

import Link from "next/link";
import { LucideProps } from "lucide-react";

interface StatCardProps {
  name: string;
  value: number;
  icon: React.ComponentType<LucideProps>;
  href: string;
}

export default function StatCard({ name, value, icon: Icon, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm transition-all duration-300 hover:border-emerald-200 hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-900 dark:hover:border-emerald-800"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{name}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {value}
          </p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white dark:bg-emerald-950/30 dark:text-emerald-400">
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </Link>
  );
}
