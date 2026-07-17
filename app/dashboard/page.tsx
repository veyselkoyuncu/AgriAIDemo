"use client";

import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import DashboardStatsGrid from "@/components/dashboard/DashboardStats";
import RecentMessages from "@/components/dashboard/RecentMessages";
import FarmingInsights from "@/components/dashboard/FarmingInsights";
import PageSection from "@/components/ui/PageSection";
import { Brain } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <WelcomeBanner />
      <DashboardStatsGrid />
      <FarmingInsights />

      {/* Main content area */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentMessages />
        </div>
        <div className="space-y-6">
          {/* Bu alan gelecek modüller için ayrıldı */}
        </div>
      </div>
    </div>
  );
}
