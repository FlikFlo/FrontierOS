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
import { LangSwitcher } from "../ui/lang-switcher";
import { useI18n } from "@/i18n/provider";
import type { NavItem, NavSection } from "./types";

/* CRM navigation — stub destinations for the rebuild. Labels are translation
   keys resolved at render so the nav re-localizes instantly on switch. Every
   item resolves to a placeholder route so the shell is fully navigable. None
   uses "/" as href, so the kit's pathname.startsWith() active logic stays
   correct. */

/**
 * CrmShell — app chrome built on the Croat AppShell (Topbar + docked Sidebar)
 * plus a mobile BottomNav. The sidebar is a drawer below `lg` and docked from
 * `lg` up; the BottomNav shows only below `lg`. Content gets bottom padding on
 * mobile so the last rows clear the bottom bar.
 */
export function CrmShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  const pinned: NavItem = { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard };

  const sections: NavSection[] = [
    {
      id: "sales",
      label: t("nav.sections.sales"),
      icon: Handshake,
      items: [
        { href: "/clients", label: t("nav.clients"), icon: Users },
        { href: "/deals", label: t("nav.deals"), icon: Handshake },
        { href: "/orders", label: t("nav.orders"), icon: ShoppingCart },
      ],
    },
    {
      id: "catalog",
      label: t("nav.sections.catalog"),
      icon: Package,
      items: [{ href: "/products", label: t("nav.products"), icon: Package }],
    },
    {
      id: "system",
      label: t("nav.sections.system"),
      icon: Settings,
      items: [{ href: "/settings", label: t("nav.settings"), icon: Settings }],
    },
  ];

  const bottomNav: NavItem[] = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/clients", label: t("nav.clients"), icon: Users },
    { href: "/deals", label: t("nav.deals"), icon: Handshake },
    { href: "/orders", label: t("nav.orders"), icon: ShoppingCart },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

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
            <LangSwitcher />
            <button
              className="flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label={t("a11y.notifications")}
            >
              <Bell size={18} />
            </button>
            <Avatar initials="FO" size={28} bg="rgba(21,96,189,0.35)" />
          </>
        }
        pinned={pinned}
        sections={sections}
        sidebarFooter={
          <div className="px-2 text-[11px] text-white/30 font-mono">FrontierOS · v0.1</div>
        }
      >
        {/* bottom padding clears the mobile BottomNav */}
        <div className="pb-[calc(env(safe-area-inset-bottom)+4.5rem)] lg:pb-0">{children}</div>
      </AppShell>
      <BottomNav items={bottomNav} />
    </>
  );
}
