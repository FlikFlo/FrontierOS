"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Style the confirm button as destructive (red) — default true. */
  destructive?: boolean;
}

/**
 * ConfirmDialog — accessible replacement for window.confirm().
 *
 * Focus lands on Cancel (so an accidental Enter doesn't destroy anything),
 * Escape cancels, background scroll locks while open. The confirm button is
 * red by default; pass `destructive={false}` for a neutral primary action.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = true,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => cancelRef.current?.focus(), 0);
    const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby={body ? "confirm-body" : undefined}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/[0.10] p-5 shadow-2xl"
        style={{ background: "rgba(13,15,20,0.99)" }}
      >
        <h2 id="confirm-title" className="text-base font-semibold text-white">
          {title}
        </h2>
        {body && (
          <p id="confirm-body" className="mt-2 text-[13px] text-white/60 leading-relaxed">
            {body}
          </p>
        )}
        <div className="mt-5 flex gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/[0.10] bg-white/[0.04] py-2 text-sm font-medium text-white/80 hover:bg-white/[0.08] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              "flex-1 rounded-xl py-2 text-sm font-semibold text-white transition-colors " +
              (destructive
                ? "bg-danger hover:bg-danger/90"
                : "bg-primary hover:bg-primary-light")
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
