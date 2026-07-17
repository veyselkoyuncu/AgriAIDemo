// RecentMessages — shows latest WhatsApp conversation logs
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Brain, ArrowRight, MessageSquare } from "lucide-react";
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
      title="Yapay Zeka Analiz & Sohbet Logu"
      action={
        <Link
          href="/dashboard/timeline"
          className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
        >
          Tümünü Gör <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      {loading ? (
        <LoadingSpinner inline />
      ) : messages.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Henüz Mesaj Yok"
          description="WhatsApp asistanınıza mesaj gönderdiğinizde burada göreceksiniz."
        />
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {messages.map((msg) => (
            <div key={msg.id} className="py-4 first:pt-0 last:pb-0">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-400">
                  {new Date(msg.created_at).toLocaleString("tr-TR")}
                </span>
                {msg.intent && (
                  <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {msg.intent}
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-1">
                {msg.raw_message || msg.reply_message}
              </p>
            </div>
          ))}
        </div>
      )}
    </PageSection>
  );
}
