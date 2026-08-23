import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { OrderForm, type OrderDraft } from "@/components/order-form";
import { Card } from "@/components/ui/card";
import { listDealers } from "@/lib/server/dealers";
import { createOrder } from "@/lib/server/orders";
import { listProducts } from "@/lib/server/products";
import { listVehicles } from "@/lib/server/vehicles";

export const Route = createFileRoute("/orders/new")({ component: NewOrderPage });

function NewOrderPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const dealers = useQuery({ queryKey: ["dealers"], queryFn: () => listDealers() });
  const products = useQuery({ queryKey: ["products"], queryFn: () => listProducts() });
  const vehicles = useQuery({ queryKey: ["vehicles"], queryFn: () => listVehicles() });

  const save = useMutation({
    mutationFn: (draft: OrderDraft) => createOrder({ data: draft }),
    onSuccess: async (res) => {
      toast.success("Đã tạo đơn hàng");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["orders"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
        qc.invalidateQueries({ queryKey: ["sales"] }),
      ]);
      await navigate({ to: "/orders/$id", params: { id: String(res.id) } });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const ready = dealers.data && products.data && vehicles.data;
  const blocked =
    ready && (dealers.data.length === 0 || products.data.length === 0);

  return (
    <AppShell title="Tạo đơn hàng">
      {!ready ? (
        <div className="h-64 animate-pulse rounded-xl bg-surface-2" />
      ) : blocked ? (
        <Card className="py-12 text-center text-muted">
          Cần ít nhất một đại lý và một sản phẩm trước khi tạo đơn.
        </Card>
      ) : (
        <OrderForm
          dealers={dealers.data}
          products={products.data}
          vehicles={vehicles.data}
          submitting={save.isPending}
          submitLabel="Tạo đơn"
          onSubmit={(draft) => save.mutate(draft)}
        />
      )}
    </AppShell>
  );
}
