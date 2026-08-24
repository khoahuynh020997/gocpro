import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { OrderStatusBadge, ShipmentStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import {
  bagsToTons,
  formatDate,
  formatTons,
  formatVnd,
  ORDER_STATUS_LABEL,
  orderTons,
  orderTotal,
  phoneDisplay,
} from "@/lib/format";
import { useAppStore } from "@/lib/store";
import type { OrderStatus, ShipmentStatus } from "@/lib/types";
import { nowIso } from "@/lib/utils";

export const Route = createFileRoute("/orders_/$id")({ component: OrderDetail });

function OrderDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const order = useAppStore((s) => s.orders.find((o) => o.id === id));
  const dealers = useAppStore((s) => s.dealers);
  const products = useAppStore((s) => s.products);
  const vehicles = useAppStore((s) => s.vehicles);
  const shipments = useAppStore((s) => s.shipments.filter((sh) => sh.orderId === id));
  const setOrderStatus = useAppStore((s) => s.setOrderStatus);
  const addShipment = useAppStore((s) => s.addShipment);
  const updateShipment = useAppStore((s) => s.updateShipment);
  const deleteOrder = useAppStore((s) => s.deleteOrder);

  if (!order) {
    return (
      <div className="grid gap-3">
        <p>Không tìm thấy đơn.</p>
        <Button asChild variant="outline">
          <Link to="/orders">Quay lại</Link>
        </Button>
      </div>
    );
  }

  const dealer = dealers.find((d) => d.id === order.dealerId);
  const shipment = shipments[0];
  const firstVehicle = vehicles[0];

  return (
    <div className="grid gap-5">
      <Link
        to="/orders"
        className="inline-flex h-11 w-fit items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Đơn hàng
      </Link>
      <PageHeader
        kicker={order.code}
        title={dealer?.name ?? "Đơn hàng"}
        description={`Tạo ${formatDate(order.createdAt)} · giao ${formatDate(order.deliveryDate)}`}
        action={<OrderStatusBadge status={order.status} />}
      />

      <section className="grid gap-3 rounded-xl bg-card p-4 shadow-[var(--shadow-border)] sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="text-xs text-muted-foreground">Trạng thái đơn</span>
          <NativeSelect
            value={order.status}
            onChange={(e) => setOrderStatus(order.id, e.target.value as OrderStatus)}
          >
            {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </NativeSelect>
        </label>
        {dealer ? (
          <Link
            to="/dealers/$id"
            params={{ id: dealer.id }}
            className="flex flex-col justify-center text-sm"
          >
            <span className="text-xs text-muted-foreground">Đại lý</span>
            <span className="font-medium">{dealer.name}</span>
            <span className="text-muted-foreground">
              {dealer.district}, {dealer.province}
            </span>
          </Link>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium">Sản phẩm</th>
              <th className="px-4 py-3 font-medium">Bao</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Tấn</th>
              <th className="px-4 py-3 text-right font-medium">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => {
              const p = products.find((x) => x.id === item.productId);
              return (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p?.name ?? item.productId}</p>
                    <p className="text-xs text-muted-foreground">{p?.formula}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{item.bags}</td>
                  <td className="hidden px-4 py-3 tabular-nums sm:table-cell">
                    {bagsToTons(item.bags, p?.bagKg ?? 50).toLocaleString("vi-VN", {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatVnd(item.bags * item.unitPrice)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {formatTons(orderTons(order, products))}
          </span>
          <span className="font-display text-2xl tracking-tight tabular-nums">
            {formatVnd(orderTotal(order))}
          </span>
        </div>
      </section>

      {order.notes ? (
        <p className="rounded-xl bg-card px-4 py-3 text-sm text-muted-foreground shadow-[var(--shadow-border)]">
          {order.notes}
        </p>
      ) : null}

      <section className="grid gap-3 rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl tracking-tight">Vận chuyển</h2>
          {!shipment ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                addShipment({
                  orderId: order.id,
                  vehicleId: firstVehicle?.id ?? null,
                  vehicle: firstVehicle?.name ?? "",
                  plate: firstVehicle?.plate ?? "",
                  driver: firstVehicle?.driver ?? "",
                  driverPhone: firstVehicle?.driverPhone ?? "",
                  freight: 0,
                  warehouse: "Kho Long Xuyên",
                  status: "pending",
                  departedAt: null,
                  deliveredAt: null,
                  notes: "",
                })
              }
            >
              Tạo chuyến
            </Button>
          ) : null}
        </div>
        {shipment ? (
          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <ShipmentStatusBadge status={shipment.status} />
              <span className="text-sm text-muted-foreground">{shipment.warehouse}</span>
            </div>
            <NativeSelect
              value={shipment.status}
              onChange={(e) => {
                const status = e.target.value as ShipmentStatus;
                updateShipment(shipment.id, {
                  status,
                  departedAt:
                    status === "in_transit" || status === "delivered"
                      ? shipment.departedAt ?? nowIso()
                      : shipment.departedAt,
                  deliveredAt: status === "delivered" ? nowIso() : null,
                });
              }}
            >
              <option value="pending">Chờ xe</option>
              <option value="loading">Đang xếp</option>
              <option value="in_transit">Đang chạy</option>
              <option value="delivered">Đã giao</option>
            </NativeSelect>
            <p className="text-sm">
              {shipment.vehicle || "Chưa gán xe"}
              {shipment.plate ? ` · ${shipment.plate}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {shipment.driver || "Chưa gán tài"}
              {shipment.driverPhone ? ` · ${phoneDisplay(shipment.driverPhone)}` : ""}
            </p>
            <p className="text-sm tabular-nums">
              Cước: {shipment.freight ? formatVnd(shipment.freight) : "chưa nhập"}
            </p>
            <Link to="/shipping" className="text-sm font-medium text-primary">
              Sổ vận chuyển
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Chưa có chuyến xe.</p>
        )}
      </section>

      <button
        type="button"
        className="text-sm text-destructive"
        onClick={() => {
          if (confirm("Xoá đơn này?")) {
            deleteOrder(order.id);
            void navigate({ to: "/orders" });
          }
        }}
      >
        Xoá đơn
      </button>
    </div>
  );
}
