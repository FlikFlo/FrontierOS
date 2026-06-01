"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

/**
 * Button — five variants, three sizes. Pure presentation, forwards ref +
 * all native button props. Brand fill comes from the `primary` / `danger`
 * theme tokens defined in globals.css.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 focus:outline-none disabled:opacity-40 disabled:pointer-events-none",
          {
            "bg-primary text-white hover:bg-primary-light active:bg-primary-dark": variant === "primary",
            "bg-white/[0.12] text-white hover:bg-white/[0.18] active:bg-white/[0.22]": variant === "secondary",
            "border border-white/[0.15] text-white bg-transparent hover:bg-white/[0.06]": variant === "outline",
            "text-white/50 hover:text-white hover:bg-white/[0.08]": variant === "ghost",
            "bg-danger/20 text-danger hover:bg-danger/30 border border-danger/20": variant === "danger",
          },
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
