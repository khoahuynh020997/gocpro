import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-5 shadow-[0_1px_0_rgba(26,25,22,0.04)]",
        className,
      )}
      {...props}
    />
  );
}
