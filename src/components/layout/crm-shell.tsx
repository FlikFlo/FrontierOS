"use client";

import { type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Handshake,
  ShoppingCart,
  Package,
  Settings,
  Bell,
} from "lucide-react";
import { AppShell } from "./app-shell";
import { BottomNav } from "./bottom-nav";
import { Avatar } from "../ui/avatar";
import type { NavItem, NavSection } from "./types";

/* CRM navigation — stub destinations for the rebuild. Every item resolves to a
   placeholder route so the shell is fully navigable (active states, drawer,
   bottom-nav) at the checkpoint. None uses "/" as href so the kit's
   pathname.startsWith() active logic stays correct. */

const PINNED: NavItem = { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard };

const SECTIONS: NavSection[] = [
  {
    id: "sales",
    label: "Продажи",
    icon: Handshake,
    items: [
      { href: "/clients", label: "Клиенты", icon: Users },
      { href: "/deals", label: "Сделки", icon: Handshake },
      { href: "/orders", label: "Заказы", icon: ShoppingCart },
    ],
  },
  {
    id: "catalog",
    label: "Каталог",
    icon: Package,
    items: [{ href: "/products", label: "Продукты", icon: Package }],
  },
  {
    id: "system",
    label: "Система",
    icon: Settings,
    items: [{ href: "/settings", label: "Настройки", icon: Settings }],
  },
];

const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/clients", label: "Клиенты", icon: Users },
  { href: "/deals", label: "Сделки", icon: Handshake },
  { href: "/orders", label: "Заказы", icon: ShoppingCart },
  { href: "/settings", label: "Настройки", icon: Settings },
];

/**
 * CrmShell — app chrome built on the Croat AppShell (Topbar + docked Sidebar)
 * plus a mobile BottomNav. The sidebar is a drawer below `lg` and docked from
 * `lg` up; the BottomNav shows only below `lg`. Content gets bottom padding on
 * mobile so the last rows clear the bottom bar.
 */
export function CrmShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AppShell
        brand={
          <span className="text-accent text-xs font-semibold tracking-[0.2em]">
            FRONTIER&nbsp;OS
          </span>
        }
        topbarActions={
          <>
            <button
              className="flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Уведомления"
            >
              <Bell size={18} />
            </button>
            <Avatar initials="FO" size={28} bg="rgba(21,96,189,0.35)" />
          </>
        }
        pinned={PINNED}
        sections={SECTIONS}
        sidebarFooter={
          <div className="px-2 text-[11px] text-white/30 font-mono">FrontierOS · v0.1</div>
        }
      >
        {/* bottom padding clears the mobile BottomNav */}
        <div className="pb-[calc(env(safe-area-inset-bottom)+4.5rem)] lg:pb-0">{children}</div>
      </AppShell>
      <BottomNav items={BOTTOM_NAV} />
    </>
  );
}
