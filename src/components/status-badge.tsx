import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, type OrderStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge status={status}>{STATUS_LABEL[status]}</Badge>;
}
