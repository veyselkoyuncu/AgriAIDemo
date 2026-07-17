"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Trees, MapPin, Scale, Plus } from "lucide-react";
import { FarmRow } from "@/lib/types/dashboard";
import PageHeader from "@/components/ui/PageHeader";
import ModalDialog from "@/components/ui/ModalDialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import DeleteButton from "@/components/ui/DeleteButton";
import DataCard from "@/components/ui/DataCard";
import FarmForm from "@/components/farms/FarmForm";

export default function FarmsPage() {
  const [farms, setFarms] = useState<FarmRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

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

  const totalArea = farms.reduce(
    (acc, farm) => acc + (farm.area ? parseFloat(String(farm.area)) : 0),
    0
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarlalarım"
        description="Tarımsal arazilerinizi ve dönüm bilgilerini buradan yönetebilirsiniz."
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Yeni Tarla Ekle
          </button>
        }
      />

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

      {/* Farm list */}
      {farms.length === 0 ? (
        <EmptyState
          icon={Trees}
          title="Tarla Bulunamadı"
          description="Henüz kayıtlı bir tarlanız bulunmuyor. İlk tarlanızı ekleyerek tarımsal faaliyetlerinizi kaydetmeye başlayın."
          action={
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500 active:scale-95"
            >
              <Plus className="h-4 w-4" /> İlk Tarlanı Oluştur
            </button>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => (
            <DataCard
              key={farm.id}
              icon={Trees}
              iconColor="emerald"
              title={farm.name}
              subtitle={farm.location ? `${farm.location}` : undefined}
              badge={
                farm.area
                  ? { text: `${farm.area} dönüm`, color: "emerald" }
                  : null
              }
              info={[
                {
                  icon: MapPin,
                  label: "",
                  value: farm.location || "Lokasyon belirtilmemiş",
                  highlight: !!farm.location,
                },
                {
                  icon: Scale,
                  label: "",
                  value: farm.area
                    ? `${farm.area} Dönüm`
                    : "Dönüm belirtilmemiş",
                  highlight: !!farm.area,
                },
              ]}
              actions={
                <DeleteButton onDelete={() => handleDeleteFarm(farm.id)} />
              }
            />
          ))}
        </div>
      )}

      {/* Add Farm Modal */}
      <ModalDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Yeni Tarla Ekle"
      >
        <FarmForm
          onSuccess={(data) => {
            setFarms([data, ...farms]);
            setModalOpen(false);
          }}
          onCancel={() => setModalOpen(false)}
        />
      </ModalDialog>
    </div>
  );
}