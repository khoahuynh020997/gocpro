import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { getDashboard } from "@/lib/server/sales";
import { formatDate, formatNumber, formatTons, formatVnd } from "@/lib/format";
import { MONTH_LABELS } from "@/lib/format";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboard(),
  });

  return (
    <AppShell title="Tổng quan">
      {error ? (
        <p className="text-sm text-danger">{error.message}</p>
      ) : isLoading || !data ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-2" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label={`Doanh số tháng ${data.month}`}
              value={formatVnd(data.thisMonth.goods)}
              hint={`${formatTons(data.thisMonth.tons)} · ${data.thisMonth.orderCount} đơn`}
            />
            <Kpi
              label={`Sản lượng năm ${data.year}`}
              value={formatTons(data.thisYear.tons)}
              hint={formatVnd(data.thisYear.goods)}
            />
            <Kpi
              label="Đơn đang xử lý"
              value={String(data.counts.openOrders)}
              hint={`${data.counts.dealers} đại lý`}
            />
            <Kpi
              label="Đội xe"
              value={String(data.counts.vehicles)}
              hint={`${data.counts.products} sản phẩm`}
            />
          </section>

          <Card className="p-4 md:p-6">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-medium">
                  Doanh số theo tháng
                </h2>
                <p className="text-sm text-muted">Năm {data.year} · tiền hàng</p>
              </div>
              <Link to="/sales" className="text-sm font-medium text-primary">
                Xem báo cáo
              </Link>
            </div>
            <MonthChart year={data.year} rows={data.monthly} />
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="font-display text-lg font-medium">Đơn gần đây</h2>
              <Link to="/orders" className="text-sm font-medium text-primary">
                Tất cả đơn
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="border-y border-border bg-surface-2/60 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Mã</th>
                    <th className="px-5 py-2.5 font-medium">Đại lý</th>
                    <th className="px-5 py-2.5 font-medium">Ngày</th>
                    <th className="px-5 py-2.5 font-medium">Tấn</th>
                    <th className="px-5 py-2.5 font-medium">Tiền hàng</th>
                    <th className="px-5 py-2.5 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 tabular-nums">
                        <Link
                          to="/orders/$id"
                          params={{ id: String(row.id) }}
                          className="font-medium text-primary"
                        >
                          #{row.id}
                        </Link>
                      </td>
                      <td className="px-5 py-3">{row.dealerName}</td>
                      <td className="px-5 py-3 tabular-nums">{formatDate(row.orderDate)}</td>
                      <td className="px-5 py-3 tabular-nums">{formatNumber(row.tons, 2)}</td>
                      <td className="px-5 py-3 tabular-nums">{formatVnd(row.goods)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-2 font-display text-2xl font-medium tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted">{hint}</p>
    </Card>
  );
}

function MonthChart({
  year,
  rows,
}: {
  year: number;
  rows: Array<{ period: string; tons: number; goods: number }>;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const byPeriod = new Map(rows.map((r) => [r.period, r]));
  const data = Array.from({ length: 12 }, (_, i) => {
    const period = `${year}-${String(i + 1).padStart(2, "0")}`;
    const row = byPeriod.get(period);
    return {
      name: MONTH_LABELS[i]?.replace("Tháng ", "T") ?? period,
      goods: row?.goods ?? 0,
      tons: row?.tons ?? 0,
    };
  });
  if (!ready) return <div className="h-64 rounded-lg bg-surface-2" />;
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "var(--color-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              v >= 1_000_000 ? `${Math.round(v / 1_000_000)}tr` : String(v)
            }
          />
          <Tooltip
            cursor={{ fill: "var(--color-surface-2)" }}
            formatter={(value, name) =>
              name === "goods"
                ? [formatVnd(Number(value)), "Tiền hàng"]
                : [formatTons(Number(value)), "Tấn"]
            }
          />
          <Bar dataKey="goods" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
