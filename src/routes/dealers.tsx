import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createDealer,
  deleteDealer,
  listDealers,
  updateDealer,
} from "@/lib/server/dealers";
import type { Dealer } from "@/lib/types";

export const Route = createFileRoute("/dealers")({ component: DealersPage });

type FormState = {
  name: string;
  phone: string;
  address: string;
  region: string;
  notes: string;
};

const empty: FormState = {
  name: "",
  phone: "",
  address: "",
  region: "",
  notes: "",
};

function DealersPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["dealers"],
    queryFn: () => listDealers(),
  });
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Dealer | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter((d) =>
      [d.name, d.phone, d.region, d.address].join(" ").toLowerCase().includes(s),
    );
  }, [data, q]);

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        return updateDealer({ data: { id: editing.id, ...form } });
      }
      return createDealer({ data: form });
    },
    onSuccess: () => {
      toast.success(editing ? "Đã cập nhật đại lý" : "Đã thêm đại lý");
      setCreating(false);
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["dealers"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteDealer({ data: { id } }),
    onSuccess: () => {
      toast.success("Đã xoá đại lý");
      setConfirmId(null);
      void qc.invalidateQueries({ queryKey: ["dealers"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setForm(empty);
    setEditing(null);
    setCreating(true);
  }

  function openEdit(dealer: Dealer) {
    setForm({
      name: dealer.name,
      phone: dealer.phone,
      address: dealer.address,
      region: dealer.region,
      notes: dealer.notes,
    });
    setCreating(false);
    setEditing(dealer);
  }

  return (
    <AppShell
      title="Đại lý"
      action={
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Thêm đại lý
        </Button>
      }
    >
      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
        <Input
          className="pl-9"
          placeholder="Tìm tên, điện thoại, khu vực…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-surface-2" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-12 text-center text-muted">
          Chưa có đại lý. Thêm đại lý đầu tiên để tạo đơn hàng.
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((dealer) => (
            <Card key={dealer.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-medium">{dealer.name}</h2>
                  <p className="text-sm text-muted">{dealer.region || "Chưa ghi khu vực"}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-10 min-h-10" onClick={() => openEdit(dealer)} aria-label="Sửa">
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-10 min-h-10" onClick={() => setConfirmId(dealer.id)} aria-label="Xoá">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <dl className="grid gap-1 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Điện thoại</dt>
                  <dd className="tabular-nums">{dealer.phone || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Địa chỉ</dt>
                  <dd className="max-w-[14rem] text-right">{dealer.address || "—"}</dd>
                </div>
              </dl>
              {dealer.notes ? <p className="text-sm text-muted">{dealer.notes}</p> : null}
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={creating || Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
        title={editing ? "Sửa đại lý" : "Thêm đại lý"}
        description="Thông tin dùng khi lập đơn và báo cáo doanh số."
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Field label="Tên đại lý">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Điện thoại">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Khu vực">
            <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
          </Field>
          <Field label="Địa chỉ">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Ghi chú">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Đang lưu…" : "Lưu"}
          </Button>
        </form>
      </Dialog>

      <Dialog
        open={confirmId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmId(null);
        }}
        title="Xoá đại lý?"
        description="Chỉ xoá được đại lý chưa có đơn hàng."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmId(null)}>
            Huỷ
          </Button>
          <Button
            variant="danger"
            disabled={remove.isPending || confirmId === null}
            onClick={() => confirmId !== null && remove.mutate(confirmId)}
          >
            Xoá
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
