"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Handshake,
  ShoppingCart,
  Package,
  Settings,
  Bell,
  Search,
  Activity,
} from "lucide-react";
import { AppShell } from "./app-shell";
import { BottomNav } from "./bottom-nav";
import { CommandPalette } from "../command-palette";
import { LangSwitcher } from "../ui/lang-switcher";
import { ThemeToggle } from "../ui/theme-toggle";
import { UserMenu } from "../ui/user-menu";
import type { Theme } from "@/lib/theme";
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
  overdueCount = 0,
  theme = "dark",
}: {
  children: ReactNode
  userEmail?: string | null
  overdueCount?: number
  theme?: Theme
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
      module: "calendar",
      section: {
        id: "planning",
        label: t("nav.sections.planning"),
        icon: CalendarDays,
        items: [
          { href: "/calendar", label: t("nav.calendar"), icon: CalendarDays },
          { href: "/activity", label: t("nav.activity"), icon: Activity },
        ],
      },
    },
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
    { module: "calendar", item: { href: "/calendar", label: t("nav.calendar"), icon: CalendarDays, badge: overdueCount } },
    { module: "crm", item: { href: "/clients", label: t("nav.clients"), icon: Users } },
    { module: "crm", item: { href: "/deals", label: t("nav.deals"), icon: Handshake } },
    { module: "crm", item: { href: "/orders", label: t("nav.orders"), icon: ShoppingCart } },
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
            <button
              onClick={() => window.dispatchEvent(new Event("fos:open-command"))}
              className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[12px] text-white/45 hover:text-white/80 transition-colors"
              aria-label={t("common.search")}
            >
              <Search size={13} />
              <kbd className="font-mono text-[10px] text-white/35">⌘K</kbd>
            </button>
            <button
              onClick={() => window.dispatchEvent(new Event("fos:open-command"))}
              className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label={t("common.search")}
            >
              <Search size={18} />
            </button>
            <ThemeToggle initial={theme} />
            <LangSwitcher />
            <Link
              href="/calendar"
              className="relative flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label={t("a11y.notifications")}
            >
              <Bell size={18} />
              {overdueCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold leading-none text-white">
                  {overdueCount > 9 ? "9+" : overdueCount}
                </span>
              )}
            </Link>
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
      <CommandPalette />
    </>
  );
}
