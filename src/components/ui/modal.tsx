"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Max width class. Default `max-w-md`. */
  widthClassName?: string;
  /** Hide the top-right close button. */
  hideClose?: boolean;
}

/**
 * Modal — accessible centred dialog with a blurred backdrop.
 *
 * role="dialog" + aria-modal, Escape to close, body-scroll lock while open,
 * backdrop click closes. Built on plain React state (no Radix dependency) —
 * see DESIGN_SYSTEM.md for swapping in @radix-ui/react-dialog if you want
 * focus-trapping + portal behaviour out of the box.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  widthClassName = "max-w-md",
  hideClose = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-sheet-backdrop-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative w-full rounded-2xl border border-white/[0.10] p-5 shadow-2xl animate-fade-up",
          widthClassName
        )}
        style={{ background: "rgba(13,15,20,0.99)" }}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 mb-3">
            {title && <h2 className="text-base font-semibold text-white">{title}</h2>}
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 -mt-1 ml-auto text-white/40 hover:text-white transition-colors p-1"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
