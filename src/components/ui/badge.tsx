import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "accent";
  children: React.ReactNode;
  className?: string;
}

/**
 * Badge / chip — small pill label. Each variant pairs a 20%-alpha fill with
 * a full-strength text colour drawn from the semantic theme tokens.
 */
export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-white/10 text-gray-light": variant === "default",
          "bg-success/20 text-success": variant === "success",
          "bg-warning/20 text-warning": variant === "warning",
          "bg-danger/20 text-danger": variant === "danger",
          "bg-accent/20 text-accent": variant === "accent",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
