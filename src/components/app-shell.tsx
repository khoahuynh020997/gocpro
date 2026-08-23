import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  LayoutDashboard,
  Menu,
  Package,
  Store,
  Truck,
  X,
  ClipboardList,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/dealers", label: "Đại lý", icon: Store },
  { to: "/products", label: "Sản phẩm", icon: Package },
  { to: "/orders", label: "Đơn hàng", icon: ClipboardList },
  { to: "/vehicles", label: "Vận chuyển", icon: Truck },
  { to: "/sales", label: "Doanh số", icon: BarChart3 },
] as const;

function NavLinks({
  onNavigate,
  pathname,
}: {
  onNavigate?: () => void;
  pathname: string;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active =
          item.to === "/"
            ? pathname === "/"
            : pathname === item.to || pathname.startsWith(`${item.to}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex h-11 min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150",
              active
                ? "bg-primary text-primary-fg"
                : "text-ink/80 hover:bg-surface-2",
            )}
          >
            <Icon className="size-4 shrink-0" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-surface px-4 py-6 md:flex md:flex-col">
        <Brand />
        <div className="mt-8 flex-1">
          <NavLinks pathname={pathname} />
        </div>
        <p className="text-xs text-subtle">Quản lý bán hàng đại lý</p>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Đóng menu"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col bg-surface px-4 py-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <Brand />
              <Button
                variant="ghost"
                size="icon"
                className="size-11"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
              >
                <X className="size-5" />
              </Button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="md:pl-60">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-sm md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Mở menu"
          >
            <Menu className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-medium tracking-tight md:text-2xl">
              {title}
            </h1>
          </div>
          {action}
        </header>
        <main className="px-4 py-6 pb-20 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-baseline gap-2">
      <span className="font-display text-2xl font-semibold tracking-tight text-primary">
        Gốc
      </span>
      <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold tracking-wide text-primary-fg uppercase">
        Pro
      </span>
    </Link>
  );
}
