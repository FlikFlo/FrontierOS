"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem, NavSection } from "./types";

interface SidebarProps {
  /** Optional pinned item rendered above the sections (e.g. Home). */
  pinned?: NavItem;
  sections: NavSection[];
  /** Footer slot — profile link, settings, sign-out, version, etc. */
  footer?: ReactNode;
  /** Drawer open state on mobile (controlled by the parent / AppShell). */
  open: boolean;
  onClose: () => void;
  /** Small uppercase label above the nav (default "Navigation"). */
  heading?: string;
}

/**
 * Sidebar — fixed left rail (w-64) under the topbar. Sections collapse with a
 * chevron; the section containing the current route auto-expands. On mobile it
 * slides in as a drawer (translate-x) controlled by `open`; from `lg` up it is
 * always docked. Active item state is derived from the current pathname.
 *
 * Active styling lives in JS here (inset accent bar + tinted bg) so it travels
 * with the component; nothing depends on global `aside` selectors.
 */
export function Sidebar({ pinned, sections, footer, open, onClose, heading = "Navigation" }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const activeSectionId = useMemo(() => {
    for (const s of sections) {
      if (s.items.some((it) => pathname.startsWith(it.href))) return s.id;
    }
    return null;
  }, [sections, pathname]);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const activeStyle = {
    backgroundColor: "rgba(21,96,189,0.18)", // primary @ 18%
    boxShadow: "inset 2px 0 0 #1560BD",       // primary accent bar
  };

  return (
    <>
      {/* Mobile drawer backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          // svh excludes mobile browser chrome so the rail never overflows.
          "fixed left-0 top-12 h-[calc(100svh-3rem)] w-64 flex flex-col z-40 transition-transform duration-300",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{
          background: "rgba(10,12,16,0.95)",
          backdropFilter: "saturate(180%) blur(24px)",
          WebkitBackdropFilter: "saturate(180%) blur(24px)",
          borderRight: "1px solid rgba(21,96,189,0.20)", // Croat: primary-tinted edge
        }}
      >
        <div className="px-6 py-4 flex items-center justify-between">
          <span className="text-white/35 text-[10px] font-semibold uppercase tracking-[0.2em]">
            {heading}
          </span>
          <button
            onClick={onClose}
            className="lg:hidden text-white/30 hover:text-white/70 transition-colors p-1"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <div className="h-px bg-gradient-to-r from-primary/30 to-transparent mx-6 -mt-4 mb-1" />

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {pinned && (
            <>
              <SidebarLink item={pinned} active={pathname.startsWith(pinned.href)} activeStyle={activeStyle} />
              <div className="h-px bg-white/[0.05] mx-2 my-3" />
            </>
          )}

          {sections.map((section) => {
            const isOpen = !collapsed.has(section.id);
            const sectionActive = activeSectionId === section.id;
            const SectionIcon = section.icon;
            return (
              <div key={section.id} className="mb-1">
                <button
                  onClick={() => toggle(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[10.5px] font-semibold uppercase tracking-[0.15em] transition-colors",
                    sectionActive ? "text-white/85" : "text-white/35 hover:text-white/60"
                  )}
                >
                  <SectionIcon size={13} strokeWidth={1.75} className="flex-shrink-0" />
                  <span className="flex-1 text-left">{section.label}</span>
                  <ChevronDown
                    size={12}
                    className={cn("text-white/25 transition-transform flex-shrink-0", !isOpen && "-rotate-90")}
                  />
                </button>

                {isOpen && (
                  <div className="mt-0.5 ml-3 pl-3 border-l border-white/[0.05] space-y-0.5">
                    {section.items.map((item) => (
                      <SidebarLink
                        key={item.href}
                        item={item}
                        active={pathname.startsWith(item.href)}
                        activeStyle={activeStyle}
                        nested
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {footer && <div className="px-3 pb-4 pt-3 border-t border-white/[0.05]">{footer}</div>}
      </aside>
    </>
  );
}

function SidebarLink({
  item,
  active,
  activeStyle,
  nested = false,
}: {
  item: NavItem;
  active: boolean;
  activeStyle: React.CSSProperties;
  nested?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center rounded-xl text-[0.9rem] transition-colors",
        nested ? "gap-2.5 px-2.5 py-2" : "gap-3 px-3 py-2.5",
        active ? "text-white font-medium" : "text-white/45 hover:text-white/85 hover:bg-white/[0.04]"
      )}
      style={active ? activeStyle : undefined}
    >
      <Icon
        size={nested ? 14 : 16}
        strokeWidth={active ? 2 : 1.5}
        className={cn("flex-shrink-0", active ? "text-primary-light" : "text-white/35")}
      />
      <span className="flex-1">{item.label}</span>
      {typeof item.badge === "number" && item.badge > 0 && (
        <span className="flex-shrink-0 ml-1 h-[18px] min-w-[18px] px-1 rounded-full bg-danger flex items-center justify-center text-[10px] font-bold leading-none text-white">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  );
}
