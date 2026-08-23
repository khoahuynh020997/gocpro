import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

const statusClass: Record<OrderStatus, string> = {
  moi: "bg-surface-2 text-ink",
  dang_giao: "bg-primary/10 text-primary",
  hoan_thanh: "bg-success/12 text-success",
  huy: "bg-danger/10 text-danger",
};

export function Badge({
  status,
  children,
  className,
}: {
  status?: OrderStatus;
  children: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-2.5 text-xs font-medium",
        status ? statusClass[status] : "bg-surface-2 text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
