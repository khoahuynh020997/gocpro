export type OrderStatus = "moi" | "dang_giao" | "hoan_thanh" | "huy";

export type Dealer = {
  id: number;
  name: string;
  phone: string;
  address: string;
  region: string;
  notes: string;
};

export type Product = {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit: string;
  pricePerTon: number;
  notes: string;
};

export type Vehicle = {
  id: number;
  name: string;
  plate: string;
  driverPhone: string;
  freightCost: number;
  notes: string;
};

export type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  tons: number;
  unitPrice: number;
};

export type OrderListRow = {
  id: number;
  dealerId: number;
  dealerName: string;
  vehicleId: number | null;
  vehicleName: string | null;
  plate: string | null;
  orderDate: string;
  status: OrderStatus;
  freightCost: number;
  tons: number;
  goods: number;
  notes: string;
};

export type OrderDetail = OrderListRow & {
  items: OrderItem[];
};

export type SalesPeriod = {
  period: string;
  label: string;
  tons: number;
  goods: number;
  freight: number;
  orderCount: number;
};

export type SalesReport = {
  year: number;
  mode: "month" | "year";
  periods: SalesPeriod[];
  totals: { tons: number; goods: number; freight: number; orderCount: number };
  byDealer: Array<{
    dealerId: number;
    dealerName: string;
    tons: number;
    goods: number;
  }>;
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  moi: "Mới",
  dang_giao: "Đang giao",
  hoan_thanh: "Hoàn thành",
  huy: "Huỷ",
};

export const STATUS_OPTIONS: OrderStatus[] = [
  "moi",
  "dang_giao",
  "hoan_thanh",
  "huy",
];
