import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { OrderForm, type OrderDraft } from "@/components/order-form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { listDealers } from "@/lib/server/dealers";
import { deleteOrder, getOrder, updateOrder } from "@/lib/server/orders";
import { listProducts } from "@/lib/server/products";
import { listVehicles } from "@/lib/server/vehicles";

export const Route = createFileRoute("/orders/$id")({ component: OrderDetailPage });

function OrderDetailPage() {
  const { id } = Route.useParams();
  const orderId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);

  const order = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder({ data: { id: orderId } }),
    enabled: Number.isFinite(orderId),
  });
  const dealers = useQuery({ queryKey: ["dealers"], queryFn: () => listDealers() });
  const products = useQuery({ queryKey: ["products"], queryFn: () => listProducts() });
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: () => listVehicles() });

  const save = useMutation({
    mutationFn: (draft: OrderDraft) => updateOrder({ data: { id: orderId, ...draft } }),
    onSuccess: async () => {
      toast.success("Đã lưu đơn hàng");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["order", orderId] }),
        qc.invalidateQueries({ queryKey: ["orders"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
        qc.invalidateQueries({ queryKey: ["sales"] }),
      ]);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: () => deleteOrder({ data: { id: orderId } }),
    onSuccess: async () => {
      toast.success("Đã xoá đơn hàng");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["orders"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
        qc.invalidateQueries({ queryKey: ["sales"] }),
      ]);
      await navigate({ to: "/orders" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const ready = order.data && dealers.data && products.data && vehicles.data;

  return (
    <AppShell
      title={order.data ? `Đơn #${order.data.id}` : "Đơn hàng"}
      action={
        <Button variant="outline" onClick={() => setConfirm(true)}>
          Xoá đơn
        </Button>
      }
    >
      {order.error ? (
        <p className="text-sm text-danger">{order.error.message}</p>
      ) : !ready ? (
        <div className="h-64 animate-pulse rounded-xl bg-surface-2" />
      ) : (
        <OrderForm
          dealers={dealers.data}
          products={products.data}
          vehicles={vehicles.data}
          initial={order.data}
          submitting={save.isPending}
          submitLabel="Lưu thay đổi"
          onSubmit={(draft) => save.mutate(draft)}
        />
      )}

      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Xoá đơn hàng?"
        description="Đơn và các dòng hàng sẽ bị xoá. Không thể hoàn tác."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirm(false)}>
            Huỷ
          </Button>
          <Button variant="danger" disabled={remove.isPending} onClick={() => remove.mutate()}>
            Xoá
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
