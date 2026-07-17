// DeleteButton — hover-reveal delete button with icon
// Usage: <DeleteButton onDelete={() => handleDelete(id)} />

import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  onDelete: () => void;
  className?: string;
}

export default function DeleteButton({ onDelete, className = "" }: DeleteButtonProps) {
  return (
    <button
      onClick={onDelete}
      className={`rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 ${className}`}
      title="Sil"
    >
      <Trash2 className="h-4.5 w-4.5" />
    </button>
  );
}
