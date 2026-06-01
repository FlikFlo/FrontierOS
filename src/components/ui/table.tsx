import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Table primitives — thin styled wrappers over native table elements.
 *
 * Compose them directly:
 *   <Table>
 *     <THead><TR><TH>Name</TH><TH>Status</TH></TR></THead>
 *     <TBody><TR><TD>…</TD><TD>…</TD></TR></TBody>
 *   </Table>
 *
 * Wrap in a scroll container on mobile (the kit's `.no-scrollbar` helps):
 *   <div className="overflow-x-auto no-scrollbar"> <Table>…</Table> </div>
 */
export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full border-collapse text-sm", className)} {...props} />;
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("", className)} {...props} />;
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("", className)} {...props} />;
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("border-b border-white/[0.06] transition-colors hover:bg-white/[0.03]", className)}
      {...props}
    />
  );
}

export function TH({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40",
        className
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-3 py-2.5 text-white/80 align-middle", className)} {...props} />;
}
