import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink shadow-none outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-subtle focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
