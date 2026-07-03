"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { 
  Trees, 
  Sprout, 
  Activity, 
  MessageSquare, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Brain
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    farms: 0,
    crops: 0,
    activities: 0,
    messages: 0,
  });
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch counts
        const [farmsRes, cropsRes, activitiesRes, messagesRes] = await Promise.all([
          supabase.from("farms").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("crops").select("id", { count: "exact", head: true }).eq("farm_id.user_id", user.id), // wait, nested filter is not supported in simple eq this way.
          // Let's do a client-side fetch or standard count:
          supabase.from("farms").select(`
            id,
            crops (
              id,
              activities (id)
            )
          `).eq("user_id", user.id),
          supabase.from("profiles").select("phone").eq("id", user.id).single()
        ]);

        let totalFarms = 0;
        let totalCrops = 0;
        let totalActivities = 0;

        if (farmsRes.data) {
          totalFarms = farmsRes.data.length;
          
          // Count crops and activities
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

        // Count messages using user's phone number
        let totalMessages = 0;
        let messageList: any[] = [];
        
        if (messagesRes.data?.phone) {
          const userPhone = messagesRes.data.phone;
          const { count, data: msgData } = await supabase
            .from("messages")
            .select("*", { count: "exact" })
            .eq("phone", userPhone)
            .order("created_at", { ascending: false })
            .limit(5);

          totalMessages = count || 0;
          messageList = msgData || [];
        }

        setStats({
          farms: totalFarms,
          crops: totalCrops,
          activities: totalActivities,
          messages: totalMessages,
        });

        setRecentMessages(messageList);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase]);

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

  const statCards = [
    { name: "Tarlalarım", value: stats.farms, icon: Trees, color: "emerald", href: "/dashboard/farms" },
    { name: "Ekili Ürünlerim", value: stats.crops, icon: Sprout, color: "teal", href: "/dashboard/crops" },
    { name: "Toplam Faaliyet", value: stats.activities, icon: Activity, color: "amber", href: "/dashboard/timeline" },
    { name: "WhatsApp Sohbet", value: stats.messages, icon: MessageSquare, color: "blue", href: "/dashboard/timeline" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white shadow-xl shadow-emerald-950/20 dark:from-emerald-800 dark:to-teal-900">
        <h2 className="text-3xl font-extrabold tracking-tight">Hoş Geldiniz! 🌿</h2>
        <p className="mt-2 max-w-2xl text-emerald-100">
          WhatsApp üzerinden sesli veya yazılı mesaj göndererek tarlalarınızı, ekili ürünlerinizi ve tarımsal faaliyetlerinizi (gübreleme, sulama vb.) anında günlüğe kaydedebilirsiniz.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/dashboard/farms"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-800 shadow-md transition hover:bg-zinc-50 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Tarla Ekle
          </Link>
          <a
            href="https://wa.me/#" // User can put their WA Business No
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-400 active:scale-95 border border-emerald-400/30"
          >
            <MessageSquare className="h-4 w-4" /> WhatsApp'tan Mesaj Gönder
          </a>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.name}
              href={card.href}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm transition-all duration-300 hover:border-emerald-200 hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-900 dark:hover:border-emerald-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{card.name}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {card.value}
                  </p>
                </div>
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white dark:bg-emerald-950/30 dark:text-emerald-400`}
                >
                  <Icon className="h-6 w-6" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Section layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Recent WA AI Insights */}
        <div className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm lg:col-span-2 dark:border-zinc-800/50 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Yapay Zeka Analiz & Sohbet Logu</h3>
            </div>
            <Link
              href="/dashboard/timeline"
              className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              Tümünü Gör <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {recentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                  <MessageSquare className="h-6 w-6" />
                </span>
                <p className="mt-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">Henüz WhatsApp mesaj kaydı bulunamadı.</p>
                <p className="text-xs text-zinc-500">Telefon numaranız ile WhatsApp'tan asistanımıza mesaj göndererek günlüğü doldurabilirsiniz.</p>
              </div>
            ) : (
              recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 transition hover:bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-950/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                      msg.intent === "activity"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        : msg.intent === "question"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                      {msg.intent === "activity" ? "Faaliyet Girişi" : msg.intent === "question" ? "Tarımsal Danışmanlık" : "Diğer"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {new Date(msg.created_at).toLocaleString("tr-TR")}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="font-bold text-zinc-500 mr-1.5">Çiftçi:</span>
                      <span className="text-zinc-800 dark:text-zinc-200">{msg.raw_message}</span>
                    </div>

                    <div className="text-sm border-l-2 border-emerald-500 pl-3">
                      <span className="font-bold text-emerald-600 mr-1.5">Yapay Zeka (Gemini):</span>
                      <span className="text-zinc-700 dark:text-zinc-300 italic">{msg.reply_message}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Quick Action and Tips */}
        <div className="space-y-6">
          {/* Tarımsal Öneri Kartı */}
          <div className="rounded-2xl border border-zinc-200/50 bg-gradient-to-b from-amber-50 to-orange-50 p-6 dark:border-zinc-800/50 dark:from-zinc-900 dark:to-amber-950/10">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <TrendingUp className="h-5 w-5" />
              <h4 className="font-bold">Haftalık Tarım İpuçları</h4>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-400">
              <li className="flex gap-2">
                <span className="text-amber-500">•</span>
                <span><strong>Gübreleme Zamanı:</strong> Yaz aylarında sulama öncesi gübre atmak verimi artırır.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500">•</span>
                <span><strong>Zararlı Kontrolü:</strong> Yaprak altlarındaki bit ve kırmızı örümcekleri düzenli kontrol edin.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500">•</span>
                <span><strong>Nem Seviyesi:</strong> Damlama sulama sistemleri su tasarrufu için kritik öneme sahiptir.</span>
              </li>
            </ul>
          </div>

          {/* Quick Setup Check */}
          <div className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-50">Demo WhatsApp Test Bilgisi</h4>
            <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
              Bu demo çalışmasında, tarlaları ve ürünleri web panelinde tanımlayabilir, ardından telefonunuzdan WhatsApp mesajı gönderdiğinizde bu tarlalarla eşleşmesini izleyebilirsiniz.
            </p>
            <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-950/40 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800">
              <strong>Örnek Mesajlar:</strong>
              <div className="mt-2 space-y-1.5">
                <p>• <em>"Bugün Ev Önü tarlasındaki domatesleri suladım."</em></p>
                <p>• <em>"Dere tarlasındaki biberlere 10kg gübre attım."</em></p>
                <p>• <em>"Domateslerim sarardı, ne yapabilirim?"</em></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
