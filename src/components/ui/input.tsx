"use client";

import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

// Shared field styling. Note `text-base sm:text-sm`: iOS Safari auto-zooms
// into any input whose computed font-size is below 16px, so we keep 16px on
// mobile (text-base) and drop to 14px (text-sm) from the `sm` breakpoint up.
const INPUT_BASE =
  "w-full rounded-xl bg-white/[0.07] backdrop-blur-sm border border-white/[0.09] px-3 py-2.5 " +
  "text-base sm:text-sm " +
  "text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 " +
  "focus:bg-white/[0.10] transition-all duration-150";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={cn(INPUT_BASE, className)} {...props} />;
  }
);
Input.displayName = "Input";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-sm font-medium text-gray-light mb-1", className)} {...props} />;
}

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return <textarea ref={ref} className={cn(INPUT_BASE, "resize-none", className)} {...props} />;
  }
);
Textarea.displayName = "Textarea";

/**
 * Select — styled native <select>. Kept native (not Radix) for zero-JS
 * accessibility. See DESIGN_SYSTEM.md "Adaptation" for a Radix Select swap.
 */
export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(INPUT_BASE, className)} {...props} />;
}
