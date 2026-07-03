"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Sprout, MessageSquare, ArrowRight, ShieldCheck, Database, BrainCircuit } from "lucide-react";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push("/dashboard");
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Session check error:", err);
        setLoading(false);
      }
    };
    checkSession();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
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
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Yönlendiriliyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header / Navbar */}
      <header className="border-b border-zinc-200/50 bg-white/70 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/70 sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 shadow-md shadow-emerald-600/20">
              <Sprout className="h-5 w-5 text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              AgriAI <span className="text-emerald-500">Demo</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition active:scale-95"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-32 bg-gradient-to-b from-emerald-50/50 via-white to-zinc-50 dark:from-emerald-950/10 dark:via-zinc-950 dark:to-zinc-950">
          <div className="mx-auto max-w-5xl text-center">
            
            {/* Tagline */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30">
              <MessageSquare className="h-3.5 w-3.5" />
              WhatsApp Destekli Akıllı Günlük
            </span>

            {/* Title */}
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-6xl leading-[1.1]">
              Sesli Mesajlarınızla <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Tarım Faaliyetlerinizi
              </span>{" "}
              Yönetin
            </h1>

            {/* Description */}
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
              WhatsApp üzerinden göndereceğiniz sesli veya yazılı mesajları Gemini Yapay Zekası ile çözümleyin. Tarlalarınızı, ürünlerinizi ve faaliyet geçmişinizi zahmetsizce kaydedip takip edin.
            </p>

            {/* Actions */}
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition active:scale-95"
              >
                Hemen Başla <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white/80 px-6 py-3.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Kullanıcı Girişi
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-zinc-200/40 py-20 px-4 sm:px-6 lg:px-8 dark:border-zinc-800/40">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Sistem Nasıl Çalışır?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-sm text-zinc-500 dark:text-zinc-400">
              Yazılım kurulumları veya karmaşık formlar gerektirmez. Günlük işlerinizi konuşur gibi WhatsApp üzerinden kaydedersiniz.
            </p>

            <div className="mt-16 grid gap-8 sm:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <MessageSquare className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">1. Sesli Mesaj Gönderin</h3>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  *"Bugün Dere tarlasındaki domatesleri suladım"* şeklinde ses kaydı veya yazılı mesaj fırlatın.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
                  <BrainCircuit className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">2. Gemini AI Çözümlesin</h3>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Yapay zeka asistanımız niyetinizi anlar; tarla ismi, ürün, kullanılan miktar ve faaliyet türünü otomatik olarak ayıklar.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <Database className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">3. Zaman Çizelgesi Hazır</h3>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Verileriniz Supabase paneline kaydedilir ve dikey zaman çizelgesinde anında raporlanır.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-950 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-zinc-500">
          <p>&copy; {new Date().getFullYear()} AgriAI Demo. Tüm hakları saklıdır.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-zinc-800 dark:hover:text-zinc-300">
              Gizlilik Politikası
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
