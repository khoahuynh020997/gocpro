import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Menu,
  Package,
  Plus,
  RotateCcw,
  Smartphone,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { to: "/", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/dealers", label: "Đại lý", icon: Store },
  { to: "/orders", label: "Đơn hàng", icon: ClipboardList },
  { to: "/shipping", label: "Vận chuyển", icon: Truck },
  { to: "/stats", label: "Thống kê", icon: BarChart3 },
] as const;

const MORE = [
  { to: "/products", label: "Sản phẩm", icon: Package },
  { to: "/visits", label: "Viếng thăm", icon: MapPin },
  { to: "/debt", label: "Công nợ", icon: Wallet },
] as const;

function asset(path: string) {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base}${path.replace(/^\//, "")}`;
}

function BrandMark({ size }: { size: "sm" | "md" }) {
  const px = size === "md" ? "size-9" : "size-8";
  return (
    <img
      src={asset("icon-192.png")}
      alt=""
      className={cn(px, "rounded-md bg-primary object-cover")}
    />
  );
}

function activePath(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function NavItem({
  to,
  label,
  icon: Icon,
  pathname,
  compact,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  pathname: string;
  compact?: boolean;
}) {
  const active = activePath(pathname, to);
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150",
        compact ? "h-12 flex-col justify-center gap-0.5 px-1 text-[10px]" : "h-11",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className={cn(compact ? "size-5" : "size-4")} strokeWidth={1.75} />
      <span>{label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const resetData = useAppStore((s) => s.resetData);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    void useAppStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const showFab =
    pathname === "/" ||
    pathname === "/orders" ||
    pathname === "/dealers" ||
    pathname === "/shipping";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card px-3 py-5 lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-2.5 px-2">
          <BrandMark size="md" />
          <span>
            <span className="block font-display text-lg leading-none tracking-tight">
              GốcPro
            </span>
            <span className="text-[11px] text-muted-foreground">Bán hàng phân bón</span>
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {PRIMARY.map((item) => (
            <NavItem key={item.to} {...item} pathname={pathname} />
          ))}
          <p className="mt-5 mb-1 px-3 text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Thêm
          </p>
          {MORE.map((item) => (
            <NavItem key={item.to} {...item} pathname={pathname} />
          ))}
        </nav>
        <a
          href={asset("install.html")}
          className="mb-1 flex h-11 items-center gap-2 rounded-md px-3 text-left text-xs text-muted-foreground hover:bg-muted"
        >
          <Smartphone className="size-3.5" />
          Cài ra màn hình iPhone
        </a>
        <button
          type="button"
          className="mb-3 flex h-11 items-center gap-2 rounded-md px-3 text-left text-xs text-muted-foreground hover:bg-muted"
          onClick={() => {
            if (confirm("Xóa hết dữ liệu trên máy này? Không hoàn tác được.")) resetData();
          }}
        >
          <RotateCcw className="size-3.5" />
          Xóa hết dữ liệu
        </button>
        <p className="px-3 text-[11px] text-muted-foreground">Lưu trên máy · offline</p>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-sm lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <BrandMark size="sm" />
          <span className="font-display text-lg tracking-tight">GốcPro</span>
        </Link>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-md text-foreground"
          onClick={() => setMoreOpen(true)}
          aria-label="Menu"
        >
          <Menu className="size-5" />
        </button>
      </header>

      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 pb-28 lg:px-8 lg:py-8 lg:pb-10">
          {children}
        </div>
      </main>

      {showFab ? (
        <Link
          to="/orders/new"
          className="fixed right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-border)] lg:hidden"
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
          aria-label="Tạo đơn hàng"
        >
          <Plus className="size-6" />
        </Link>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card/95 px-1 pt-1 backdrop-blur-sm lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {PRIMARY.map((item) => (
          <NavItem key={item.to} {...item} pathname={pathname} compact />
        ))}
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent title="Danh mục">
          <div className="grid gap-1">
            {[...PRIMARY, ...MORE].map((item) => (
              <NavItem key={item.to} {...item} pathname={pathname} />
            ))}
            <a
              href={asset("install.html")}
              className="mt-3 flex h-11 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted"
            >
              <Smartphone className="size-4" />
              Cài ra màn hình iPhone
            </a>
            <button
              type="button"
              className="flex h-11 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted"
              onClick={() => {
                if (confirm("Xóa hết dữ liệu trên máy này? Không hoàn tác được.")) {
                  resetData();
                  setMoreOpen(false);
                }
              }}
            >
              <RotateCcw className="size-4" />
              Xóa hết dữ liệu
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
