import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { Field } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { formatDate, VISIT_PURPOSE_LABEL } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import type { VisitPurpose } from "@/lib/types";
import { nowIso } from "@/lib/utils";

export const Route = createFileRoute("/visits")({ component: VisitsPage });

function VisitsPage() {
  const visits = useAppStore((s) => s.visits);
  const dealers = useAppStore((s) => s.dealers);
  const addVisit = useAppStore((s) => s.addVisit);
  const deleteVisit = useAppStore((s) => s.deleteVisit);
  const [open, setOpen] = useState(false);
  const [dealerId, setDealerId] = useState(dealers[0]?.id ?? "");
  const [purpose, setPurpose] = useState<VisitPurpose>("ban_hang");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState("");

  const list = useMemo(
    () => [...visits].sort((a, b) => b.date.localeCompare(a.date)),
    [visits],
  );

  return (
    <div className="grid gap-5">
      <PageHeader
        kicker="Ngoài đồng"
        title="Viếng thăm"
        description="Nhật ký ghé đại lý — bán hàng, thu nợ, chăm sóc."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Ghi thăm
          </Button>
        }
      />

      {list.length === 0 ? (
        <EmptyState icon={<MapPin className="size-5" />} title="Chưa có chuyến thăm" />
      ) : (
        <ul className="grid gap-2">
          {list.map((v) => {
            const dealer = dealers.find((d) => d.id === v.dealerId);
            return (
              <li key={v.id} className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to="/dealers/$id"
                    params={{ id: v.dealerId }}
                    className="font-medium"
                  >
                    {dealer?.name ?? "Đại lý"}
                  </Link>
                  <Badge>{VISIT_PURPOSE_LABEL[v.purpose]}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(v.date)}</p>
                <p className="mt-2 text-sm">{v.notes}</p>
                {v.result ? (
                  <p className="mt-1 text-sm text-muted-foreground">{v.result}</p>
                ) : null}
                <button
                  type="button"
                  className="mt-2 text-xs text-destructive"
                  onClick={() => deleteVisit(v.id)}
                >
                  Xoá
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Ghi viếng thăm">
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!dealerId) return;
              addVisit({ dealerId, date: nowIso(), purpose, notes, result });
              setNotes("");
              setResult("");
              setOpen(false);
            }}
          >
            <Field label="Đại lý">
              <NativeSelect value={dealerId} onChange={(e) => setDealerId(e.target.value)}>
                {dealers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Mục đích">
              <NativeSelect
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as VisitPurpose)}
              >
                {Object.entries(VISIT_PURPOSE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Nội dung">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <Field label="Kết quả">
              <Input value={result} onChange={(e) => setResult(e.target.value)} />
            </Field>
            <Button type="submit">Lưu</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
