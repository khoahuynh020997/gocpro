import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ClipboardList,
  MapPin,
  Package,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { OrderStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  formatDate,
  formatTons,
  formatVnd,
  formatVndShort,
  orderTons,
  orderTotal,
} from "@/lib/format";
import {
  dealerBreakdown,
  dealerDebt,
  monthlySeries,
  periodTotals,
} from "@/lib/selectors";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const dealers = useAppStore((s) => s.dealers);
  const products = useAppStore((s) => s.products);
  const orders = useAppStore((s) => s.orders);
  const shipments = useAppStore((s) => s.shipments);
  const data = useAppStore((s) => s);
  const [now] = useState(() => new Date());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const monthTot = useMemo(
    () => periodTotals(data, year, month),
    [data, year, month],
  );
  const yearTot = useMemo(() => periodTotals(data, year), [data, year]);
  const series = useMemo(
    () => monthlySeries(data, year).filter((r) => r.month <= month),
    [data, year, month],
  );
  const debtTotal = useMemo(
    () => dealers.reduce((s, d) => s + Math.max(0, dealerDebt(data, d.id)), 0),
    [dealers, data],
  );
  const inTransit = shipments.filter(
    (sh) => sh.status === "in_transit" || sh.status === "loading",
  ).length;
  const lowStock = products.filter((p) => p.stockBags < 200);
  const recent = [...orders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
  const topDebt = dealerBreakdown(data, year)
    .filter((r) => r.debt > 0)
    .sort((a, b) => b.debt - a.debt)
    .slice(0, 5);

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker="Sổ bán hàng"
        title="Tổng quan"
        description={`Tháng ${month}/${year} · ${dealers.length} đại lý · dữ liệu lưu trên máy, dùng được khi mất mạng.`}
        action={
          <Button asChild>
            <Link to="/orders/new">Tạo đơn</Link>
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Tấn tháng này"
          value={formatTons(monthTot.tons)}
          hint={`${yearTot.tons.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tấn cả năm`}
          icon={<Package className="size-4" />}
        />
        <StatCard
          label="Doanh thu tháng"
          value={formatVndShort(monthTot.revenue)}
          hint={`${formatVndShort(yearTot.revenue)} cả năm`}
          icon={<Wallet className="size-4" />}
        />
        <StatCard
          label="Công nợ"
          value={formatVndShort(debtTotal)}
          hint="Đã chốt chưa thu đủ"
          icon={<Store className="size-4" />}
        />
        <StatCard
          label="Xe đang chạy"
          value={String(inTransit)}
          hint={`${monthTot.orders} đơn trong tháng`}
          icon={<Truck className="size-4" />}
        />
      </section>

      {lowStock.length > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-warn/20 bg-warn/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
          <div className="min-w-0 text-sm">
            <p className="font-medium">Tồn kho thấp</p>
            <p className="text-muted-foreground">
              {lowStock.map((p) => `${p.name} (${p.stockBags} bao)`).join(" · ")}
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="ml-auto shrink-0">
            <Link to="/products">Kho</Link>
          </Button>
        </div>
      ) : null}

      <section className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
        <div className="mb-4 flex items-end justify-between gap-3 pr-16 lg:pr-0">
          <div>
            <h2 className="font-display text-xl tracking-tight">Tấn & doanh thu</h2>
            <p className="text-sm text-muted-foreground">Theo tháng · {year}</p>
          </div>
          <Link to="/stats" className="text-sm font-medium text-primary">
            Xem thống kê
          </Link>
        </div>
        <div className="h-64">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="tons"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <YAxis
                  yAxisId="rev"
                  orientation="right"
                  tickFormatter={(v: number) => `${Math.round(v / 1_000_000_000)}tỷ`}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(value, name) => {
                    if (name === "Tấn") return [formatTons(Number(value)), "Tấn"];
                    return [formatVnd(Number(value)), "Doanh thu"];
                  }}
                />
                <Bar
                  yAxisId="tons"
                  dataKey="tons"
                  name="Tấn"
                  fill="var(--color-chart-1)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
                <Line
                  yAxisId="rev"
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="var(--color-chart-4)"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl tracking-tight">Đơn gần đây</h2>
            <Link to="/orders" className="text-sm font-medium text-primary">
              Tất cả
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {recent.map((order) => {
              const dealer = dealers.find((d) => d.id === order.dealerId);
              return (
                <li key={order.id}>
                  <Link
                    to="/orders/$id"
                    params={{ id: order.id }}
                    className="flex items-center gap-3 py-3"
                  >
                    <span className="flex size-9 items-center justify-center rounded-md bg-muted">
                      <ClipboardList className="size-4 text-muted-foreground" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium">{dealer?.name}</span>
                        <OrderStatusBadge status={order.status} />
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {order.code} · {formatDate(order.createdAt)}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-medium tabular-nums">
                        {formatVndShort(orderTotal(order))}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatTons(orderTons(order, products))}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl tracking-tight">Công nợ cao</h2>
            <Link to="/debt" className="text-sm font-medium text-primary">
              Sổ nợ
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {topDebt.map((row) => (
              <li key={row.dealer.id}>
                <Link
                  to="/dealers/$id"
                  params={{ id: row.dealer.id }}
                  className="flex items-center gap-3 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{row.dealer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.dealer.district}, {row.dealer.province}
                    </span>
                  </span>
                  <span className="text-sm font-medium tabular-nums text-destructive">
                    {formatVndShort(row.debt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { to: "/dealers", label: "Đại lý", icon: Store },
          { to: "/products", label: "Sản phẩm", icon: Package },
          { to: "/shipping", label: "Vận chuyển", icon: Truck },
          { to: "/visits", label: "Viếng thăm", icon: MapPin },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-[var(--shadow-border)]"
          >
            <item.icon className="size-4 text-primary" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
