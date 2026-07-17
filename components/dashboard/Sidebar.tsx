// Sidebar — premium navigation sidebar for the dashboard layout
'use client';

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sprout, X, LogOut, User, ChevronRight } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants/navigation";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  profile: { name?: string; phone?: string } | null;
  onLogout: () => void;
}

export default function Sidebar({ open, onClose, profile, onLogout }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-md lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-zinc-200/80 bg-white/90 backdrop-blur-md transition-transform duration-300 lg:static lg:translate-x-0 dark:border-zinc-800/80 dark:bg-zinc-900/90 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex h-20 items-center justify-between border-b border-zinc-200/50 px-6 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-600/20">
              <Sprout className="h-5 w-5 text-white" />
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                AgriAI <span className="text-emerald-500">Demo</span>
              </h1>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Akıllı Çiftçi Asistanı
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 lg:hidden dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "text-zinc-600 hover:bg-emerald-50/80 hover:text-emerald-600 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-emerald-400"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="border-t border-zinc-200/50 p-4 dark:border-zinc-800/50">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-100 transition-colors hover:bg-zinc-100 dark:bg-zinc-950/40 dark:ring-zinc-800 dark:hover:bg-zinc-950/60">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm">
              <User className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-zinc-900 dark:text-white">
                {profile?.name || "Değerli Çiftçimiz"}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {profile?.phone ? `+${profile.phone}` : "Telefon No Yok"}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 hover:shadow-sm dark:text-red-400 dark:hover:bg-red-950/20"
          >
            <LogOut className="h-5 w-5" />
            Çıkış Yap
          </button>
        </div>
      </aside>
    </>
  );
}
