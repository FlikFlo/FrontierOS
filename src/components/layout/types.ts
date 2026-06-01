import type { LucideIcon } from "lucide-react";

/** A single navigation destination. */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Optional count badge (e.g. unread alerts). */
  badge?: number;
}

/** A collapsible group of nav items in the sidebar. */
export interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}
