"use client";

import { useState, type ReactNode } from "react";
import { Topbar } from "./topbar";
import { Sidebar } from "./sidebar";
import type { NavItem, NavSection } from "./types";

interface AppShellProps {
  brand?: ReactNode;
  topbarActions?: ReactNode;
  pinned?: NavItem;
  sections: NavSection[];
  sidebarFooter?: ReactNode;
  children: ReactNode;
}

/**
 * AppShell — the desktop layout: a fixed Topbar (3rem) + a fixed left Sidebar
 * (16rem / w-64), with the page content offset to clear both. Owns the mobile
 * drawer open/close state and wires the topbar hamburger to the sidebar.
 *
 * Responsive behaviour:
 *   - < lg : sidebar is an off-canvas drawer opened by the topbar hamburger.
 *   - >= lg: sidebar is permanently docked; content is pushed right by lg:pl-64.
 *
 * Drop this around your page tree in a layout.tsx (or a route-group layout):
 *   <AppShell brand={<Logo/>} sections={SECTIONS} pinned={HOME}>{children}</AppShell>
 */
export function AppShell({
  brand,
  topbarActions,
  pinned,
  sections,
  sidebarFooter,
  children,
}: AppShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Topbar brand={brand} actions={topbarActions} onMenuClick={() => setOpen(true)} />
      <Sidebar
        pinned={pinned}
        sections={sections}
        footer={sidebarFooter}
        open={open}
        onClose={() => setOpen(false)}
      />
      <main className="pt-12 lg:pl-64 min-h-svh">
        <div className="w-full p-4 sm:p-6 animate-fade-up">{children}</div>
      </main>
    </>
  );
}
