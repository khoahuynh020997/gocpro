import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { Field, FormGrid } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import { ShipmentStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, NativeSelect } from "@/components/ui/input";
import {
  formatDate,
  formatTons,
  formatVnd,
  orderTons,
  phoneDisplay,
  SHIPMENT_STATUS_LABEL,
} from "@/lib/format";
import { useAppStore } from "@/lib/store";
import type { Shipment, ShipmentStatus, Vehicle } from "@/lib/types";
import { nowIso } from "@/lib/utils";

export const Route = createFileRoute("/shipping")({ component: ShippingPage });

const COLUMNS: ShipmentStatus[] = ["pending", "loading", "in_transit", "delivered"];

const emptyVehicle: Omit<Vehicle, "id"> = {
  name: "",
  plate: "",
  driver: "",
  driverPhone: "",
  capacityTons: 15,
  notes: "",
};

function ShippingPage() {
  const shipments = useAppStore((s) => s.shipments);
  const vehicles = useAppStore((s) => s.vehicles);
  const orders = useAppStore((s) => s.orders);
  const dealers = useAppStore((s) => s.dealers);
  const products = useAppStore((s) => s.products);
  const updateShipment = useAppStore((s) => s.updateShipment);
  const addVehicle = useAppStore((s) => s.addVehicle);
  const updateVehicle = useAppStore((s) => s.updateVehicle);
  const deleteVehicle = useAppStore((s) => s.deleteVehicle);
  const [tab, setTab] = useState<"trips" | "fleet">("trips");
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [edit, setEdit] = useState<Shipment | null>(null);
  const [vehicleForm, setVehicleForm] = useState<Omit<Vehicle, "id">>(emptyVehicle);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleOpen, setVehicleOpen] = useState(false);

  const list = useMemo(() => {
    return shipments.filter((sh) =>
      filter === "all" ? true : sh.status !== "delivered",
    );
  }, [shipments, filter]);

  return (
    <div className="grid gap-5">
      <PageHeader
        kicker="Logistics"
        title="Vận chuyển"
        description="Danh sách xe (tên, biển số, SĐT tài) và cước từng chuyến."
        action={
          tab === "fleet" ? (
            <Button
              onClick={() => {
                setEditingVehicle(null);
                setVehicleForm(emptyVehicle);
                setVehicleOpen(true);
              }}
            >
              <Plus className="size-4" />
              Thêm xe
            </Button>
          ) : (
            <div className="flex rounded-md bg-muted p-1">
              <button
                type="button"
                className={`h-9 rounded-sm px-3 text-sm ${filter === "active" ? "bg-card shadow-[var(--shadow-border)]" : "text-muted-foreground"}`}
                onClick={() => setFilter("active")}
              >
                Đang chạy
              </button>
              <button
                type="button"
                className={`h-9 rounded-sm px-3 text-sm ${filter === "all" ? "bg-card shadow-[var(--shadow-border)]" : "text-muted-foreground"}`}
                onClick={() => setFilter("all")}
              >
                Tất cả
              </button>
            </div>
          )
        }
      />

      <div className="flex rounded-md bg-muted p-1 w-fit">
        <button
          type="button"
          className={`h-9 rounded-sm px-3 text-sm ${tab === "trips" ? "bg-card shadow-[var(--shadow-border)]" : "text-muted-foreground"}`}
          onClick={() => setTab("trips")}
        >
          Chuyến xe
        </button>
        <button
          type="button"
          className={`h-9 rounded-sm px-3 text-sm ${tab === "fleet" ? "bg-card shadow-[var(--shadow-border)]" : "text-muted-foreground"}`}
          onClick={() => setTab("fleet")}
        >
          Danh sách xe
        </button>
      </div>

      {tab === "fleet" ? (
        vehicles.length === 0 ? (
          <EmptyState
            icon={<Truck className="size-5" />}
            title="Chưa có xe"
            hint="Thêm xe với tên, biển số, tài xế và số điện thoại."
          />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {vehicles.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingVehicle(v);
                    setVehicleForm({
                      name: v.name,
                      plate: v.plate,
                      driver: v.driver,
                      driverPhone: v.driverPhone,
                      capacityTons: v.capacityTons,
                      notes: v.notes,
                    });
                    setVehicleOpen(true);
                  }}
                  className="w-full rounded-xl bg-card p-4 text-left shadow-[var(--shadow-border)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{v.name}</p>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {v.capacityTons} tấn
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-sm tracking-wide">{v.plate}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {v.driver} · {phoneDisplay(v.driverPhone)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Truck className="size-5" />}
          title="Không có chuyến"
          hint="Chốt đơn rồi tạo chuyến xe từ chi tiết đơn."
        />
      ) : (
        <>
          <div className="hidden gap-3 lg:grid lg:grid-cols-4">
            {COLUMNS.filter((c) => filter === "all" || c !== "delivered").map((col) => (
              <div key={col} className="min-w-0">
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {SHIPMENT_STATUS_LABEL[col]}
                </p>
                <div className="grid gap-2">
                  {list
                    .filter((sh) => sh.status === col)
                    .map((sh) => (
                      <ShipCard
                        key={sh.id}
                        shipment={sh}
                        dealerName={
                          dealers.find(
                            (d) =>
                              d.id === orders.find((o) => o.id === sh.orderId)?.dealerId,
                          )?.name ?? "—"
                        }
                        tons={(() => {
                          const o = orders.find((x) => x.id === sh.orderId);
                          return o ? orderTons(o, products) : 0;
                        })()}
                        onOpen={() => setEdit(sh)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
          <ul className="grid gap-2 lg:hidden">
            {list.map((sh) => {
              const order = orders.find((o) => o.id === sh.orderId);
              const dealer = dealers.find((d) => d.id === order?.dealerId);
              return (
                <li key={sh.id}>
                  <button
                    type="button"
                    onClick={() => setEdit(sh)}
                    className="w-full rounded-xl bg-card p-4 text-left shadow-[var(--shadow-border)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{dealer?.name ?? "—"}</p>
                      <ShipmentStatusBadge status={sh.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sh.vehicle || "Chưa gán xe"}
                      {sh.plate ? ` · ${sh.plate}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {sh.driverPhone ? phoneDisplay(sh.driverPhone) : "Chưa có SĐT"}
                      {sh.freight ? ` · cước ${formatVnd(sh.freight)}` : ""}
                      {order ? ` · ${formatTons(orderTons(order, products))}` : ""}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        {edit ? (
          <DialogContent title="Cập nhật chuyến xe">
            <ShipForm
              shipment={edit}
              vehicles={vehicles}
              onSave={(patch) => {
                updateShipment(edit.id, patch);
                setEdit(null);
              }}
            />
            <Link
              to="/orders/$id"
              params={{ id: edit.orderId }}
              className="mt-3 inline-block text-sm font-medium text-primary"
            >
              Mở đơn hàng
            </Link>
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog open={vehicleOpen} onOpenChange={setVehicleOpen}>
        <DialogContent title={editingVehicle ? "Sửa xe" : "Thêm xe"}>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!vehicleForm.name.trim() || !vehicleForm.plate.trim()) return;
              if (editingVehicle) updateVehicle(editingVehicle.id, vehicleForm);
              else addVehicle(vehicleForm);
              setVehicleOpen(false);
            }}
          >
            <FormGrid>
              <Field label="Tên xe">
                <Input
                  value={vehicleForm.name}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                  placeholder="Hino 15 tấn"
                  required
                />
              </Field>
              <Field label="Biển số">
                <Input
                  value={vehicleForm.plate}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })}
                  placeholder="51C-123.45"
                  required
                />
              </Field>
              <Field label="Tài xế">
                <Input
                  value={vehicleForm.driver}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driver: e.target.value })}
                />
              </Field>
              <Field label="SĐT tài xế">
                <Input
                  inputMode="tel"
                  value={vehicleForm.driverPhone}
                  onChange={(e) =>
                    setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })
                  }
                />
              </Field>
              <Field label="Tải trọng (tấn)">
                <Input
                  type="number"
                  min={1}
                  value={vehicleForm.capacityTons}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      capacityTons: Number(e.target.value) || 0,
                    })
                  }
                />
              </Field>
            </FormGrid>
            <div className="flex gap-2">
              <Button type="submit">{editingVehicle ? "Lưu xe" : "Thêm xe"}</Button>
              {editingVehicle ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (confirm("Xoá xe này khỏi danh mục?")) {
                      deleteVehicle(editingVehicle.id);
                      setVehicleOpen(false);
                    }
                  }}
                >
                  Xoá
                </Button>
              ) : null}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShipCard({
  shipment,
  dealerName,
  tons,
  onOpen,
}: {
  shipment: Shipment;
  dealerName: string;
  tons: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-lg bg-card p-3 text-left shadow-[var(--shadow-border)]"
    >
      <p className="truncate font-medium">{dealerName}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {shipment.vehicle || "Chưa gán xe"}
        {shipment.plate ? ` · ${shipment.plate}` : ""}
      </p>
      <p className="text-xs text-muted-foreground tabular-nums">
        {formatTons(tons)}
        {shipment.freight ? ` · ${formatVnd(shipment.freight)}` : ""}
      </p>
    </button>
  );
}

function ShipForm({
  shipment,
  vehicles,
  onSave,
}: {
  shipment: Shipment;
  vehicles: Vehicle[];
  onSave: (patch: Partial<Shipment>) => void;
}) {
  const [vehicleId, setVehicleId] = useState(shipment.vehicleId ?? "");
  const [vehicle, setVehicle] = useState(shipment.vehicle);
  const [plate, setPlate] = useState(shipment.plate);
  const [driver, setDriver] = useState(shipment.driver);
  const [driverPhone, setDriverPhone] = useState(shipment.driverPhone);
  const [freight, setFreight] = useState(String(shipment.freight || ""));
  const [warehouse, setWarehouse] = useState(shipment.warehouse);
  const [status, setStatus] = useState(shipment.status);

  function applyVehicle(id: string) {
    setVehicleId(id);
    const v = vehicles.find((x) => x.id === id);
    if (!v) return;
    setVehicle(v.name);
    setPlate(v.plate);
    setDriver(v.driver);
    setDriverPhone(v.driverPhone);
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          vehicleId: vehicleId || null,
          vehicle,
          plate,
          driver,
          driverPhone,
          freight: Number(freight.replace(/\D/g, "")) || 0,
          warehouse,
          status,
          departedAt:
            status === "in_transit" || status === "delivered"
              ? shipment.departedAt ?? nowIso()
              : shipment.departedAt,
          deliveredAt: status === "delivered" ? shipment.deliveredAt ?? nowIso() : null,
        });
      }}
    >
      <Field label="Trạng thái">
        <NativeSelect
          value={status}
          onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
        >
          {Object.entries(SHIPMENT_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Chọn xe có sẵn">
        <NativeSelect value={vehicleId} onChange={(e) => applyVehicle(e.target.value)}>
          <option value="">— Nhập tay —</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} · {v.plate}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <FormGrid>
        <Field label="Tên xe">
          <Input
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            placeholder="Hino 15 tấn"
          />
        </Field>
        <Field label="Biển số">
          <Input
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="51C-123.45"
          />
        </Field>
        <Field label="Tài xế">
          <Input value={driver} onChange={(e) => setDriver(e.target.value)} />
        </Field>
        <Field label="SĐT tài xế">
          <Input
            inputMode="tel"
            value={driverPhone}
            onChange={(e) => setDriverPhone(e.target.value)}
          />
        </Field>
        <Field label="Tiền cước (đ)">
          <Input
            inputMode="numeric"
            value={freight}
            onChange={(e) => setFreight(e.target.value)}
            placeholder="800000"
          />
        </Field>
        <Field label="Kho xuất">
          <NativeSelect value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
            <option>Kho Long Xuyên</option>
            <option>Kho Cần Thơ</option>
            <option>Kho Cao Lãnh</option>
          </NativeSelect>
        </Field>
      </FormGrid>
      {shipment.departedAt ? (
        <p className="text-xs text-muted-foreground">
          Xuất bến {formatDate(shipment.departedAt, "dd/MM HH:mm")}
        </p>
      ) : null}
      <Button type="submit">Lưu chuyến</Button>
    </form>
  );
}
