import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate, formatNumber, formatVnd } from "@/lib/format";
import { listOrders } from "@/lib/server/orders";
import { STATUS_LABEL, STATUS_OPTIONS, type OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/orders/")({ component: OrdersPage });

function OrdersPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => listOrders(),
  });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      if (!s) return true;
      return [row.dealerName, row.vehicleName, row.plate, `#${row.id}`]
        .join(" ")
        .toLowerCase()
        .includes(s);
    });
  }, [data, q, status]);

  return (
    <AppShell
      title="Đơn hàng"
      action={
        <Button asChild>
          <Link to="/orders/new">
            <Plus className="size-4" />
            Tạo đơn
          </Link>
        </Button>
      }
    >
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <Input
            className="pl-9"
            placeholder="Tìm đại lý, xe, mã đơn…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={status === "all"} onClick={() => setStatus("all")}>
            Tất cả
          </FilterChip>
          {STATUS_OPTIONS.map((s) => (
            <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>
              {STATUS_LABEL[s]}
            </FilterChip>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-xl bg-surface-2" />
      ) : filtered.length === 0 ? (
        <Card className="py-12 text-center text-muted">
          Chưa có đơn phù hợp. Tạo đơn mới từ đại lý và sản phẩm.
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="border-b border-border bg-surface-2/60 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Đơn</th>
                  <th className="px-5 py-2.5 font-medium">Đại lý</th>
                  <th className="px-5 py-2.5 font-medium">Ngày</th>
                  <th className="px-5 py-2.5 font-medium">Xe</th>
                  <th className="px-5 py-2.5 font-medium">Tấn</th>
                  <th className="px-5 py-2.5 font-medium">Tiền hàng</th>
                  <th className="px-5 py-2.5 font-medium">Cước</th>
                  <th className="px-5 py-2.5 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <Link
                        to="/orders/$id"
                        params={{ id: String(row.id) }}
                        className="font-medium text-primary tabular-nums"
                      >
                        #{row.id}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{row.dealerName}</td>
                    <td className="px-5 py-3 tabular-nums">{formatDate(row.orderDate)}</td>
                    <td className="px-5 py-3">
                      {row.vehicleName ? (
                        <span>
                          {row.vehicleName}
                          <span className="block text-xs text-muted">{row.plate}</span>
                        </span>
                      ) : (
                        <span className="text-muted">Chưa gán</span>
                      )}
                    </td>
                    <td className="px-5 py-3 tabular-nums">{formatNumber(row.tons, 2)}</td>
                    <td className="px-5 py-3 tabular-nums">{formatVnd(row.goods)}</td>
                    <td className="px-5 py-3 tabular-nums">{formatVnd(row.freightCost)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AppShell>
  );
}

function FilterChip({
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
          ? "h-11 min-h-11 rounded-full bg-primary px-3.5 text-sm font-medium text-primary-fg"
          : "h-11 min-h-11 rounded-full bg-surface-2 px-3.5 text-sm font-medium text-ink hover:bg-border"
      }
    >
      {children}
    </button>
  );
}
