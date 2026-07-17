// PageSection — consistently styled content section for dashboard pages
// Usage: <PageSection icon="{Icon}" title="...">{children}</PageSection>

import { LucideProps } from "lucide-react";

interface PageSectionProps {
  icon?: React.ComponentType<LucideProps>;
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function PageSection({ icon: Icon, title, action, children, className = "" }: PageSectionProps) {
  return (
    <div className={`rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 ${className}`}>
      {(Icon || title || action) && (
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-emerald-600" />}
            {title && <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{title}</h3>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={Icon || title ? "pt-4" : ""}>{children}</div>
    </div>
  );
}
