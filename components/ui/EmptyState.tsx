// EmptyState — reusable empty state with richer visuals and optional CTA action
// Usage: <EmptyState icon={Icon} title="..." description="..." action={<Button />} />

import { LucideProps } from "lucide-react";

interface EmptyStateProps {
  icon: React.ComponentType<LucideProps>;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 text-center transition hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 ring-4 ring-zinc-50 dark:bg-zinc-800 dark:text-zinc-500 dark:ring-zinc-900">
        <Icon className="h-8 w-8" />
      </span>
      <h3 className="mt-5 text-lg font-bold text-zinc-900 dark:text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
