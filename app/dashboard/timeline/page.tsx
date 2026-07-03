"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Activity, 
  Droplet, 
  Trash2,
  Calendar,
  Layers,
  ShoppingBag,
  Leaf,
  Plus
} from "lucide-react";

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
        .select(`
          id,
          data,
          created_at,
          crops (
            name,
            farms (
              name
            )
          )
        `)
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "fertilization":
        return { icon: Leaf, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200" };
      case "spraying":
        return { icon: Activity, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200" };
      case "irrigation":
        return { icon: Droplet, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200" };
      case "harvesting":
        return { icon: ShoppingBag, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200" };
      case "planting":
        return { icon: Layers, color: "text-green-600 bg-green-50 dark:bg-green-950/40 dark:text-green-400 border-green-200" };
      default:
        return { icon: Activity, color: "text-zinc-600 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200" };
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "fertilization":
        return "Gübreleme";
      case "spraying":
        return "İlaçlama";
      case "irrigation":
        return "Sulama";
      case "harvesting":
        return "Hasat";
      case "planting":
        return "Ekim/Dikim";
      default:
        return "Faaliyet";
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (filterType === "all") return true;
    return act.data?.activity_type === filterType;
  });

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

  const filterButtons = [
    { label: "Tümü", value: "all" },
    { label: "Gübreleme", value: "fertilization" },
    { label: "İlaçlama", value: "spraying" },
    { label: "Sulama", value: "irrigation" },
    { label: "Hasat", value: "harvesting" },
    { label: "Ekim", value: "planting" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Faaliyet Akışı</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          WhatsApp üzerinden sesli veya yazılı kaydettiğiniz tüm tarımsal logları buradan takip edebilirsiniz.
        </p>
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200/50 pb-4 dark:border-zinc-800/50">
        {filterButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setFilterType(btn.value)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              filterType === btn.value
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
                : "bg-white text-zinc-600 border border-zinc-200/60 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800/80 dark:hover:bg-zinc-800"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Timeline view */}
      {filteredActivities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 text-center dark:border-zinc-800">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
            <Activity className="h-8 w-8" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">Kayıtlı Faaliyet Yok</h3>
          <p className="mt-2 text-sm text-zinc-500 max-w-sm">
            Seçilen kritere uygun faaliyet kaydı bulunamadı. WhatsApp'tan asistanımıza mesaj göndererek yeni faaliyetler oluşturabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 lg:pl-10 before:absolute before:left-[19px] lg:before:left-[27px] before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-200 dark:before:bg-zinc-800">
          {filteredActivities.map((act) => {
            const actType = act.data?.activity_type || "unknown";
            const style = getActivityIcon(actType);
            const Icon = style.icon;

            return (
              <div key={act.id} className="relative mb-8 last:mb-0">
                {/* Timeline node icon */}
                <span className={`absolute -left-[23px] lg:-left-[31px] top-1 flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full border-4 border-zinc-50 dark:border-zinc-950 shadow-sm ${style.color}`}>
                  <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
                </span>

                {/* Timeline card */}
                <div className="ml-6 lg:ml-8 rounded-2xl border border-zinc-200/50 bg-white p-5 shadow-sm hover:shadow-md transition dark:border-zinc-800/50 dark:bg-zinc-900">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                        {getActivityLabel(actType)}
                      </h4>
                      {act.data?.product && (
                        <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                          {act.data.product}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {act.data?.date ? new Date(act.data.date.split(".").reverse().join("-")).toLocaleDateString("tr-TR") : new Date(act.created_at).toLocaleDateString("tr-TR")}
                      </span>
                      <button
                        onClick={() => handleDeleteActivity(act.id)}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <div>
                      <span className="font-semibold text-zinc-400 mr-1.5">Tarla:</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{act.crops?.farms?.name || "Bilinmeyen Tarla"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-400 mr-1.5">Ürün:</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{act.crops?.name || "Bilinmeyen Ürün"}</span>
                    </div>
                    {act.data?.quantity && (
                      <div>
                        <span className="font-semibold text-zinc-400 mr-1.5">Miktar:</span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{act.data.quantity}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
