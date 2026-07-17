"use client";

import {
  Bell,
  CloudSun,
  Wallet,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import DashboardStatsGrid from "@/components/dashboard/DashboardStats";
import RecentMessages from "@/components/dashboard/RecentMessages";
import PageSection from "@/components/ui/PageSection";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <WelcomeBanner />
      <DashboardStatsGrid />

      {/* Main content area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Recent messages (takes 2/3) */}
        <div className="lg:col-span-2">
          <RecentMessages />
        </div>

        {/* Right: Placeholder module cards (1/3) */}
        <div className="space-y-6">
          {/* Coming soon: Reminders */}
          <PageSection
            icon={Bell}
            title="Yaklaşan Hatırlatmalar"
            className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-900 dark:to-amber-950/10"
          >
            <div className="space-y-3">
              <div className="rounded-xl border border-dashed border-amber-200 p-4 text-center dark:border-amber-800">
                <Bell className="mx-auto h-8 w-8 text-amber-400" />
                <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                  Hatırlatma Modülü Çok Yakında
                </p>
                <p className="mt-1 text-xs text-amber-600/70 dark:text-amber-400/70">
                  İlaçlama, gübreleme ve sulama zamanlarınızı takip edin.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Yeni özellikler geliştirme aşamasında</span>
              </div>
            </div>
          </PageSection>

          {/* Coming soon: Weather */}
          <PageSection
            icon={CloudSun}
            title="Hava Durumu"
          >
            <div className="space-y-3">
              <div className="rounded-xl border border-dashed border-sky-200 p-4 text-center dark:border-sky-800">
                <CloudSun className="mx-auto h-8 w-8 text-sky-400" />
                <p className="mt-2 text-sm font-medium text-sky-700 dark:text-sky-300">
                  Hava Durumu Entegrasyonu
                </p>
                <p className="mt-1 text-xs text-sky-600/70 dark:text-sky-400/70">
                  Tarla bazlı hava tahminleri ile planlamanızı optimize edin.
                </p>
              </div>
            </div>
          </PageSection>

          {/* Coming soon: Expenses */}
          <PageSection
            icon={Wallet}
            title="Masraf Özeti"
          >
            <div className="space-y-3">
              <div className="rounded-xl border border-dashed border-emerald-200 p-4 text-center dark:border-emerald-800">
                <Wallet className="mx-auto h-8 w-8 text-emerald-400" />
                <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Masraf Takibi Gelecek
                </p>
                <p className="mt-1 text-xs text-emerald-600/70 dark:text-emerald-400/70">
                  Tüm giderlerinizi tek bir yerden yönetin.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <ArrowRight className="h-3.5 w-3.5" />
                <span>Sürüm 3.3'te kullanıma sunulacak</span>
              </div>
            </div>
          </PageSection>
        </div>
      </div>
    </div>
  );
}
