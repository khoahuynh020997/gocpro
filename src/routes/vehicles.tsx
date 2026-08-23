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
import { formatVnd } from "@/lib/format";
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  updateVehicle,
} from "@/lib/server/vehicles";
import type { Vehicle } from "@/lib/types";

export const Route = createFileRoute("/vehicles")({ component: VehiclesPage });

type FormState = {
  name: string;
  plate: string;
  driverPhone: string;
  freightCost: string;
  notes: string;
};

const empty: FormState = {
  name: "",
  plate: "",
  driverPhone: "",
  freightCost: "",
  notes: "",
};

function VehiclesPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => listVehicles(),
  });
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter((v) =>
      [v.name, v.plate, v.driverPhone].join(" ").toLowerCase().includes(s),
    );
  }, [data, q]);

  const payload = () => ({
    name: form.name,
    plate: form.plate,
    driverPhone: form.driverPhone,
    freightCost: Number(form.freightCost) || 0,
    notes: form.notes,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) return updateVehicle({ data: { id: editing.id, ...payload() } });
      return createVehicle({ data: payload() });
    },
    onSuccess: () => {
      toast.success(editing ? "Đã cập nhật xe" : "Đã thêm xe");
      setCreating(false);
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteVehicle({ data: { id } }),
    onSuccess: () => {
      toast.success("Đã xoá xe");
      setConfirmId(null);
      void qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setForm(empty);
    setEditing(null);
    setCreating(true);
  }

  function openEdit(vehicle: Vehicle) {
    setForm({
      name: vehicle.name,
      plate: vehicle.plate,
      driverPhone: vehicle.driverPhone,
      freightCost: String(vehicle.freightCost),
      notes: vehicle.notes,
    });
    setCreating(false);
    setEditing(vehicle);
  }

  return (
    <AppShell
      title="Vận chuyển"
      action={
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Thêm xe
        </Button>
      }
    >
      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
        <Input
          className="pl-9"
          placeholder="Tìm tên xe, biển số, SĐT tài xế…"
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
          Chưa có xe. Thêm xe với biển số, SĐT tài xế và tiền cước.
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((vehicle) => (
            <Card key={vehicle.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-medium">{vehicle.name}</h2>
                  <p className="font-mono text-sm tracking-wide text-primary">{vehicle.plate}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-10 min-h-10" onClick={() => openEdit(vehicle)} aria-label="Sửa">
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-10 min-h-10" onClick={() => setConfirmId(vehicle.id)} aria-label="Xoá">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <dl className="grid gap-1 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Tài xế</dt>
                  <dd className="tabular-nums">{vehicle.driverPhone || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Tiền cước</dt>
                  <dd className="tabular-nums font-medium">{formatVnd(vehicle.freightCost)}</dd>
                </div>
              </dl>
              {vehicle.notes ? <p className="text-sm text-muted">{vehicle.notes}</p> : null}
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
        title={editing ? "Sửa xe" : "Thêm xe"}
        description="Tên xe, biển số, số điện thoại tài xế và tiền cước mặc định."
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Field label="Tên xe">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Biển số">
            <Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} required />
          </Field>
          <Field label="SĐT tài xế">
            <Input value={form.driverPhone} onChange={(e) => setForm({ ...form, driverPhone: e.target.value })} />
          </Field>
          <Field label="Tiền cước (đ)">
            <Input
              type="number"
              min={0}
              step={1000}
              value={form.freightCost}
              onChange={(e) => setForm({ ...form, freightCost: e.target.value })}
              required
            />
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
        title="Xoá xe?"
        description="Không xoá được xe đã gắn với đơn hàng."
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
