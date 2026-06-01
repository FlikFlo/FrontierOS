import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

/**
 * Progress — thin horizontal bar with an optional trailing % label. The fill
 * colour is derived from the value: >=80 success, >=50 warning, else danger.
 */
export function Progress({ value, className, showLabel = true }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const color =
    clamped >= 80 ? "bg-success"
    : clamped >= 50 ? "bg-warning"
    : "bg-danger";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 h-1 rounded-full bg-white/[0.10] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", color)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-mono text-gray-light w-12 text-right tabular-nums">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
