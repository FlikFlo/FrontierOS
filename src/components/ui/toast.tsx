"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "warning" | "danger" | "info";

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

type ToastInput = Omit<Toast, "id" | "variant"> & { variant?: ToastVariant };

interface ToastContextValue {
  toast: (t: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

/** useToast() → call toast({ title, description?, variant? }) anywhere. */
export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
};

const ACCENT: Record<ToastVariant, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

/**
 * ToastProvider — wrap your app once. Stacks toasts bottom-right, each
 * auto-dismissing after `duration` (default 4s). Pure presentation +
 * local state; no external store.
 */
export function ToastProvider({
  children,
  duration = 4000,
}: {
  children: ReactNode;
  duration?: number;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((t: ToastInput) => {
    const id = (seq.current += 1);
    setToasts((prev) => [...prev, { ...t, id, variant: t.variant ?? "info" }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[80] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} duration={duration} onDone={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  duration,
  onDone,
}: {
  toast: Toast;
  duration: number;
  onDone: () => void;
}) {
  const Icon = ICONS[toast.variant];

  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [duration, onDone]);

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border border-white/[0.12] p-3.5 shadow-2xl backdrop-blur-xl animate-fade-up"
      style={{ background: "rgba(20,23,30,0.96)" }}
    >
      <Icon size={18} className={cn("flex-shrink-0 mt-0.5", ACCENT[toast.variant])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">{toast.title}</p>
        {toast.description && (
          <p className="text-[13px] text-white/55 leading-snug mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onDone}
        aria-label="Dismiss"
        className="text-white/30 hover:text-white transition-colors -mr-1 -mt-1 p-1"
      >
        <X size={15} />
      </button>
    </div>
  );
}
