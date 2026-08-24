import { DealerForm } from "@/components/dealer-form";
import { Field } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { OrderStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import {
  formatDate,
  formatTons,
  formatVnd,
  formatVndShort,
  LEVEL_LABEL,
  orderTons,
  orderTotal,
  phoneDisplay,
  VISIT_PURPOSE_LABEL,
} from "@/lib/format";
import { dealerDebt, dealerRevenue } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";
import type { DealerLevel, PaymentMethod, VisitPurpose } from "@/lib/types";
import { nowIso } from "@/lib/utils";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Phone, Plus } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/dealers_/$id")({ component: DealerDetail });

function DealerDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const dealer = useAppStore((s) => s.dealers.find((d) => d.id === id));
  const data = useAppStore((s) => s);
  const updateDealer = useAppStore((s) => s.updateDealer);
  const deleteDealer = useAppStore((s) => s.deleteDealer);
  const addPayment = useAppStore((s) => s.addPayment);
  const addVisit = useAppStore((s) => s.addVisit);
  const [tab, setTab] = useState<"orders" | "debt" | "visits">("orders");
  const [edit, setEdit] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("transfer");
  const [purpose, setPurpose] = useState<VisitPurpose>("ban_hang");
  const [visitNotes, setVisitNotes] = useState("");
  const [visitResult, setVisitResult] = useState("");

  const orders = useMemo(
    () =>
      data.orders
        .filter((o) => o.dealerId === id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data.orders, id],
  );
  const payments = useMemo(
    () =>
      data.payments
        .filter((p) => p.dealerId === id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.payments, id],
  );
  const visits = useMemo(
    () =>
      data.visits
        .filter((v) => v.dealerId === id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.visits, id],
  );

  if (!dealer) {
    return (
      <div className="grid gap-4">
        <p>Không tìm thấy đại lý.</p>
        <Button asChild variant="outline">
          <Link to="/dealers">Quay lại</Link>
        </Button>
      </div>
    );
  }

  const debt = dealerDebt(data, dealer.id);
  const revenue = dealerRevenue(data, dealer.id);
  const form = {
    name: dealer.name,
    owner: dealer.owner,
    phone: dealer.phone,
    address: dealer.address,
    province: dealer.province,
    district: dealer.district,
    level: dealer.level,
    creditLimit: dealer.creditLimit,
    notes: dealer.notes,
  };

  return (
    <div className="grid gap-5">
      <Link
        to="/dealers"
        className="inline-flex h-11 w-fit items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Danh sách đại lý
      </Link>
      <PageHeader
        kicker={LEVEL_LABEL[dealer.level]}
        title={dealer.name}
        description={`${dealer.owner} · ${dealer.district}, ${dealer.province}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEdit(true)}>
              Sửa
            </Button>
            <Button asChild>
              <Link to="/orders/new" search={{ dealerId: dealer.id }}>
                Tạo đơn
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <a
          href={`tel:${dealer.phone}`}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-card px-3 shadow-[var(--shadow-border)]"
        >
          <Phone className="size-4" />
          {phoneDisplay(dealer.phone)}
        </a>
        <Badge tone={debt > dealer.creditLimit ? "danger" : "muted"}>
          Hạn mức {formatVndShort(dealer.creditLimit)}
        </Badge>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Công nợ" value={formatVndShort(debt)} />
        <StatCard label="Doanh thu" value={formatVndShort(revenue)} />
        <StatCard
          label="Số đơn"
          value={String(orders.filter((o) => o.status !== "cancelled").length)}
          className="col-span-2 lg:col-span-1"
        />
      </section>

      {dealer.notes ? (
        <p className="rounded-xl bg-card px-4 py-3 text-sm text-muted-foreground shadow-[var(--shadow-border)]">
          {dealer.notes}
        </p>
      ) : null}

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {(
          [
            ["orders", "Đơn hàng"],
            ["debt", "Công nợ"],
            ["visits", "Viếng thăm"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`h-10 flex-1 rounded-md text-sm font-medium ${
              tab === key
                ? "bg-card text-foreground shadow-[var(--shadow-border)]"
                : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "orders" ? (
        <ul className="divide-y divide-border rounded-xl bg-card shadow-[var(--shadow-border)]">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                to="/orders/$id"
                params={{ id: order.id }}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{order.code}</span>
                    <OrderStatusBadge status={order.status} />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </span>
                </span>
                <span className="text-right text-sm">
                  <span className="block tabular-nums">{formatVndShort(orderTotal(order))}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTons(orderTons(order, data.products))}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "debt" ? (
        <div className="grid gap-3">
          <Button onClick={() => setPayOpen(true)} className="w-fit">
            <Plus className="size-4" /> Ghi thanh toán
          </Button>
          <ul className="divide-y divide-border rounded-xl bg-card shadow-[var(--shadow-border)]">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>
                  <span className="block font-medium">{formatDate(p.date)}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.method === "cash"
                      ? "Tiền mặt"
                      : p.method === "transfer"
                        ? "Chuyển khoản"
                        : "Séc"}
                  </span>
                </span>
                <span className="font-medium tabular-nums text-success">
                  +{formatVnd(p.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === "visits" ? (
        <div className="grid gap-3">
          <Button onClick={() => setVisitOpen(true)} className="w-fit">
            <Plus className="size-4" /> Ghi viếng thăm
          </Button>
          <ul className="grid gap-2">
            {visits.map((v) => (
              <li key={v.id} className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
                <div className="flex items-center justify-between">
                  <Badge>{VISIT_PURPOSE_LABEL[v.purpose]}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(v.date)}</span>
                </div>
                <p className="mt-2 text-sm">{v.notes}</p>
                {v.result ? (
                  <p className="mt-1 text-sm text-muted-foreground">{v.result}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        className="text-sm text-destructive"
        onClick={() => {
          if (confirm("Xoá đại lý này?")) {
            deleteDealer(dealer.id);
            void navigate({ to: "/dealers" });
          }
        }}
      >
        Xoá đại lý
      </button>

      <Dialog open={edit} onOpenChange={setEdit}>
        <DialogContent title="Sửa đại lý">
          <DealerForm
            value={form}
            onChange={(next) =>
              updateDealer(dealer.id, {
                ...next,
                level: next.level as DealerLevel,
              })
            }
            onSubmit={() => setEdit(false)}
            submitLabel="Cập nhật"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent title="Ghi thanh toán">
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(amount);
              if (!n) return;
              addPayment({
                dealerId: dealer.id,
                orderId: null,
                amount: n,
                method,
                date: nowIso(),
                notes: "",
              });
              setAmount("");
              setPayOpen(false);
            }}
          >
            <Field label="Số tiền">
              <Input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Field>
            <Field label="Hình thức">
              <NativeSelect
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              >
                <option value="transfer">Chuyển khoản</option>
                <option value="cash">Tiền mặt</option>
                <option value="check">Séc / UNC</option>
              </NativeSelect>
            </Field>
            <Button type="submit">Lưu</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={visitOpen} onOpenChange={setVisitOpen}>
        <DialogContent title="Ghi viếng thăm">
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              addVisit({
                dealerId: dealer.id,
                date: nowIso(),
                purpose,
                notes: visitNotes,
                result: visitResult,
              });
              setVisitNotes("");
              setVisitResult("");
              setVisitOpen(false);
            }}
          >
            <Field label="Mục đích">
              <NativeSelect
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as VisitPurpose)}
              >
                <option value="ban_hang">Bán hàng</option>
                <option value="thu_no">Thu nợ</option>
                <option value="cham_soc">Chăm sóc</option>
                <option value="giao_hang">Giao hàng</option>
              </NativeSelect>
            </Field>
            <Field label="Nội dung">
              <Textarea value={visitNotes} onChange={(e) => setVisitNotes(e.target.value)} />
            </Field>
            <Field label="Kết quả">
              <Input value={visitResult} onChange={(e) => setVisitResult(e.target.value)} />
            </Field>
            <Button type="submit">Lưu</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
