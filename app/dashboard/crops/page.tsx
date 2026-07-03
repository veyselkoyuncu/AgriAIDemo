"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Sprout, Calendar, Trees, Plus, Trash2, X } from "lucide-react";

export default function CropsPage() {
  const [crops, setCrops] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & form states
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [farmId, setFarmId] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchCropsAndFarms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch farms of the user
      const { data: farmsData } = await supabase
        .from("farms")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      setFarms(farmsData || []);

      if (farmsData && farmsData.length > 0) {
        // Fetch crops belonging to these farms
        const farmIds = farmsData.map((f) => f.id);
        const { data: cropsData, error: cropsError } = await supabase
          .from("crops")
          .select(`
            *,
            farms (
              name
            )
          `)
          .in("farm_id", farmIds)
          .order("created_at", { ascending: false });

        if (cropsError) throw cropsError;
        setCrops(cropsData || []);
      }
    } catch (err: any) {
      console.error("Error fetching crops:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCropsAndFarms();
  }, [supabase]);

  const handleAddCrop = async (e: React.FormEvent) => {
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
        .select(`
          *,
          farms (
            name
          )
        `)
        .single();

      if (error) throw error;

      setCrops([data, ...crops]);
      setModalOpen(false);
      setName("");
      setFarmId("");
      setPlantingDate("");
    } catch (err: any) {
      setError(err.message || "Ürün eklenirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCrop = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz? Bağlı tüm faaliyetler de silinecektir.")) {
      return;
    }

    try {
      const { error } = await supabase.from("crops").delete().eq("id", id);
      if (error) throw error;
      setCrops(crops.filter((crop) => crop.id !== id));
    } catch (err: any) {
      alert("Ürün silinirken hata oluştu: " + err.message);
    }
  };

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
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Ekili Ürünlerim</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Hangi tarlada hangi ürünün ekili olduğunu ve ekim tarihlerini görebilirsiniz.
          </p>
        </div>
        <button
          onClick={() => {
            if (farms.length === 0) {
              alert("Lütfen önce en az bir adet tarla oluşturun.");
              return;
            }
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Yeni Ürün Ekle
        </button>
      </div>

      {/* Grid List */}
      {crops.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 text-center dark:border-zinc-800">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
            <Sprout className="h-8 w-8" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">Ekili Ürün Bulunamadı</h3>
          <p className="mt-2 text-sm text-zinc-500 max-w-sm">
            Kayıtlı ürününüz bulunmamaktadır. Sağ üstteki butondan ilk ürününüzü tarlanıza ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {crops.map((crop) => (
            <div
              key={crop.id}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-900"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
                  <Sprout className="h-5 w-5" />
                </span>
                <button
                  onClick={() => handleDeleteCrop(crop.id)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Sil"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>

              <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{crop.name}</h4>

              <div className="mt-4 space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Trees className="h-4 w-4 text-zinc-400" />
                  <span>Tarla: <strong className="text-zinc-700 dark:text-zinc-300">{crop.farms?.name || "Bilinmiyor"}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <span>Ekim Tarihi: {crop.planting_date ? new Date(crop.planting_date).toLocaleDateString("tr-TR") : "Belirtilmemiş"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Crop Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Yeni Ürün Ekle</h3>
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

            <form onSubmit={handleAddCrop} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Ürün Adı *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-2.5 text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-100"
                  placeholder="Örn: Domates, Biber, Mısır"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tarla Seçin *</label>
                <select
                  required
                  value={farmId}
                  onChange={(e) => setFarmId(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-2.5 text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-100"
                >
                  <option value="">-- Tarla Seçin --</option>
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name} ({farm.area ? `${farm.area} Dönüm` : "Alan yok"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Ekim/Dikim Tarihi</label>
                <input
                  type="date"
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-2.5 text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-100"
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
