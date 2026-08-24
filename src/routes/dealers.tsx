import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Store } from "lucide-react";
import { useMemo, useState } from "react";
import { DealerForm, emptyDealerForm } from "@/components/dealer-form";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, NativeSelect } from "@/components/ui/input";
import { formatVndShort, LEVEL_LABEL, phoneDisplay, PROVINCES } from "@/lib/format";
import { dealerDebt } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";
import type { Dealer } from "@/lib/types";

export const Route = createFileRoute("/dealers")({ component: DealersPage });

function DealersPage() {
  const dealers = useAppStore((s) => s.dealers);
  const addDealer = useAppStore((s) => s.addDealer);
  const data = useAppStore((s) => s);
  const [q, setQ] = useState("");
  const [province, setProvince] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyDealerForm);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return dealers.filter((d) => {
      if (province !== "all" && d.province !== province) return false;
      if (!query) return true;
      return [d.name, d.owner, d.phone, d.district, d.province]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [dealers, q, province]);

  return (
    <div className="grid gap-5">
      <PageHeader
        kicker="Mạng lưới"
        title="Đại lý"
        description="Danh sách đại lý, nông hộ lớn — công nợ và hạn mức."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Thêm đại lý
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Tìm tên, chủ, SĐT, huyện…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <NativeSelect
          className="sm:w-48"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
        >
          <option value="all">Mọi tỉnh</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </NativeSelect>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Store className="size-5" />}
          title="Không có đại lý"
          hint="Thêm đại lý đầu tiên để ghi đơn."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((dealer) => (
            <DealerCard
              key={dealer.id}
              dealer={dealer}
              debt={dealerDebt(data, dealer.id)}
            />
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Thêm đại lý">
          <DealerForm
            value={form}
            onChange={setForm}
            onSubmit={() => {
              if (!form.name.trim()) return;
              addDealer({
                ...form,
                creditLimit: Number(form.creditLimit) || 0,
              });
              setForm(emptyDealerForm);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DealerCard({ dealer, debt }: { dealer: Dealer; debt: number }) {
  return (
    <li>
      <Link
        to="/dealers/$id"
        params={{ id: dealer.id }}
        className="block rounded-xl bg-card p-4 shadow-[var(--shadow-border)] transition-transform duration-150 active:scale-[0.99]"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{dealer.name}</p>
            <p className="text-sm text-muted-foreground">{dealer.owner}</p>
          </div>
          <Badge tone={dealer.level === "cap1" ? "primary" : "muted"}>
            {LEVEL_LABEL[dealer.level]}
          </Badge>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {dealer.district}, {dealer.province}
        </p>
        <p className="text-sm">{phoneDisplay(dealer.phone)}</p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Công nợ</span>
          <span
            className={
              debt > 0
                ? "font-medium tabular-nums text-destructive"
                : "tabular-nums text-success"
            }
          >
            {formatVndShort(debt)}
          </span>
        </div>
      </Link>
    </li>
  );
}
