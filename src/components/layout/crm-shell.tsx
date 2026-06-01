"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { LangSwitcher } from "../ui/lang-switcher";
import { UserMenu } from "../ui/user-menu";
import { useI18n } from "@/i18n/provider";
import { useRole } from "@/rbac/provider";
import { canAccess, moduleForPath, type ModuleKey } from "@/rbac/config";
import type { NavItem, NavSection } from "./types";

/* CRM navigation — labels are translation keys resolved at render; every
   section/item is tagged with a module and filtered by the active role, so the
   sidebar + bottom-nav only show what the role may access. A guard mirrors this
   for direct URL access (real enforcement lands with auth + RLS). */

/**
 * CrmShell — app chrome on the Croat AppShell (Topbar + docked Sidebar) plus a
 * mobile BottomNav. Role-aware: nav is filtered and unauthorized routes redirect
 * to the dashboard.
 */
export function CrmShell({
  children,
  userEmail = null,
}: {
  children: ReactNode
  userEmail?: string | null
}) {
  const { t } = useI18n();
  const { role } = useRole();
  const pathname = usePathname();
  const router = useRouter();

  // Guard: bounce direct navigation to a module the role can't access.
  useEffect(() => {
    const mod = moduleForPath(pathname);
    if (mod && !canAccess(role, mod)) router.replace("/dashboard");
  }, [pathname, role, router]);

  const pinned: NavItem | undefined = canAccess(role, "overview")
    ? { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard }
    : undefined;

  const sectionDefs: { module: ModuleKey; section: NavSection }[] = [
    {
      module: "crm",
      section: {
        id: "sales",
        label: t("nav.sections.sales"),
        icon: Handshake,
        items: [
          { href: "/clients", label: t("nav.clients"), icon: Users },
          { href: "/deals", label: t("nav.deals"), icon: Handshake },
          { href: "/orders", label: t("nav.orders"), icon: ShoppingCart },
        ],
      },
    },
    {
      module: "crm",
      section: {
        id: "catalog",
        label: t("nav.sections.catalog"),
        icon: Package,
        items: [{ href: "/products", label: t("nav.products"), icon: Package }],
      },
    },
    {
      module: "admin",
      section: {
        id: "system",
        label: t("nav.sections.system"),
        icon: Settings,
        items: [{ href: "/settings", label: t("nav.settings"), icon: Settings }],
      },
    },
  ];
  const sections = sectionDefs.filter((d) => canAccess(role, d.module)).map((d) => d.section);

  const bottomDefs: { module: ModuleKey; item: NavItem }[] = [
    { module: "overview", item: { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard } },
    { module: "crm", item: { href: "/clients", label: t("nav.clients"), icon: Users } },
    { module: "crm", item: { href: "/deals", label: t("nav.deals"), icon: Handshake } },
    { module: "crm", item: { href: "/orders", label: t("nav.orders"), icon: ShoppingCart } },
    { module: "admin", item: { href: "/settings", label: t("nav.settings"), icon: Settings } },
  ];
  const bottomNav = bottomDefs.filter((d) => canAccess(role, d.module)).map((d) => d.item);

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
            <UserMenu email={userEmail} />
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
