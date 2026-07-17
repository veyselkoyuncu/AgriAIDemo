// FarmForm — add farm form (used inside ModalDialog)
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface FarmFormProps {
  onSuccess: (farm: any) => void;
  onCancel: () => void;
}

export default function FarmForm({ onSuccess, onCancel }: FarmFormProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı.");

      const { data, error } = await supabase
        .from("farms")
        .insert({
          user_id: user.id,
          name,
          location: location || null,
          area: area ? parseFloat(area) : null,
        })
        .select()
        .single();

      if (error) throw error;
      onSuccess(data);
    } catch (err: any) {
      setError(err.message || "Tarla eklenirken bir hata oluştu.");
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
          Tarla Adı <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Örn: Ziya Paşa Tarlası"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-600"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Lokasyon
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Örn: Köyün girişi, derenin yanı"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-emerald-600"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Dönüm
        </label>
        <input
          type="number"
          step="0.1"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Örn: 25.5"
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
