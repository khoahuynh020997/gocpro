import { createFileRoute } from "@tanstack/react-router";
import { Package, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { Field } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import {
  bagsToTons,
  CATEGORY_LABEL,
  formatBags,
  formatTons,
  formatVnd,
} from "@/lib/format";
import { useAppStore } from "@/lib/store";
import type { Product, ProductCategory } from "@/lib/types";

export const Route = createFileRoute("/products")({ component: ProductsPage });

const emptyProduct = {
  name: "",
  sku: "",
  category: "npk" as ProductCategory,
  formula: "",
  bagKg: 50,
  pricePerBag: 0,
  stockBags: 0,
  origin: "",
  description: "",
};

function ProductsPage() {
  const products = useAppStore((s) => s.products);
  const addProduct = useAppStore((s) => s.addProduct);
  const updateProduct = useAppStore((s) => s.updateProduct);
  const deleteProduct = useAppStore((s) => s.deleteProduct);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return products.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (!query) return true;
      return [p.name, p.sku, p.formula, p.origin].join(" ").toLowerCase().includes(query);
    });
  }, [products, q, cat]);

  return (
    <div className="grid gap-5">
      <PageHeader
        kicker="Kho hàng"
        title="Phân bón gốc"
        description="Urê, DAP, SA, Kali, NPK — giá theo bao 50kg, quy đổi tấn."
        action={
          <Button
            onClick={() => {
              setForm(emptyProduct);
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            Thêm sản phẩm
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Tìm tên, mã, công thức…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <NativeSelect className="sm:w-44" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">Mọi loại</option>
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </NativeSelect>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Package className="size-5" />} title="Chưa có sản phẩm" />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  setEditing(p);
                  setForm({
                    name: p.name,
                    sku: p.sku,
                    category: p.category,
                    formula: p.formula,
                    bagKg: p.bagKg,
                    pricePerBag: p.pricePerBag,
                    stockBags: p.stockBags,
                    origin: p.origin,
                    description: p.description,
                  });
                  setOpen(true);
                }}
                className="w-full rounded-xl bg-card p-4 text-left shadow-[var(--shadow-border)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.sku} · {p.origin}
                    </p>
                  </div>
                  <Badge tone={p.stockBags < 200 ? "warn" : "primary"}>{p.formula}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Giá / bao</p>
                    <p className="tabular-nums">{formatVnd(p.pricePerBag)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tồn</p>
                    <p className="tabular-nums">{formatBags(p.stockBags)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">≈ tấn</p>
                    <p className="tabular-nums">{formatTons(bagsToTons(p.stockBags, p.bagKg))}</p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name.trim()) return;
              if (editing) updateProduct(editing.id, form);
              else addProduct(form);
              setOpen(false);
            }}
          >
            <Field label="Tên sản phẩm">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Mã SKU">
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </Field>
              <Field label="Loại">
                <NativeSelect
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as ProductCategory })
                  }
                >
                  {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Công thức NPK">
                <Input
                  value={form.formula}
                  onChange={(e) => setForm({ ...form, formula: e.target.value })}
                  placeholder="16-16-8"
                />
              </Field>
              <Field label="Kg / bao">
                <Input
                  type="number"
                  min={1}
                  value={form.bagKg}
                  onChange={(e) => setForm({ ...form, bagKg: Number(e.target.value) })}
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Giá / bao (đ)">
                <Input
                  type="number"
                  min={0}
                  value={form.pricePerBag}
                  onChange={(e) => setForm({ ...form, pricePerBag: Number(e.target.value) })}
                />
              </Field>
              <Field label="Tồn kho (bao)">
                <Input
                  type="number"
                  min={0}
                  value={form.stockBags}
                  onChange={(e) => setForm({ ...form, stockBags: Number(e.target.value) })}
                />
              </Field>
            </div>
            <Field label="Nguồn gốc">
              <Input
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
              />
            </Field>
            <Field label="Mô tả">
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Lưu
              </Button>
              {editing ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Xoá sản phẩm?")) {
                      deleteProduct(editing.id);
                      setOpen(false);
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
