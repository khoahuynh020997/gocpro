import { Field } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { bagsToTons, formatTons, formatVnd, tonsToBags } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import type { OrderItem, OrderStatus } from "@/lib/types";
import { nowIso } from "@/lib/utils";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type NewOrderSearch = { dealerId?: string };

export const Route = createFileRoute("/orders_/new")({
  validateSearch: (search: Record<string, unknown>): NewOrderSearch => ({
    dealerId: typeof search.dealerId === "string" ? search.dealerId : undefined,
  }),
  component: NewOrderPage,
});

type Line = OrderItem & { unit: "bags" | "tons" };

function NewOrderPage() {
  const { dealerId: presetDealer } = Route.useSearch();
  const navigate = useNavigate();
  const dealers = useAppStore((s) => s.dealers);
  const products = useAppStore((s) => s.products);
  const addOrder = useAppStore((s) => s.addOrder);
  const addShipment = useAppStore((s) => s.addShipment);

  const [dealerId, setDealerId] = useState(presetDealer ?? dealers[0]?.id ?? "");
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>(() => {
    const p = products[0];
    return p
      ? [{ productId: p.id, bags: 40, unitPrice: p.pricePerBag, unit: "bags" }]
      : [];
  });

  const totals = useMemo(() => {
    const bags = lines.reduce((s, l) => s + l.bags, 0);
    const revenue = lines.reduce((s, l) => s + l.bags * l.unitPrice, 0);
    const tons = lines.reduce((s, l) => {
      const p = products.find((x) => x.id === l.productId);
      return s + bagsToTons(l.bags, p?.bagKg ?? 50);
    }, 0);
    return { bags, revenue, tons };
  }, [lines, products]);

  function setLine(i: number, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((line, idx) => {
        if (idx !== i) return line;
        const next = { ...line, ...patch };
        const product = products.find((p) => p.id === next.productId);
        if (patch.productId && product) next.unitPrice = product.pricePerBag;
        return next;
      }),
    );
  }

  function submit(status: OrderStatus) {
    if (!dealerId || lines.length === 0) return;
    const id = addOrder({
      dealerId,
      items: lines.map(({ productId, bags, unitPrice }) => ({
        productId,
        bags,
        unitPrice,
      })),
      status,
      createdAt: nowIso(),
      deliveryDate: new Date(deliveryDate).toISOString(),
      notes,
    });
    if (status === "confirmed" || status === "shipping") {
      addShipment({
        orderId: id,
        vehicle: "",
        driver: "",
        driverPhone: "",
        warehouse: "Kho Long Xuyên",
        status: "pending",
        departedAt: null,
        deliveredAt: null,
        notes: "",
      });
    }
    void navigate({ to: "/orders/$id", params: { id } });
  }

  return (
    <div className="grid gap-5">
      <Link
        to="/orders"
        className="inline-flex h-11 w-fit items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Đơn hàng
      </Link>
      <PageHeader
        kicker="Bán hàng"
        title="Tạo đơn"
        description="Chọn đại lý, nhập số bao hoặc tấn — giá lấy từ bảng giá."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-4">
          <section className="grid gap-3 rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
            <Field label="Đại lý">
              <NativeSelect
                value={dealerId}
                onChange={(e) => setDealerId(e.target.value)}
              >
                {dealers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.district}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Ngày giao">
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </Field>
            <Field label="Ghi chú giao hàng">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </section>

          <section className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl tracking-tight">Mặt hàng</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const p = products[0];
                  if (!p) return;
                  setLines((prev) => [
                    ...prev,
                    { productId: p.id, bags: 20, unitPrice: p.pricePerBag, unit: "bags" },
                  ]);
                }}
              >
                <Plus className="size-4" /> Thêm dòng
              </Button>
            </div>
            {lines.map((line, i) => {
              const product = products.find((p) => p.id === line.productId);
              const bagKg = product?.bagKg ?? 50;
              const qty = line.unit === "tons" ? bagsToTons(line.bags, bagKg) : line.bags;
              return (
                <div
                  key={i}
                  className="grid gap-3 rounded-xl bg-card p-4 shadow-[var(--shadow-border)]"
                >
                  <div className="flex items-start gap-2">
                    <NativeSelect
                      className="flex-1"
                      value={line.productId}
                      onChange={(e) => setLine(i, { productId: e.target.value })}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · tồn {p.stockBags} bao
                        </option>
                      ))}
                    </NativeSelect>
                    <button
                      type="button"
                      className="flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                      onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label="Xoá dòng"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Field label={line.unit === "tons" ? "Số tấn" : "Số bao"}>
                      <Input
                        type="number"
                        min={0}
                        step={line.unit === "tons" ? 0.5 : 1}
                        value={Number.isFinite(qty) ? qty : 0}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          const bags =
                            line.unit === "tons" ? tonsToBags(n, bagKg) : Math.round(n);
                          setLine(i, { bags });
                        }}
                      />
                    </Field>
                    <Field label="Đơn vị">
                      <NativeSelect
                        value={line.unit}
                        onChange={(e) =>
                          setLine(i, { unit: e.target.value as Line["unit"] })
                        }
                      >
                        <option value="bags">Bao</option>
                        <option value="tons">Tấn</option>
                      </NativeSelect>
                    </Field>
                    <Field label="Giá / bao">
                      <Input
                        type="number"
                        min={0}
                        value={line.unitPrice}
                        onChange={(e) =>
                          setLine(i, { unitPrice: Number(e.target.value) })
                        }
                      />
                    </Field>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatTons(bagsToTons(line.bags, bagKg))} ·{" "}
                    {formatVnd(line.bags * line.unitPrice)}
                  </p>
                </div>
              );
            })}
          </section>
        </div>

        <aside className="h-fit rounded-xl bg-card p-4 shadow-[var(--shadow-border)] lg:sticky lg:top-6">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Tổng đơn
          </p>
          <p className="mt-2 font-display text-3xl tracking-tight tabular-nums">
            {formatVnd(totals.revenue)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {formatTons(totals.tons)} · {totals.bags.toLocaleString("vi-VN")} bao
          </p>
          <div className="mt-4 grid gap-2">
            <Button onClick={() => submit("confirmed")}>Chốt đơn</Button>
            <Button variant="outline" onClick={() => submit("draft")}>
              Lưu nháp
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
