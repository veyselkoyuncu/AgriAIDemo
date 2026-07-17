// DashboardStats — fetches and displays summary statistics
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Trees, Sprout, Activity, MessageSquare } from "lucide-react";
import { DashboardStats } from "@/lib/types/dashboard";
import StatCard from "@/components/ui/StatCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function DashboardStatsGrid() {
  const [stats, setStats] = useState<DashboardStats>({
    farms: 0,
    crops: 0,
    activities: 0,
    messages: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [farmsRes, messagesRes] = await Promise.all([
          supabase
            .from("farms")
            .select(
              `id, crops (id, activities (id))`
            )
            .eq("user_id", user.id),
          supabase
            .from("profiles")
            .select("phone")
            .eq("id", user.id)
            .single(),
        ]);

        let totalFarms = 0;
        let totalCrops = 0;
        let totalActivities = 0;

        if (farmsRes.data) {
          totalFarms = farmsRes.data.length;
          farmsRes.data.forEach((farm: any) => {
            if (farm.crops) {
              totalCrops += farm.crops.length;
              farm.crops.forEach((crop: any) => {
                if (crop.activities) {
                  totalActivities += crop.activities.length;
                }
              });
            }
          });
        }

        let totalMessages = 0;
        if (messagesRes.data?.phone) {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("phone", messagesRes.data.phone);
          totalMessages = count || 0;
        }

        setStats({
          farms: totalFarms,
          crops: totalCrops,
          activities: totalActivities,
          messages: totalMessages,
        });
      } catch (err) {
        console.error("Dashboard stats fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [supabase]);

  if (loading) return <LoadingSpinner />;

  const statCards = [
    { name: "Tarlalarım", value: stats.farms, icon: Trees, href: "/dashboard/farms" },
    { name: "Ekili Ürünlerim", value: stats.crops, icon: Sprout, href: "/dashboard/crops" },
    { name: "Toplam Faaliyet", value: stats.activities, icon: Activity, href: "/dashboard/timeline" },
    { name: "WhatsApp Sohbet", value: stats.messages, icon: MessageSquare, href: "/dashboard/timeline" },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => (
        <StatCard key={card.name} {...card} />
      ))}
    </div>
  );
}
