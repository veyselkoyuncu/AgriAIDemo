"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
  Sprout,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Database,
  BrainCircuit,
  CheckCircle2,
  Mic,
  Smartphone,
  Users,
} from "lucide-react";

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <svg
              className="h-10 w-10 animate-spin text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-80"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </span>
          </div>
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">
            Yönlendiriliyor...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/40 bg-white/80 shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur-lg dark:border-zinc-800/40 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md shadow-emerald-600/20">
              <Sprout className="h-5 w-5 text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              AgriAI <span className="text-emerald-500">Demo</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:from-emerald-500 hover:to-emerald-600 hover:shadow-emerald-600/30 active:scale-[0.97]"
            >
              Kayıt Ol
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8 lg:py-36">
          {/* Decorative gradient orbs */}
          <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-600/10" />
          <div className="pointer-events-none absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-600/10" />

          <div className="relative mx-auto max-w-5xl text-center">
            {/* Tagline */}
            <div className="animate-fade-in">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/50 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-300">
                <MessageSquare className="h-3.5 w-3.5" />
                WhatsApp Destekli Akıllı Günlük
              </span>
            </div>

            {/* Title */}
            <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-5xl lg:text-6xl leading-[1.08]">
              Sesli Mesajlarınızla
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Tarım Faaliyetlerinizi
              </span>{" "}
              Yönetin
            </h1>

            {/* Description */}
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">
              WhatsApp üzerinden göndereceğiniz sesli veya yazılı mesajları
              AI ile çözümleyin. Tarlalarınızı, ürünlerinizi
              ve faaliyet geçmişinizi zahmetsizce kaydedip takip edin.
            </p>

            {/* Actions */}
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-emerald-600/25 transition-all hover:from-emerald-500 hover:to-emerald-600 hover:shadow-emerald-600/35 active:scale-[0.97]"
              >
                Hemen Başla
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white/80 px-7 py-3.5 text-sm font-semibold text-zinc-700 shadow-sm backdrop-blur-sm transition-all hover:border-zinc-300 hover:bg-white hover:shadow-md active:scale-[0.97] dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Kullanıcı Girişi
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-xs text-zinc-400 dark:text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Ücretsiz Demo
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Güvenli Veri Depolama
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BrainCircuit className="h-4 w-4 text-emerald-500" />
                Yapay Zeka Destekli
              </span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative px-4 py-24 sm:px-6 lg:px-8">
          {/* Decorative divider */}
          <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800" />

          <div className="relative mx-auto max-w-5xl">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
                Sistem Nasıl Çalışır?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Yazılım kurulumları veya karmaşık formlar gerektirmez. Günlük
                işlerinizi konuşur gibi WhatsApp üzerinden kaydedersiniz.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-3">
              {/* Feature 1 */}
              <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 dark:border-zinc-800/50 dark:bg-zinc-900 dark:hover:border-emerald-700">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:via-emerald-600" />
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-400 dark:group-hover:bg-emerald-600">
                  <Mic className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  1. Sesli Mesaj Gönderin
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  &ldquo;Bugün Dere tarlasındaki domatesleri suladım&rdquo;
                  şeklinde ses kaydı veya yazılı mesaj fırlatın.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 dark:border-zinc-800/50 dark:bg-zinc-900 dark:hover:border-emerald-700">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:via-emerald-600" />
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-teal-500/25 dark:bg-teal-950/30 dark:text-teal-400 dark:group-hover:bg-teal-600">
                  <BrainCircuit className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  2. Yapay Zeka Çözümlesin
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Yapay zeka asistanımız niyetinizi anlar; tarla ismi, ürün,
                  kullanılan miktar ve faaliyet türünü otomatik olarak ayıklar.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 dark:border-zinc-800/50 dark:bg-zinc-900 dark:hover:border-emerald-700">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:via-emerald-600" />
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-amber-500/25 dark:bg-amber-950/30 dark:text-amber-400 dark:group-hover:bg-amber-600">
                  <Database className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  3. Zaman Çizelgesi Hazır
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Verileriniz Supabase paneline kaydedilir ve dikey zaman
                  çizelgesinde anında raporlanır.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 px-8 py-16 text-center shadow-xl shadow-emerald-950/20 dark:from-emerald-900 dark:via-emerald-800 dark:to-teal-950">
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-white/5" />

            <div className="relative">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Tarım Günlüğünüzü Tutmaya Başlayın
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-emerald-100">
                Sesli veya yazılı mesajlarınızla tarımsal faaliyetlerinizi
                kaydetmek için hemen ücretsiz hesap oluşturun.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-emerald-800 shadow-lg shadow-black/10 transition-all hover:bg-emerald-50 active:scale-[0.97]"
                >
                  <Smartphone className="h-4 w-4" />
                  Ücretsiz Kayıt Ol
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-xl border border-emerald-400/30 bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all hover:bg-emerald-400 active:scale-[0.97]"
                >
                  Giriş Yap
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/40 bg-white/80 backdrop-blur-sm dark:border-zinc-800/40 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-center text-xs text-zinc-500 sm:flex-row sm:text-left">
          <p>
            &copy; {new Date().getFullYear()} AgriAI Demo. Tüm hakları
            saklıdır.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="transition-colors hover:text-zinc-800 dark:hover:text-zinc-300"
            >
              Gizlilik Politikası
            </Link>
            <span className="inline-flex items-center gap-1.5 text-zinc-400">
              <Sprout className="h-3.5 w-3.5" />
              <span>AgriAI</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
