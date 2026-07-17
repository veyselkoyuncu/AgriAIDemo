// Navigation — shared sidebar navigation config

import {
  LayoutDashboard,
  Trees,
  Sprout,
  History,
  LucideProps,
} from "lucide-react";
import React from "react";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<LucideProps>;
}

export const NAV_ITEMS: NavItem[] = [
  { name: "Genel Durum", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tarlalarım", href: "/dashboard/farms", icon: Trees },
  { name: "Ürünlerim", href: "/dashboard/crops", icon: Sprout },
  { name: "Faaliyet Akışı", href: "/dashboard/timeline", icon: History },
];
