import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { formatNumber, formatTons, formatVnd, MONTH_LABELS } from "@/lib/format";
import { getSalesReport } from "@/lib/server/sales";

export const Route = createFileRoute("/sales")({ component: SalesPage });

function SalesPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [mode, setMode] = useState<"month" | "year">("month");

  const { data, isLoading, error } = useQuery({
    queryKey: ["sales", year, mode],
    queryFn: () => getSalesReport({ data: { year, mode } }),
  });

  const years = useMemo(() => {
    const list = [currentYear, currentYear - 1, currentYear - 2];
    return Array.from(new Set(list));
  }, [currentYear]);

  const chartRows = useMemo(() => {
    if (!data) return [];
    if (mode === "year") {
      return data.periods.map((p) => ({
        name: p.label,
        goods: p.goods,
        tons: p.tons,
      }));
    }
    const byPeriod = new Map(data.periods.map((p) => [p.period, p]));
    return Array.from({ length: 12 }, (_, i) => {
      const period = `${year}-${String(i + 1).padStart(2, "0")}`;
      const row = byPeriod.get(period);
      return {
        name: MONTH_LABELS[i]?.replace("Tháng ", "T") ?? period,
        goods: row?.goods ?? 0,
        tons: row?.tons ?? 0,
      };
    });
  }, [data, mode, year]);

  return (
    <AppShell title="Doanh số">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <ModeChip active={mode === "month"} onClick={() => setMode("month")}>
            Theo tháng
          </ModeChip>
          <ModeChip active={mode === "year"} onClick={() => setMode("year")}>
            Theo năm
          </ModeChip>
        </div>
        {mode === "month" ? (
          <select
            className="h-11 min-h-11 rounded-md border border-border bg-surface px-3 text-sm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-danger">{error.message}</p>
      ) : isLoading || !data ? (
        <div className="h-64 animate-pulse rounded-xl bg-surface-2" />
      ) : (
        <div className="flex flex-col gap-6">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Sản lượng" value={formatTons(data.totals.tons)} />
            <Kpi label="Doanh số hàng" value={formatVnd(data.totals.goods)} />
            <Kpi label="Tiền cước" value={formatVnd(data.totals.freight)} />
            <Kpi label="Số đơn" value={formatNumber(data.totals.orderCount)} />
          </section>

          <Card className="p-4 md:p-6">
            <h2 className="mb-4 font-display text-lg font-medium">
              {mode === "month" ? `Tiền hàng · năm ${year}` : "Tiền hàng theo năm"}
            </h2>
            <SingleChart rows={chartRows} dataKey="goods" format={(v) => formatVnd(v)} unit="Tiền hàng" />
          </Card>

          <Card className="p-4 md:p-6">
            <h2 className="mb-4 font-display text-lg font-medium">
              {mode === "month" ? `Sản lượng (tấn) · năm ${year}` : "Sản lượng theo năm"}
            </h2>
            <SingleChart rows={chartRows} dataKey="tons" format={(v) => formatTons(v)} unit="Tấn" />
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden p-0">
              <h2 className="px-5 py-4 font-display text-lg font-medium">Chi tiết kỳ</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead className="border-y border-border bg-surface-2/60 text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-5 py-2.5 font-medium">Kỳ</th>
                      <th className="px-5 py-2.5 font-medium">Tấn</th>
                      <th className="px-5 py-2.5 font-medium">Tiền hàng</th>
                      <th className="px-5 py-2.5 font-medium">Đơn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(mode === "month" ? chartRows.map((r, i) => ({
                      label: MONTH_LABELS[i] ?? r.name,
                      tons: r.tons,
                      goods: r.goods,
                      orderCount: data.periods.find((p) => p.period === `${year}-${String(i + 1).padStart(2, "0")}`)?.orderCount ?? 0,
                    })) : data.periods).map((row) => (
                      <tr key={row.label} className="border-b border-border last:border-0">
                        <td className="px-5 py-3">{row.label}</td>
                        <td className="px-5 py-3 tabular-nums">{formatNumber(row.tons, 2)}</td>
                        <td className="px-5 py-3 tabular-nums">{formatVnd(row.goods)}</td>
                        <td className="px-5 py-3 tabular-nums">
                          {"orderCount" in row ? row.orderCount : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="overflow-hidden p-0">
              <h2 className="px-5 py-4 font-display text-lg font-medium">Theo đại lý</h2>
              {data.byDealer.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-muted">Chưa có doanh số.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[24rem] text-left text-sm">
                    <thead className="border-y border-border bg-surface-2/60 text-xs uppercase tracking-wide text-muted">
                      <tr>
                        <th className="px-5 py-2.5 font-medium">Đại lý</th>
                        <th className="px-5 py-2.5 font-medium">Tấn</th>
                        <th className="px-5 py-2.5 font-medium">Tiền hàng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byDealer.map((row) => (
                        <tr key={row.dealerId} className="border-b border-border last:border-0">
                          <td className="px-5 py-3">{row.dealerName}</td>
                          <td className="px-5 py-3 tabular-nums">{formatNumber(row.tons, 2)}</td>
                          <td className="px-5 py-3 tabular-nums">{formatVnd(row.goods)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-2 font-display text-2xl font-medium tracking-tight tabular-nums">
        {value}
      </p>
    </Card>
  );
}

function ModeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "h-11 min-h-11 rounded-full bg-primary px-4 text-sm font-medium text-primary-fg"
          : "h-11 min-h-11 rounded-full bg-surface-2 px-4 text-sm font-medium text-ink hover:bg-border"
      }
    >
      {children}
    </button>
  );
}

function SingleChart({
  rows,
  dataKey,
  format,
  unit,
}: {
  rows: Array<{ name: string; goods: number; tons: number }>;
  dataKey: "goods" | "tons";
  format: (v: number) => string;
  unit: string;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <div className="h-64 rounded-lg bg-surface-2" />;
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "var(--color-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              dataKey === "goods" && v >= 1_000_000
                ? `${Math.round(v / 1_000_000)}tr`
                : String(v)
            }
          />
          <Tooltip
            cursor={{ fill: "var(--color-surface-2)" }}
            formatter={(value) => [format(Number(value)), unit]}
          />
          <Bar dataKey={dataKey} fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
