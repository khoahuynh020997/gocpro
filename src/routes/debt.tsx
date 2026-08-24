import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { Field } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, NativeSelect } from "@/components/ui/input";
import { formatDate, formatVnd, formatVndShort, PAYMENT_METHOD_LABEL } from "@/lib/format";
import { dealerDebt } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";
import type { PaymentMethod } from "@/lib/types";
import { nowIso } from "@/lib/utils";

export const Route = createFileRoute("/debt")({ component: DebtPage });

function DebtPage() {
  const data = useAppStore((s) => s);
  const addPayment = useAppStore((s) => s.addPayment);
  const deletePayment = useAppStore((s) => s.deletePayment);
  const [open, setOpen] = useState(false);
  const [dealerId, setDealerId] = useState(data.dealers[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("transfer");

  const rows = useMemo(
    () =>
      data.dealers
        .map((d) => ({ dealer: d, debt: dealerDebt(data, d.id) }))
        .filter((r) => r.debt !== 0)
        .sort((a, b) => b.debt - a.debt),
    [data],
  );
  const total = rows.reduce((s, r) => s + Math.max(0, r.debt), 0);
  const payments = useMemo(
    () => [...data.payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12),
    [data.payments],
  );

  return (
    <div className="grid gap-5">
      <PageHeader
        kicker="Thu tiền"
        title="Công nợ"
        description="Đối chiếu đơn đã chốt với tiền đã thu — ghi thanh toán ngay tại đại lý."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Ghi thu
          </Button>
        }
      />

      <StatCard label="Tổng phải thu" value={formatVndShort(total)} hint={`${rows.length} đại lý còn nợ`} />

      {rows.length === 0 ? (
        <EmptyState icon={<Wallet className="size-5" />} title="Không còn công nợ" />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]">
          {rows.map((row) => (
            <li key={row.dealer.id}>
              <Link
                to="/dealers/$id"
                params={{ id: row.dealer.id }}
                className="flex items-center justify-between px-4 py-3"
              >
                <span>
                  <span className="block font-medium">{row.dealer.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Hạn mức {formatVndShort(row.dealer.creditLimit)}
                  </span>
                </span>
                <span
                  className={`text-sm font-medium tabular-nums ${
                    row.debt > row.dealer.creditLimit ? "text-destructive" : ""
                  }`}
                >
                  {formatVnd(row.debt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section>
        <h2 className="mb-3 font-display text-xl tracking-tight">Thu gần đây</h2>
        <ul className="divide-y divide-border rounded-xl bg-card shadow-[var(--shadow-border)]">
          {payments.map((p) => {
            const dealer = data.dealers.find((d) => d.id === p.dealerId);
            return (
              <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>
                  <span className="block font-medium">{dealer?.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(p.date)} · {PAYMENT_METHOD_LABEL[p.method]}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums text-success">+{formatVnd(p.amount)}</span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground"
                    onClick={() => deletePayment(p.id)}
                  >
                    Huỷ
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Ghi thanh toán">
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(amount);
              if (!n || !dealerId) return;
              addPayment({
                dealerId,
                orderId: null,
                amount: n,
                method,
                date: nowIso(),
                notes: "",
              });
              setAmount("");
              setOpen(false);
            }}
          >
            <Field label="Đại lý">
              <NativeSelect value={dealerId} onChange={(e) => setDealerId(e.target.value)}>
                {data.dealers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
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
                {Object.entries(PAYMENT_METHOD_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Button type="submit">Lưu</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
