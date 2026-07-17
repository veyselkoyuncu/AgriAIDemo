// FarmingInsights — dashboard insight cards computed from raw data
// Data is fetched once by the parent, then computed by pure helpers.
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Clock,
  CalendarCheck,
  CalendarRange,
  FlaskConical,
  Droplets,
  Sprout,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import PageSection from "@/components/ui/PageSection";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import {
  computeAllInsights,
  InsightResult,
} from "@/lib/utils/dashboard-insights";

export default function FarmingInsights() {
  const [insights, setInsights] = useState<InsightResult | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Single batch: fetch related data
        const { data: farmsData } = await supabase
          .from("farms")
          .select(`id, crops (id, name, planting_date, farm_id), activities (id, crop_id, data, created_at)`)
          .eq("user_id", user.id);

        if (!farmsData) {
          setInsights(null);
          return;
        }

        // Flatten relationships
        const farms: any[] = (farmsData as any[]).map((f: any) => ({ id: f.id, name: f.name, location: f.location, area: f.area, created_at: f.created_at }));
        const crops: any[] = [];
        const activities: any[] = [];

        for (const farm of farmsData as any[]) {
          if (farm.crops) {
            for (const crop of farm.crops) {
              crops.push({ ...crop, farms: { name: farm.name } });
              if (crop.activities) {
                for (const act of crop.activities) {
                  activities.push({ ...act, crops: { name: crop.name, farms: { name: farm.name } } });
                }
              }
            }
          }
        }

        // Sort activities by created_at desc
        activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Compute insights via pure helpers
        const result = computeAllInsights(activities, crops, farms);
        setInsights(result);
      } catch (err) {
        console.error("Farming insights error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  if (loading) return <LoadingSpinner inline label="Analiz ediliyor..." />;

  const insightCards = [
    {
      icon: Clock,
      title: "Son Faaliyet",
      color: "emerald",
      href: "/dashboard/timeline",
      content: insights?.latestActivity
        ? `${insights.latestActivity.type === "spraying" ? "İlaçlama" :
           insights.latestActivity.type === "fertilization" ? "Gübreleme" :
           insights.latestActivity.type === "irrigation" ? "Sulama" :
           insights.latestActivity.type === "harvesting" ? "Hasat" :
           insights.latestActivity.type === "planting" ? "Ekim" :
           insights.latestActivity.type} — ${insights.latestActivity.crop} (${insights.latestActivity.farm})`
        : "Henüz faaliyet kaydı yok",
      empty: !insights?.latestActivity,
    },
    {
      icon: CalendarCheck,
      title: "Bugün Yapılanlar",
      color: "blue",
      href: "/dashboard/timeline",
      content: insights?.todayCount
        ? `${insights.todayCount} faaliyet bugün kaydedildi`
        : "Bugün kayıtlı faaliyet yok",
      empty: !insights?.todayCount,
    },
    {
      icon: CalendarRange,
      title: "Yaklaşan Hasat",
      color: "amber",
      href: "/dashboard/timeline",
      content:
        insights?.upcomingHarvests && insights.upcomingHarvests.length > 0
          ? insights.upcomingHarvests
              .slice(0, 2)
              .map((h) => `${h.crop} (${h.farm}) — ${h.plantingDate}`)
              .join(" | ")
          : "Planlanmış hasat bulunmuyor",
      empty: !insights?.upcomingHarvests || insights.upcomingHarvests.length === 0,
    },
    {
      icon: FlaskConical,
      title: "Son Kullanılan İlaç",
      color: "purple",
      href: "/dashboard/timeline",
      content: insights?.latestSprayProduct ?? "Henüz ilaçlama kaydı yok",
      empty: !insights?.latestSprayProduct,
    },
    {
      icon: Droplets,
      title: "En Çok Sulanan Tarla",
      color: "sky",
      href: "/dashboard/timeline",
      content: insights?.mostIrrigatedFarm
        ? `${insights.mostIrrigatedFarm.name} (${insights.mostIrrigatedFarm.count} kez)`
        : "Henüz sulama kaydı yok",
      empty: !insights?.mostIrrigatedFarm,
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {insightCards.map((card) => {
        const Icon = card.icon;
        const colorMap: Record<string, string> = {
          emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
          blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
          amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
          purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400",
          sky: "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400",
        };

        return (
          <Link
            key={card.title}
            href={card.href}
            className="group relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 dark:border-zinc-800/60 dark:bg-zinc-900 dark:hover:border-emerald-700"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:via-emerald-600" />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 ${colorMap[card.color] || colorMap.emerald}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {card.title}
                </h4>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-500 dark:text-zinc-600" />
            </div>

            <p
              className={`mt-3 text-sm leading-relaxed ${
                card.empty
                  ? "text-zinc-400 dark:text-zinc-500 italic"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {card.content}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
