import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

/**
 * Card — the kit's primary surface. Frosted-glass look: translucent white
 * fill + backdrop blur + 1px hairline border + a top inner highlight. Reads
 * as a raised panel on the Croat ambient background.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.12] p-4 transition-all duration-150",
        "bg-white/[0.08] backdrop-blur-xl",
        "shadow-[0_1px_0_rgba(255,255,255,0.10)_inset]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold text-white", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}
