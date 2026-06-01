"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "./types";

interface BottomNavProps {
  /** Flat list of destinations (keep to ~3–5 for thumb reach). */
  items: NavItem[];
}

/**
 * BottomNav — mobile-first tab bar pinned to the bottom edge. An alternative
 * to the sidebar drawer for app-like phone navigation (the source app uses
 * this pattern for its operational role). Hidden from `lg` up, where you'd
 * show the Sidebar instead.
 *
 * Pair with `pb-[calc(env(safe-area-inset-bottom)+4.5rem)]` on your main
 * content so the last items aren't hidden behind the bar.
 */
export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
      style={{
        background: "rgba(10,12,16,0.92)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1"
          >
            <div className="relative">
              <Icon
                size={20}
                strokeWidth={active ? 2 : 1.5}
                className={active ? "text-primary" : "text-white/45"}
              />
              {typeof item.badge === "number" && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 h-3.5 min-w-[14px] px-0.5 rounded-full bg-danger flex items-center justify-center text-[8px] font-bold leading-none text-white">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </div>
            <span
              className={cn(
                "text-[9px] font-medium leading-none",
                active ? "text-white" : "text-white/45"
              )}
            >
              {item.label}
            </span>
            {active && <span className="absolute bottom-0 h-0.5 w-6 bg-primary rounded-full" />}
          </Link>
        );
      })}
    </nav>
  );
}
