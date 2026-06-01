"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  /** Diameter in pixels. */
  size?: number;
  /** Background — solid colour, gradient, or any CSS background string. */
  bg?: string;
  /** Emoji rendered centred. Takes precedence over `initials`. */
  emoji?: string | null;
  /** Fallback text (typically 1–2 char initials). */
  initials?: string;
  /** Image src — when set, renders a cover photo instead of emoji/initials. */
  src?: string | null;
  alt?: string;
  /** Tailwind class for the centred emoji/text size, e.g. "text-base". */
  textClassName?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Avatar — a circular badge showing a photo, emoji, or initials.
 *
 * Simplified from the source kit (the original also drew decorative
 * "character frames" via injected SVG — domain-specific, dropped here).
 */
export function Avatar({
  size = 40,
  bg = "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
  emoji,
  initials,
  src,
  alt = "",
  textClassName = "text-base",
  className,
  style,
}: AvatarProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full overflow-hidden text-white font-bold leading-none flex-shrink-0",
        textClassName,
        className
      )}
      style={{ width: size, height: size, background: src ? undefined : bg, ...style }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : emoji ? (
        <span className="leading-none">{emoji}</span>
      ) : (
        initials
      )}
    </div>
  );
}
