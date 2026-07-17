// WelcomeBanner — premium dashboard welcome section
"use client";

import Link from "next/link";
import { Plus, MessageSquare, ArrowRight } from "lucide-react";

export default function WelcomeBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 p-8 text-white shadow-xl shadow-emerald-950/20 dark:from-emerald-900 dark:via-emerald-800 dark:to-teal-950">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />

      <div className="relative">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Hoş Geldiniz! 🌿
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-emerald-100">
          WhatsApp üzerinden sesli veya yazılı mesaj göndererek tarlalarınızı,
          ekili ürünlerinizi ve tarımsal faaliyetlerinizi (gübreleme, sulama vb.)
          anında günlüğe kaydedebilirsiniz.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard/farms"
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-800 shadow-lg shadow-black/5 transition-all hover:bg-emerald-50 hover:shadow-xl active:scale-[0.97]"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Tarla Ekle
          </Link>
          <a
            href="https://wa.me/#"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all hover:bg-emerald-400 hover:shadow-xl active:scale-[0.97]"
          >
            <MessageSquare className="h-4 w-4" />
            WhatsApp&apos;tan Mesaj Gönder
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
