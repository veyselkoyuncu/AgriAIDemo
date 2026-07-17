// ActivityEditDialog — edit modal for activity data fields
// Only product, quantity, and date are editable (not activity_type).
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import ModalDialog from "@/components/ui/ModalDialog";
import { ActivityData } from "@/lib/types/dashboard";

interface ActivityEditDialogProps {
  open: boolean;
  activity: any; // The raw activity row
  onClose: () => void;
  onSaved: (updatedActivity: any) => void;
}

export default function ActivityEditDialog({
  open,
  activity,
  onClose,
  onSaved,
}: ActivityEditDialogProps) {
  // Guard: if not open or no activity, render nothing
  if (!open || !activity) return null;

  const data: ActivityData = activity.data || {};
  const [product, setProduct] = useState(data.product || "");
  const [quantity, setQuantity] = useState(data.quantity || "");
  const [date, setDate] = useState(data.date || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updatedData = { ...data, product: product || null, quantity: quantity || null, date: date || null };

      const { data: result, error } = await supabase
        .from("activities")
        .update({ data: updatedData })
        .eq("id", activity.id)
        .select(`id, data, created_at, crops (id, name, farm_id, farms (name))`)
        .single();

      if (error) throw error;
      onSaved(result);
      onClose();
    } catch (err: any) {
      setError(err.message || "Güncelleme sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalDialog open={open} onClose={onClose} title="Faaliyeti Düzenle">
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-950/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Ürün / İlaç Adı
          </label>
          <input
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Kullanılan ürün adı"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Miktar
          </label>
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Örn: 150 litre, 8 teneke, 3 saat"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Tarih
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-600"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
}
