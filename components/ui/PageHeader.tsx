// PageHeader — reusable page header with title, description, and optional action button
// Usage: <PageHeader title="..." description="..." action={<Button />} />

interface PageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{title}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
