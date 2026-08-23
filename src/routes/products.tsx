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
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from "@/lib/server/products";
import type { Product } from "@/lib/types";

export const Route = createFileRoute("/products")({ component: ProductsPage });

type FormState = {
  name: string;
  sku: string;
  category: string;
  unit: string;
  pricePerTon: string;
  notes: string;
};

const empty: FormState = {
  name: "",
  sku: "",
  category: "",
  unit: "tấn",
  pricePerTon: "",
  notes: "",
};

function ProductsPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => listProducts(),
  });
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter((p) =>
      [p.name, p.sku, p.category].join(" ").toLowerCase().includes(s),
    );
  }, [data, q]);

  const payload = () => ({
    name: form.name,
    sku: form.sku,
    category: form.category,
    unit: form.unit || "tấn",
    pricePerTon: Number(form.pricePerTon) || 0,
    notes: form.notes,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) return updateProduct({ data: { id: editing.id, ...payload() } });
      return createProduct({ data: payload() });
    },
    onSuccess: () => {
      toast.success(editing ? "Đã cập nhật sản phẩm" : "Đã thêm sản phẩm");
      setCreating(false);
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteProduct({ data: { id } }),
    onSuccess: () => {
      toast.success("Đã xoá sản phẩm");
      setConfirmId(null);
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setForm(empty);
    setEditing(null);
    setCreating(true);
  }

  function openEdit(product: Product) {
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unit: product.unit,
      pricePerTon: String(product.pricePerTon),
      notes: product.notes,
    });
    setCreating(false);
    setEditing(product);
  }

  return (
    <AppShell
      title="Sản phẩm"
      action={
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Thêm sản phẩm
        </Button>
      }
    >
      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
        <Input
          className="pl-9"
          placeholder="Tìm tên, mã, nhóm…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-surface-2" />
      ) : filtered.length === 0 ? (
        <Card className="py-12 text-center text-muted">
          Chưa có sản phẩm. Thêm mặt hàng bán theo tấn.
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-border bg-surface-2/60 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Sản phẩm</th>
                  <th className="px-5 py-2.5 font-medium">Mã</th>
                  <th className="px-5 py-2.5 font-medium">Nhóm</th>
                  <th className="px-5 py-2.5 font-medium">Đơn vị</th>
                  <th className="px-5 py-2.5 font-medium">Giá / tấn</th>
                  <th className="px-5 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium">{product.name}</td>
                    <td className="px-5 py-3 tabular-nums text-muted">{product.sku || "—"}</td>
                    <td className="px-5 py-3">{product.category || "—"}</td>
                    <td className="px-5 py-3">{product.unit}</td>
                    <td className="px-5 py-3 tabular-nums">{formatVnd(product.pricePerTon)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-10 min-h-10" onClick={() => openEdit(product)} aria-label="Sửa">
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-10 min-h-10" onClick={() => setConfirmId(product.id)} aria-label="Xoá">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog
        open={creating || Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
        title={editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Field label="Tên sản phẩm">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mã">
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </Field>
            <Field label="Nhóm">
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Đơn vị">
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </Field>
            <Field label="Giá / tấn (đ)">
              <Input
                type="number"
                min={0}
                step={1000}
                value={form.pricePerTon}
                onChange={(e) => setForm({ ...form, pricePerTon: e.target.value })}
                required
              />
            </Field>
          </div>
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
        title="Xoá sản phẩm?"
        description="Không xoá được mặt hàng đã nằm trong đơn."
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
