import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { OrderStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import {
  formatDate,
  formatTons,
  formatVndShort,
  ORDER_STATUS_LABEL,
  orderTons,
  orderTotal,
} from "@/lib/format";
import { useAppStore } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/orders")({ component: OrdersPage });

function OrdersPage() {
  const orders = useAppStore((s) => s.orders);
  const dealers = useAppStore((s) => s.dealers);
  const products = useAppStore((s) => s.products);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return [...orders]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((o) => {
        if (status !== "all" && o.status !== status) return false;
        if (!query) return true;
        const dealer = dealers.find((d) => d.id === o.dealerId);
        return [o.code, dealer?.name, dealer?.owner]
          .join(" ")
          .toLowerCase()
          .includes(query);
      });
  }, [orders, dealers, q, status]);

  return (
    <div className="grid gap-5">
      <PageHeader
        kicker="Bán hàng"
        title="Đơn hàng"
        description="Chốt đơn, theo dõi giao và đối chiếu tấn."
        action={
          <Button asChild>
            <Link to="/orders/new">
              <Plus className="size-4" />
              Tạo đơn
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Mã đơn, đại lý…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <NativeSelect
          className="sm:w-44"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Mọi trạng thái</option>
          {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </NativeSelect>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-5" />}
          title="Chưa có đơn"
          action={
            <Button asChild>
              <Link to="/orders/new">Tạo đơn đầu</Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]">
          {filtered.map((order) => {
            const dealer = dealers.find((d) => d.id === order.dealerId);
            return (
              <li key={order.id}>
                <Link
                  to="/orders/$id"
                  params={{ id: order.id }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{dealer?.name ?? "—"}</span>
                      <OrderStatusBadge status={order.status as OrderStatus} />
                    </span>
                    <span className="text-xs text-muted-foreground">
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
      )}
    </div>
  );
}
