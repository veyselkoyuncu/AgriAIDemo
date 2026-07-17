"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Trees, Sprout, Calendar, Plus } from "lucide-react";
import { FarmRow, CropRow } from "@/lib/types/dashboard";
import PageHeader from "@/components/ui/PageHeader";
import ModalDialog from "@/components/ui/ModalDialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import DeleteButton from "@/components/ui/DeleteButton";
import DataCard from "@/components/ui/DataCard";
import CropForm from "@/components/crops/CropForm";

export default function CropsPage() {
  const [crops, setCrops] = useState<CropRow[]>([]);
  const [farms, setFarms] = useState<FarmRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const supabase = createClient();

  const fetchCropsAndFarms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: farmsData } = await supabase
        .from("farms")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      setFarms(farmsData || []);

      if (farmsData && farmsData.length > 0) {
        const farmIds = farmsData.map((f) => f.id);
        const { data: cropsData } = await supabase
          .from("crops")
          .select(`*, farms (name)`)
          .in("farm_id", farmIds)
          .order("created_at", { ascending: false });

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

  const handleDeleteCrop = async (id: string) => {
    if (
      !confirm(
        "Bu ürünü silmek istediğinize emin misiniz? Bağlı tüm faaliyetler de silinecektir."
      )
    ) {
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ekili Ürünlerim"
        description="Hangi tarlada hangi ürünün ekili olduğunu ve ekim tarihlerini görebilirsiniz."
        action={
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
        }
      />

      {crops.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="Ekili Ürün Bulunamadı"
          description="Henüz kayıtlı bir ürününüz bulunmuyor. Bir tarlanıza ürün ekleyerek tarım faaliyetlerinizi takip etmeye başlayın."
          action={
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
              <Plus className="h-4 w-4" /> İlk Ürünü Ekle
            </button>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {crops.map((crop) => (
            <DataCard
              key={crop.id}
              icon={Sprout}
              iconColor="teal"
              title={crop.name}
              info={[
                {
                  icon: Trees,
                  label: "Tarla: ",
                  value: crop.farms?.name || "Bilinmiyor",
                },
                ...(crop.planting_date
                  ? [
                      {
                        icon: Calendar,
                        label: "Ekim: ",
                        value: new Date(crop.planting_date).toLocaleDateString(
                          "tr-TR"
                        ),
                      },
                    ]
                  : []),
              ]}
              actions={
                <DeleteButton onDelete={() => handleDeleteCrop(crop.id)} />
              }
            />
          ))}
        </div>
      )}

      <ModalDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Yeni Ürün Ekle"
      >
        <CropForm
          farms={farms}
          onSuccess={(data) => {
            setCrops([data, ...crops]);
            setModalOpen(false);
          }}
          onCancel={() => setModalOpen(false)}
        />
      </ModalDialog>
    </div>
  );
}
