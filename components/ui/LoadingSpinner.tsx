// LoadingSpinner — reusable loading indicator with optional label
// Usage: <LoadingSpinner /> | <LoadingSpinner inline label="Yükleniyor..." />

export default function LoadingSpinner({
  inline = false,
  label = "Yükleniyor...",
}: {
  inline?: boolean;
  label?: string;
}) {
  const containerClass = inline
    ? "flex flex-col items-center justify-center py-12"
    : "flex flex-col items-center justify-center min-h-[50vh]";

  return (
    <div className={containerClass}>
      <div className="relative">
        <svg
          className="h-10 w-10 animate-spin text-emerald-500"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-20"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-80"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </span>
      </div>
      {label && (
        <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}
