"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  /** Stable key + value reported to onChange. */
  value: string;
  label: string;
  /** Optional trailing count badge. */
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  /** "underline" (default) or "segmented" pill style. */
  variant?: "underline" | "segmented";
  className?: string;
}

/**
 * Tabs — controlled tab bar. Two looks:
 *   underline  — minimal, primary-coloured active underline
 *   segmented  — pill group on a translucent track
 *
 * Presentational only: you own the active `value` and render panels yourself.
 */
export function Tabs({ items, value, onChange, variant = "underline", className }: TabsProps) {
  if (variant === "segmented") {
    return (
      <div className={cn("inline-flex gap-1 rounded-xl bg-white/[0.06] p-1", className)} role="tablist">
        {items.map((it) => {
          const active = it.value === value;
          return (
            <button
              key={it.value}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(it.value)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                active ? "bg-primary text-white shadow" : "text-white/55 hover:text-white"
              )}
            >
              {it.label}
              {typeof it.count === "number" && (
                <span className={cn("ml-1.5 text-xs", active ? "text-white/80" : "text-white/35")}>
                  {it.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-1 border-b border-white/[0.08] overflow-x-auto no-scrollbar", className)} role="tablist">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cn(
              "relative px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
              active ? "text-white" : "text-white/45 hover:text-white/80"
            )}
          >
            {it.label}
            {typeof it.count === "number" && (
              <span className={cn("ml-1.5 text-xs", active ? "text-white/70" : "text-white/30")}>
                {it.count}
              </span>
            )}
            {active && (
              <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
