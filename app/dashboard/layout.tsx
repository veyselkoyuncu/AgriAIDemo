"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { LayoutDashboard, Trees, Sprout, History, LogOut, Menu, X, User } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }

        setUser(user);

        // Fetch user profile name and phone
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { name: "Genel Durum", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tarlalarım", href: "/dashboard/farms", icon: Trees },
    { name: "Ürünlerim", href: "/dashboard/crops", icon: Sprout },
    { name: "Faaliyet Akışı", href: "/dashboard/timeline", icon: History },
  ];

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
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile sidebar toggle button */}
      <div className="fixed top-4 left-4 z-40 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-600 shadow-md transition dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar backdrop for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-zinc-200/80 bg-white/90 backdrop-blur-md transition-transform duration-300 lg:static lg:translate-x-0 dark:border-zinc-800/80 dark:bg-zinc-900/90 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-20 items-center justify-between border-b border-zinc-200/50 px-6 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/20">
              <Sprout className="h-5 w-5 text-white" />
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                AgriAI <span className="text-emerald-500">Demo</span>
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Akıllı Çiftçi Asistanı</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 hover:bg-zinc-100 lg:hidden dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "text-zinc-600 hover:bg-emerald-50/50 hover:text-emerald-600 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-emerald-400"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Profile */}
        <div className="border-t border-zinc-200/50 p-4 dark:border-zinc-800/50">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950/40">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
              <User className="h-5 w-5" />
            </span>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold text-zinc-900 dark:text-white">
                {profile?.name || "Değerli Çiftçimiz"}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {profile?.phone ? `+${profile.phone}` : "Telefon No Yok"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
          >
            <LogOut className="h-5 w-5" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
