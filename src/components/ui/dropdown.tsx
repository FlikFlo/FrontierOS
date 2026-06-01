"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DropdownItem {
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  /** Render in danger red (destructive action). */
  destructive?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  /** The clickable element that opens the menu. */
  trigger: ReactNode;
  items: DropdownItem[];
  /** Horizontal alignment of the menu relative to the trigger. */
  align?: "left" | "right";
  className?: string;
}

/**
 * Dropdown — click-to-open menu with outside-click + Escape to close.
 *
 * Lightweight (no Radix). For a fully accessible roving-focus menu with
 * portal + collision handling, swap to @radix-ui/react-dropdown-menu —
 * see DESIGN_SYSTEM.md.
 */
export function Dropdown({ trigger, items, align = "right", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-2 min-w-[11rem] rounded-xl border border-white/[0.10] p-1.5 shadow-2xl backdrop-blur-xl animate-fade-up",
            align === "right" ? "right-0" : "left-0"
          )}
          style={{ background: "rgba(20,23,30,0.97)" }}
        >
          {items.map((it, i) => (
            <button
              key={i}
              role="menuitem"
              disabled={it.disabled}
              onClick={() => { it.onSelect(); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-left transition-colors disabled:opacity-40 disabled:pointer-events-none",
                it.destructive
                  ? "text-danger hover:bg-danger/10"
                  : "text-white/80 hover:bg-white/[0.07] hover:text-white"
              )}
            >
              {it.icon && <span className="flex-shrink-0">{it.icon}</span>}
              <span className="flex-1">{it.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
