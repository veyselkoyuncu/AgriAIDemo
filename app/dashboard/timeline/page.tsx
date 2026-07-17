"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Activity } from "lucide-react";
import { FarmRow, CropRow } from "@/lib/types/dashboard";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import ActivityCard from "@/components/timeline/ActivityCard";
import ActivityEditDialog from "@/components/timeline/ActivityEditDialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import TimelineFilters, {
  TimelineFilterState,
  DEFAULT_FILTERS,
} from "@/components/timeline/TimelineFilters";

export default function TimelinePage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [farms, setFarms] = useState<FarmRow[]>([]);
  const [crops, setCrops] = useState<CropRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TimelineFilterState>(DEFAULT_FILTERS);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editActivity, setEditActivity] = useState<any | null>(null);
  const supabase = createClient();

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all farms
      const { data: farmsData } = await supabase
        .from("farms")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      setFarms(farmsData || []);

      // Fetch all activities with relations
      const { data: activitiesData } = await supabase
        .from("activities")
        .select(`id, data, created_at, crops (id, name, farm_id, farms (name))`)
        .order("created_at", { ascending: false });

      setActivities(activitiesData || []);

      // Derive crops from activities
      const uniqueCrops = new Map<string, any>();
      if (activitiesData) {
        for (const act of activitiesData) {
          const actCrops: any = Array.isArray(act.crops) ? act.crops[0] : act.crops;
          if (actCrops && !uniqueCrops.has(actCrops.id)) {
            const cropFarms: any = actCrops.farms;
            const farmName = Array.isArray(cropFarms) ? cropFarms[0]?.name : cropFarms?.name;
            uniqueCrops.set(actCrops.id, {
              id: actCrops.id,
              farm_id: actCrops.farm_id,
              name: actCrops.name,
              planting_date: null,
              created_at: act.created_at,
              farms: farmName ? { name: farmName } : undefined,
            });
          }
        }
      }
      setCrops(Array.from(uniqueCrops.values()));
    } catch (err: any) {
      console.error("Error fetching timeline data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const handleDeleteActivity = async (id: string) => {
    try {
      const { error } = await supabase.from("activities").delete().eq("id", id);
      if (error) throw error;
      setActivities(activities.filter((act) => act.id !== id));
    } catch (err: any) {
      alert("Faaliyet silinirken hata oluştu: " + err.message);
    }
  };

  // Client-side multi-filter
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const data = act.data || {};

      // Search filter
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const farmName = act.crops?.farms?.name || "";
        const cropName = act.crops?.name || "";
        const product = data.product || "";
        if (
          !farmName.toLowerCase().includes(q) &&
          !cropName.toLowerCase().includes(q) &&
          !product.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      // Activity type filter
      if (filters.activityType !== "all" && data.activity_type !== filters.activityType) {
        return false;
      }

      // Farm filter
      if (filters.farmId !== "all") {
        const farmId = act.crops?.farm_id;
        if (farmId !== filters.farmId) return false;
      }

      // Crop filter
      if (filters.cropId !== "all" && act.crop_id !== filters.cropId) {
        return false;
      }

      // Date range filters
      const actDate = data.date || act.created_at?.split("T")[0];
      if (filters.dateFrom && actDate < filters.dateFrom) return false;
      if (filters.dateTo && actDate > filters.dateTo) return false;

      return true;
    });
  }, [activities, filters]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Faaliyet Akışı"
        description="WhatsApp üzerinden sesli veya yazılı kaydettiğiniz tüm tarımsal logları buradan takip edebilirsiniz."
      />

      <TimelineFilters
        filters={filters}
        onChange={setFilters}
        farms={farms}
        crops={crops}
      />

      {filteredActivities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Kayıtlı Faaliyet Yok"
          description="Seçilen kritere uygun faaliyet kaydı bulunamadı. WhatsApp'tan asistanımıza mesaj göndererek yeni faaliyetler oluşturabilirsiniz."
        />
      ) : (
        <div className="relative pl-6 lg:pl-10 before:absolute before:left-[19px] lg:before:left-[27px] before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-200 dark:before:bg-zinc-800">
          {filteredActivities.map((act) => (
            <ActivityCard
              key={act.id}
              activity={act}
              onDelete={() => setConfirmDeleteId(act.id)}
              onEdit={setEditActivity}
            />
          ))}
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Faaliyeti Sil"
        message="Bu faaliyet kaydını silmek istediğinize emin misiniz?"
        onConfirm={() => {
          if (confirmDeleteId) {
            handleDeleteActivity(confirmDeleteId);
            setConfirmDeleteId(null);
          }
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Edit Activity Dialog */}
      <ActivityEditDialog
        open={!!editActivity}
        activity={editActivity}
        onClose={() => setEditActivity(null)}
        onSaved={(updated) => {
          setActivities(activities.map((a) => (a.id === updated.id ? updated : a)));
        }}
      />
    </div>
  );
}


