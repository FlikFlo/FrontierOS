"use client";

import { Menu } from "lucide-react";
import { type ReactNode } from "react";

interface TopbarProps {
  /** Brand / logo node shown on the left (next to the mobile menu button). */
  brand?: ReactNode;
  /** Right-aligned slot — notifications bell, avatar, etc. */
  actions?: ReactNode;
  /** Called when the mobile hamburger is tapped (opens the sidebar drawer). */
  onMenuClick?: () => void;
  /** Hide the hamburger entirely (e.g. layouts with no sidebar). */
  hideMenuButton?: boolean;
}

/**
 * Topbar — fixed full-width bar, 3rem (h-12) tall, frosted glass. Sits above
 * the sidebar (z-50). On mobile it shows the hamburger that opens the drawer;
 * from `lg` up the hamburger is hidden since the sidebar is always visible.
 */
export function Topbar({ brand, actions, onMenuClick, hideMenuButton = false }: TopbarProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-3 sm:px-4"
      style={{
        background: "rgba(10,12,16,0.85)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-2">
        {!hideMenuButton && (
          <button
            onClick={onMenuClick}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        )}
        {brand}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  );
}
