import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/field";
import { formatTons, formatVnd, todayIso } from "@/lib/format";
import {
  STATUS_LABEL,
  STATUS_OPTIONS,
  type Dealer,
  type OrderDetail,
  type OrderStatus,
  type Product,
  type Vehicle,
} from "@/lib/types";

export type OrderDraft = {
  dealerId: number;
  vehicleId: number | null;
  orderDate: string;
  status: OrderStatus;
  freightCost: number;
  notes: string;
  items: Array<{ productId: number; tons: number; unitPrice: number }>;
};

type Line = {
  key: string;
  productId: number;
  tons: string;
  unitPrice: string;
};

function newKey() {
  return Math.random().toString(36).slice(2);
}

export function OrderForm({
  dealers,
  products,
  vehicles,
  initial,
  submitting,
  submitLabel,
  onSubmit,
}: {
  dealers: Dealer[];
  products: Product[];
  vehicles: Vehicle[];
  initial?: OrderDetail;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (draft: OrderDraft) => void;
}) {
  const [dealerId, setDealerId] = useState(initial?.dealerId ?? dealers[0]?.id ?? 0);
  const [vehicleId, setVehicleId] = useState<number | 0>(initial?.vehicleId ?? 0);
  const [orderDate, setOrderDate] = useState(initial?.orderDate ?? todayIso());
  const [status, setStatus] = useState<OrderStatus>(initial?.status ?? "moi");
  const [freight, setFreight] = useState(
    String(initial?.freightCost ?? vehicles[0]?.freightCost ?? 0),
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [lines, setLines] = useState<Line[]>(() => {
    if (initial?.items.length) {
      return initial.items.map((item) => ({
        key: String(item.id),
        productId: item.productId,
        tons: String(item.tons),
        unitPrice: String(item.unitPrice),
      }));
    }
    const first = products[0];
    return [
      {
        key: newKey(),
        productId: first?.id ?? 0,
        tons: "1",
        unitPrice: String(first?.pricePerTon ?? 0),
      },
    ];
  });

  const totals = useMemo(() => {
    let tons = 0;
    let goods = 0;
    for (const line of lines) {
      const t = Number(line.tons) || 0;
      const p = Number(line.unitPrice) || 0;
      tons += t;
      goods += t * p;
    }
    const freightCost = Number(freight) || 0;
    return { tons, goods, freightCost, grand: goods + freightCost };
  }, [lines, freight]);

  function setProduct(key: string, productId: number) {
    const product = products.find((p) => p.id === productId);
    setLines((prev) =>
      prev.map((line) =>
        line.key === key
          ? {
              ...line,
              productId,
              unitPrice: String(product?.pricePerTon ?? line.unitPrice),
            }
          : line,
      ),
    );
  }

  function onVehicleChange(id: number) {
    setVehicleId(id);
    if (id === 0) return;
    const vehicle = vehicles.find((v) => v.id === id);
    if (vehicle) setFreight(String(vehicle.freightCost));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const items = lines
      .map((line) => ({
        productId: line.productId,
        tons: Number(line.tons),
        unitPrice: Number(line.unitPrice),
      }))
      .filter((item) => item.productId && item.tons > 0);
    if (!dealerId || items.length === 0) return;
    onSubmit({
      dealerId,
      vehicleId: vehicleId || null,
      orderDate,
      status,
      freightCost: Number(freight) || 0,
      notes,
      items,
    });
  }

  const selectClass =
    "h-11 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Đại lý">
          <select
            className={selectClass}
            value={dealerId}
            onChange={(e) => setDealerId(Number(e.target.value))}
            required
          >
            {dealers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ngày đơn">
          <Input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            required
          />
        </Field>
        <Field label="Xe vận chuyển">
          <select
            className={selectClass}
            value={vehicleId}
            onChange={(e) => onVehicleChange(Number(e.target.value))}
          >
            <option value={0}>Chưa gán xe</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.plate}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tiền cước (đ)">
          <Input
            type="number"
            min={0}
            step={1000}
            value={freight}
            onChange={(e) => setFreight(e.target.value)}
          />
        </Field>
        <Field label="Trạng thái">
          <select
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ghi chú">
          <Textarea
            rows={2}
            className="min-h-11"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú giao hàng, công trình…"
          />
        </Field>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-medium">Sản phẩm</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const first = products[0];
              setLines((prev) => [
                ...prev,
                {
                  key: newKey(),
                  productId: first?.id ?? 0,
                  tons: "1",
                  unitPrice: String(first?.pricePerTon ?? 0),
                },
              ]);
            }}
          >
            <Plus className="size-4" />
            Thêm dòng
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {lines.map((line) => (
            <div
              key={line.key}
              className="grid gap-2 rounded-lg bg-surface-2/70 p-3 md:grid-cols-[1fr_7rem_9rem_auto]"
            >
              <select
                className={selectClass}
                value={line.productId}
                onChange={(e) => setProduct(line.key, Number(e.target.value))}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={line.tons}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) =>
                      l.key === line.key ? { ...l, tons: e.target.value } : l,
                    ),
                  )
                }
                aria-label="Số tấn"
                placeholder="Tấn"
              />
              <Input
                type="number"
                min={0}
                step={1000}
                value={line.unitPrice}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) =>
                      l.key === line.key ? { ...l, unitPrice: e.target.value } : l,
                    ),
                  )
                }
                aria-label="Đơn giá"
                placeholder="Đơn giá"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 justify-self-end"
                onClick={() =>
                  setLines((prev) => prev.filter((l) => l.key !== line.key))
                }
                disabled={lines.length === 1}
                aria-label="Xoá dòng"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:flex md:gap-8">
          <Stat label="Sản lượng" value={formatTons(totals.tons)} />
          <Stat label="Tiền hàng" value={formatVnd(totals.goods)} />
          <Stat label="Cước xe" value={formatVnd(totals.freightCost)} />
          <Stat label="Tổng cộng" value={formatVnd(totals.grand)} strong />
        </div>
        <Button type="submit" disabled={submitting || !dealerId}>
          {submitting ? "Đang lưu…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Stat({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`tabular-nums ${strong ? "font-semibold text-primary" : "font-medium"}`}>
        {value}
      </p>
    </div>
  );
}
