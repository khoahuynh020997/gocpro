import { isSameMonth, isSameYear, parseISO } from "date-fns";
import type { AppData, Order, Product } from "./types";
import { orderTotal, orderTons } from "./format";

const COUNTED: Order["status"][] = ["confirmed", "shipping", "delivered"];

export function isCounted(order: Order): boolean {
  return COUNTED.includes(order.status);
}

export function dealerDebt(data: AppData, dealerId: string): number {
  const billed = data.orders
    .filter((o) => o.dealerId === dealerId && isCounted(o))
    .reduce((sum, o) => sum + orderTotal(o), 0);
  const paid = data.payments
    .filter((p) => p.dealerId === dealerId)
    .reduce((sum, p) => sum + p.amount, 0);
  return billed - paid;
}

export function dealerRevenue(data: AppData, dealerId: string): number {
  return data.orders
    .filter((o) => o.dealerId === dealerId && isCounted(o))
    .reduce((sum, o) => sum + orderTotal(o), 0);
}

export function periodOrders(
  orders: Order[],
  year: number,
  month?: number,
): Order[] {
  return orders.filter((o) => {
    if (!isCounted(o)) return false;
    const d = parseISO(o.createdAt);
    if (month == null) return d.getFullYear() === year;
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

export function periodFreight(
  data: AppData,
  year: number,
  month?: number,
): number {
  const ids = new Set(periodOrders(data.orders, year, month).map((o) => o.id));
  return data.shipments
    .filter((sh) => ids.has(sh.orderId))
    .reduce((s, sh) => s + (sh.freight || 0), 0);
}

export function periodTotals(
  data: AppData,
  year: number,
  month?: number,
): { tons: number; revenue: number; orders: number; bags: number; freight: number } {
  const list = periodOrders(data.orders, year, month);
  return {
    orders: list.length,
    revenue: list.reduce((s, o) => s + orderTotal(o), 0),
    tons: list.reduce((s, o) => s + orderTons(o, data.products), 0),
    bags: list.reduce(
      (s, o) => s + o.items.reduce((a, i) => a + i.bags, 0),
      0,
    ),
    freight: periodFreight(data, year, month),
  };
}

export function monthlySeries(data: AppData, year: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const totals = periodTotals(data, year, month);
    return {
      month,
      label: `T${month}`,
      tons: Number(totals.tons.toFixed(2)),
      revenue: totals.revenue,
      orders: totals.orders,
      freight: totals.freight,
    };
  });
}

export function productBreakdown(
  data: AppData,
  year: number,
  month?: number,
): { product: Product; tons: number; revenue: number; bags: number }[] {
  const list = periodOrders(data.orders, year, month);
  const map = new Map<string, { tons: number; revenue: number; bags: number }>();
  for (const order of list) {
    for (const item of order.items) {
      const product = data.products.find((p) => p.id === item.productId);
      if (!product) continue;
      const cur = map.get(item.productId) ?? { tons: 0, revenue: 0, bags: 0 };
      cur.bags += item.bags;
      cur.revenue += item.bags * item.unitPrice;
      cur.tons += (item.bags * product.bagKg) / 1000;
      map.set(item.productId, cur);
    }
  }
  return data.products
    .map((product) => ({
      product,
      ...(map.get(product.id) ?? { tons: 0, revenue: 0, bags: 0 }),
    }))
    .filter((row) => row.bags > 0)
    .sort((a, b) => b.revenue - a.revenue);
}

export function dealerBreakdown(
  data: AppData,
  year: number,
  month?: number,
) {
  const list = periodOrders(data.orders, year, month);
  return data.dealers
    .map((dealer) => {
      const mine = list.filter((o) => o.dealerId === dealer.id);
      return {
        dealer,
        orders: mine.length,
        revenue: mine.reduce((s, o) => s + orderTotal(o), 0),
        tons: mine.reduce((s, o) => s + orderTons(o, data.products), 0),
        debt: dealerDebt(data, dealer.id),
      };
    })
    .filter((row) => row.orders > 0 || row.debt > 0)
    .sort((a, b) => b.revenue - a.revenue);
}

export function inMonth(iso: string, ref: Date): boolean {
  return isSameMonth(parseISO(iso), ref);
}

export function inYear(iso: string, ref: Date): boolean {
  return isSameYear(parseISO(iso), ref);
}
