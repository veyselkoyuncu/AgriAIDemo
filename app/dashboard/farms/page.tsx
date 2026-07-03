"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Trees, MapPin, Scale, Plus, Trash2, X } from "lucide-react";

export default function FarmsPage() {
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & form states
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchFarms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("farms")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFarms(data || []);
    } catch (err: any) {
      console.error("Error fetching farms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, [supabase]);

  const handleAddFarm = async (e: React.FormEvent) => {
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

      setFarms([data, ...farms]);
      setModalOpen(false);
      setName("");
      setLocation("");
      setArea("");
    } catch (err: any) {
      setError(err.message || "Tarla eklenirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFarm = async (id: string) => {
    if (!confirm("Bu tarlayı silmek istediğinize emin misiniz? Bağlı tüm ürünler ve faaliyetler de silinecektir.")) {
      return;
    }

    try {
      const { error } = await supabase.from("farms").delete().eq("id", id);
      if (error) throw error;
      setFarms(farms.filter((farm) => farm.id !== id));
    } catch (err: any) {
      alert("Tarla silinirken hata oluştu: " + err.message);
    }
  };

  const totalArea = farms.reduce((acc, farm) => acc + (farm.area ? parseFloat(farm.area) : 0), 0);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <svg
          className="h-10 w-10 animate-spin text-emerald-600"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Tarlalarım</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Tarımsal arazilerinizi ve dönüm bilgilerini buradan yönetebilirsiniz.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Yeni Tarla Ekle
        </button>
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          <Trees className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Toplam Arazi Büyüklüğü</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {totalArea.toFixed(1)} <span className="text-sm font-semibold text-zinc-500">Dönüm</span>
          </p>
        </div>
      </div>

      {/* Grid List */}
      {farms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 text-center dark:border-zinc-800">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
            <Trees className="h-8 w-8" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">Tarla Bulunamadı</h3>
          <p className="mt-2 text-sm text-zinc-500 max-w-sm">
            Kayıtlı tarlanız bulunmamaktadır. Sağ üstteki butondan ilk tarlanızı ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => (
            <div
              key={farm.id}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-900"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <Trees className="h-5 w-5" />
                </span>
                <button
                  onClick={() => handleDeleteFarm(farm.id)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Sil"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>

              <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{farm.name}</h4>

              <div className="mt-4 space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <MapPin className="h-4 w-4 text-zinc-400" />
                  <span>{farm.location || "Lokasyon belirtilmemiş"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Scale className="h-4 w-4 text-zinc-400" />
                  <span>{farm.area ? `${farm.area} Dönüm` : "Dönüm belirtilmemiş"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Farm Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Yeni Tarla Ekle</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleAddFarm} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tarla Adı *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-2.5 text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-100"
                  placeholder="Örn: Dere Tarlası, Ev Önü"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Lokasyon</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-2.5 text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-100"
                  placeholder="Örn: Adana, Ceyhan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Dönüm (Alan)</label>
                <input
                  type="number"
                  step="0.1"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-2.5 text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-100"
                  placeholder="Örn: 15.5"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
