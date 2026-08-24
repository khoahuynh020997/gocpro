import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import type { Order, Product } from "./types";

export const BAGS_PER_TON = 20;

export function bagsToTons(bags: number, bagKg = 50): number {
  return (bags * bagKg) / 1000;
}

export function tonsToBags(tons: number, bagKg = 50): number {
  return Math.round((tons * 1000) / bagKg);
}

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatVndShort(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    const ty = abs / 1_000_000_000;
    return `${sign}${ty.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ`;
  }
  if (abs >= 1_000_000) {
    const trieu = abs / 1_000_000;
    return `${sign}${trieu.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr`;
  }
  return formatVnd(amount);
}

export function formatTons(tons: number): string {
  return `${tons.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tấn`;
}

export function formatBags(bags: number): string {
  return `${bags.toLocaleString("vi-VN")} bao`;
}

export function formatDate(iso: string, pattern = "dd/MM/yyyy"): string {
  try {
    return format(parseISO(iso), pattern, { locale: vi });
  } catch {
    return iso;
  }
}

export function formatDateLong(iso: string): string {
  return formatDate(iso, "EEEE, d MMMM yyyy");
}

export function orderTotal(order: Pick<Order, "items">): number {
  return order.items.reduce((sum, item) => sum + item.bags * item.unitPrice, 0);
}

export function orderBags(order: Pick<Order, "items">): number {
  return order.items.reduce((sum, item) => sum + item.bags, 0);
}

export function orderTons(
  order: Pick<Order, "items">,
  products: Product[],
): number {
  return order.items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + bagsToTons(item.bags, product?.bagKg ?? 50);
  }, 0);
}

export function phoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

export const LEVEL_LABEL: Record<string, string> = {
  cap1: "Đại lý cấp 1",
  cap2: "Đại lý cấp 2",
  nongho: "Nông hộ lớn",
};

export const CATEGORY_LABEL: Record<string, string> = {
  urea: "Urê",
  dap: "DAP",
  sa: "SA",
  kcl: "Kali",
  npk: "NPK",
  lan: "Lân",
  organic: "Hữu cơ",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  confirmed: "Đã chốt",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã huỷ",
};

export const SHIPMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xe",
  loading: "Đang xếp",
  in_transit: "Đang chạy",
  delivered: "Đã giao",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản",
  check: "Séc / UNC",
};

export const VISIT_PURPOSE_LABEL: Record<string, string> = {
  ban_hang: "Bán hàng",
  thu_no: "Thu nợ",
  cham_soc: "Chăm sóc",
  giao_hang: "Giao hàng",
};

export const PROVINCES = [
  "An Giang",
  "Đồng Tháp",
  "Kiên Giang",
  "Cần Thơ",
  "Long An",
  "Tiền Giang",
  "Vĩnh Long",
  "Hậu Giang",
  "Sóc Trăng",
  "Bạc Liêu",
] as const;
