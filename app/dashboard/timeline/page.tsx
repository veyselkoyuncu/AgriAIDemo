"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Activity } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import FilterBar from "@/components/timeline/FilterBar";
import ActivityCard from "@/components/timeline/ActivityCard";

export default function TimelinePage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const supabase = createClient();

  const fetchActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("activities")
        .select(
          `id, data, created_at, crops (name, farms (name))`
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (err: any) {
      console.error("Error fetching activities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [supabase]);

  const handleDeleteActivity = async (id: string) => {
    if (!confirm("Bu faaliyet kaydını silmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      const { error } = await supabase.from("activities").delete().eq("id", id);
      if (error) throw error;
      setActivities(activities.filter((act) => act.id !== id));
    } catch (err: any) {
      alert("Faaliyet silinirken hata oluştu: " + err.message);
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (filterType === "all") return true;
    return act.data?.activity_type === filterType;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Faaliyet Akışı"
        description="WhatsApp üzerinden sesli veya yazılı kaydettiğiniz tüm tarımsal logları buradan takip edebilirsiniz."
      />

      <FilterBar value={filterType} onChange={setFilterType} />

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
              onDelete={handleDeleteActivity}
            />
          ))}
        </div>
      )}
    </div>
  );
}


