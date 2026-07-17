// WelcomeBanner — dashboard welcome section with CTA buttons
"use client";

import Link from "next/link";
import { Plus, MessageSquare } from "lucide-react";

export default function WelcomeBanner() {
  return (
    <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white shadow-xl shadow-emerald-950/20 dark:from-emerald-800 dark:to-teal-900">
      <h2 className="text-3xl font-extrabold tracking-tight">Hoş Geldiniz! 🌿</h2>
      <p className="mt-2 max-w-2xl text-emerald-100">
        WhatsApp üzerinden sesli veya yazılı mesaj göndererek tarlalarınızı,
        ekili ürünlerinizi ve tarımsal faaliyetlerinizi (gübreleme, sulama vb.)
        anında günlüğe kaydedebilirsiniz.
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        <Link
          href="/dashboard/farms"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-800 shadow-md transition hover:bg-zinc-50 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Tarla Ekle
        </Link>
        <a
          href="https://wa.me/#"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-400 active:scale-95 border border-emerald-400/30"
        >
          <MessageSquare className="h-4 w-4" /> WhatsApp&apos;tan Mesaj Gönder
        </a>
      </div>
    </div>
  );
}
