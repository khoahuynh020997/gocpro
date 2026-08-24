import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { exportCsv } from "@/lib/csv";
import { formatTons, formatVnd, formatVndShort } from "@/lib/format";
import {
  dealerBreakdown,
  monthlySeries,
  periodTotals,
  productBreakdown,
} from "@/lib/selectors";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/stats")({ component: StatsPage });

function StatsPage() {
  const data = useAppStore((s) => s);
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState<number | "year">(new Date().getMonth() + 1);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const monthNum = month === "year" ? undefined : month;
  const totals = useMemo(
    () => periodTotals(data, year, monthNum),
    [data, year, monthNum],
  );
  const series = useMemo(() => monthlySeries(data, year), [data, year]);
  const byProduct = useMemo(
    () => productBreakdown(data, year, monthNum),
    [data, year, monthNum],
  );
  const byDealer = useMemo(
    () => dealerBreakdown(data, year, monthNum),
    [data, year, monthNum],
  );

  const periodLabel = month === "year" ? `Năm ${year}` : `Tháng ${month}/${year}`;

  return (
    <div className="grid gap-5">
      <PageHeader
        kicker="Báo cáo"
        title="Thống kê"
        description="Tấn hàng và tiền — theo tháng, năm, sản phẩm, đại lý."
        action={
          <Button
            variant="outline"
            onClick={() =>
              exportCsv(
                `gocpro-${year}-${month}.csv`,
                ["Đại lý", "Tỉnh", "Số đơn", "Tấn", "Doanh thu", "Công nợ"],
                byDealer.map((r) => [
                  r.dealer.name,
                  r.dealer.province,
                  r.orders,
                  r.tons.toFixed(2),
                  Math.round(r.revenue),
                  Math.round(r.debt),
                ]),
              )
            }
          >
            <Download className="size-4" />
            Xuất CSV
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <NativeSelect
          className="w-32"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </NativeSelect>
        <NativeSelect
          className="w-40"
          value={month}
          onChange={(e) => {
            const v = e.target.value;
            setMonth(v === "year" ? "year" : Number(v));
          }}
        >
          <option value="year">Cả năm</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Tháng {i + 1}
            </option>
          ))}
        </NativeSelect>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Tấn hàng" value={formatTons(totals.tons)} hint={periodLabel} />
        <StatCard label="Doanh thu" value={formatVndShort(totals.revenue)} />
        <StatCard label="Số đơn" value={String(totals.orders)} />
        <StatCard label="Cước xe" value={formatVndShort(totals.freight)} />
        <StatCard
          label="Giá TB / tấn"
          value={
            totals.tons > 0 ? formatVndShort(totals.revenue / totals.tons) : "—"
          }
        />
      </section>

      <section className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="mb-3 font-display text-xl tracking-tight">Tấn theo tháng {year}</h2>
        <div className="h-56">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(value, name) =>
                    name === "tons"
                      ? [formatTons(Number(value)), "Tấn"]
                      : [formatVnd(Number(value)), "Doanh thu"]
                  }
                />
                <Bar dataKey="tons" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
          <h2 className="mb-3 font-display text-xl tracking-tight">Theo sản phẩm</h2>
          <ul className="divide-y divide-border">
            {byProduct.map((row) => (
              <li key={row.product.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{row.product.name}</span>
                  <span className="text-xs text-muted-foreground">{row.product.formula}</span>
                </span>
                <span className="text-right tabular-nums">
                  <span className="block">{formatTons(row.tons)}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatVndShort(row.revenue)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
          <h2 className="mb-3 font-display text-xl tracking-tight">Theo đại lý</h2>
          <ul className="divide-y divide-border">
            {byDealer.slice(0, 10).map((row) => (
              <li key={row.dealer.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{row.dealer.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {row.dealer.province} · {row.orders} đơn
                  </span>
                </span>
                <span className="text-right tabular-nums">
                  <span className="block">{formatTons(row.tons)}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatVndShort(row.revenue)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
