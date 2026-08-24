import { Badge } from "@/components/ui/badge";
import {
  ORDER_STATUS_LABEL,
  SHIPMENT_STATUS_LABEL,
} from "@/lib/format";
import type { OrderStatus, ShipmentStatus } from "@/lib/types";

const ORDER_TONE: Record<OrderStatus, "muted" | "primary" | "success" | "warn" | "danger"> = {
  draft: "muted",
  confirmed: "primary",
  shipping: "warn",
  delivered: "success",
  cancelled: "danger",
};

const SHIP_TONE: Record<ShipmentStatus, "muted" | "primary" | "success" | "warn"> = {
  pending: "muted",
  loading: "primary",
  in_transit: "warn",
  delivered: "success",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  return <Badge tone={SHIP_TONE[status]}>{SHIPMENT_STATUS_LABEL[status]}</Badge>;
}
