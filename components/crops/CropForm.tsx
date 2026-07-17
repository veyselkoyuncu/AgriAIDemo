// CropForm — add crop form (used inside ModalDialog)
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { FarmRow } from "@/lib/types/dashboard";

interface CropFormProps {
  farms: FarmRow[];
  onSuccess: (crop: any) => void;
  onCancel: () => void;
}

export default function CropForm({ farms, onSuccess, onCancel }: CropFormProps) {
  const [name, setName] = useState("");
  const [farmId, setFarmId] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!farmId) {
      setError("Lütfen ekimin yapıldığı tarlayı seçin.");
      setSaving(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("crops")
        .insert({
          farm_id: farmId,
          name,
          planting_date: plantingDate || null,
        })
        .select(`*, farms (name)`)
        .single();

      if (error) throw error;
      onSuccess(data);
    } catch (err: any) {
      setError(err.message || "Ürün eklenirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Tarla <span className="text-red-500">*</span>
        </label>
        <select
          value={farmId}
          onChange={(e) => setFarmId(e.target.value)}
          required
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-600"
        >
          <option value="">Tarla seçin</option>
          {farms.map((farm) => (
            <option key={farm.id} value={farm.id}>
              {farm.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Ürün Adı <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Örn: Domates, Biber, Patates"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-600"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Ekim Tarihi
        </label>
        <input
          type="date"
          value={plantingDate}
          onChange={(e) => setPlantingDate(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-600"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
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
  );
}
