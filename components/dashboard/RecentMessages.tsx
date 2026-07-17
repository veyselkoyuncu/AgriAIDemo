// RecentMessages — shows latest WhatsApp conversation logs with refined design
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Brain, ArrowRight, MessageSquare, Clock } from "lucide-react";
import PageSection from "@/components/ui/PageSection";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";

export default function RecentMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", user.id)
          .single();

        if (profile?.phone) {
          const { data } = await supabase
            .from("messages")
            .select("*")
            .eq("phone", profile.phone)
            .order("created_at", { ascending: false })
            .limit(5);
          setMessages(data || []);
        }
      } catch (err) {
        console.error("Recent messages fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [supabase]);

  return (
    <PageSection
      icon={Brain}
      title="Yapay Zeka Sohbet Geçmişi"
      action={
        <Link
          href="/dashboard/timeline"
          className="group flex items-center gap-1 text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400"
        >
          Tümünü Gör
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      }
    >
      {loading ? (
        <LoadingSpinner inline label="Mesajlar yükleniyor..." />
      ) : messages.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Henüz Mesaj Yok"
          description="WhatsApp asistanınıza mesaj gönderdiğinizde sohbet geçmişiniz burada görünecek."
        />
      ) : (
        <div className="space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className="group rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 transition-colors hover:bg-white hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                      msg.intent === "activity"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                        : msg.intent === "question"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                          : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {msg.intent === "activity"
                      ? "Faaliyet"
                      : msg.intent === "question"
                        ? "Soru"
                        : "Diğer"}
                  </span>
                  {idx === 0 && (
                    <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                      Son
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <Clock className="h-3 w-3" />
                  {new Date(msg.created_at).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="mr-1.5 font-semibold text-zinc-500">Siz:</span>
                  {msg.raw_message}
                </p>
                {msg.reply_message && (
                  <p className="text-sm border-l-2 border-emerald-400 pl-3 text-zinc-600 dark:text-zinc-400">
                    <span className="mr-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      Asistan:
                    </span>
                    {msg.reply_message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageSection>
  );
}
