"use client";

import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import DashboardStatsGrid from "@/components/dashboard/DashboardStats";
import RecentMessages from "@/components/dashboard/RecentMessages";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <WelcomeBanner />
      <DashboardStatsGrid />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentMessages />
        </div>
      </div>
    </div>
  );
}


