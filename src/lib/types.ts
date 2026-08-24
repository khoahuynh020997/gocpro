export type DealerLevel = "cap1" | "cap2" | "nongho";

export type ProductCategory =
  | "urea"
  | "dap"
  | "sa"
  | "kcl"
  | "npk"
  | "lan"
  | "organic";

export type OrderStatus =
  | "draft"
  | "confirmed"
  | "shipping"
  | "delivered"
  | "cancelled";

export type ShipmentStatus = "pending" | "loading" | "in_transit" | "delivered";

export type PaymentMethod = "cash" | "transfer" | "check";

export type VisitPurpose = "ban_hang" | "thu_no" | "cham_soc" | "giao_hang";

export type Dealer = {
  id: string;
  name: string;
  owner: string;
  phone: string;
  address: string;
  province: string;
  district: string;
  level: DealerLevel;
  creditLimit: number;
  notes: string;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  formula: string;
  bagKg: number;
  pricePerBag: number;
  stockBags: number;
  origin: string;
  description: string;
};

export type OrderItem = {
  productId: string;
  bags: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  code: string;
  dealerId: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  deliveryDate: string;
  notes: string;
};

export type Vehicle = {
  id: string;
  name: string;
  plate: string;
  driver: string;
  driverPhone: string;
  capacityTons: number;
  notes: string;
};

export type Shipment = {
  id: string;
  orderId: string;
  vehicleId: string | null;
  vehicle: string;
  plate: string;
  driver: string;
  driverPhone: string;
  freight: number;
  warehouse: string;
  status: ShipmentStatus;
  departedAt: string | null;
  deliveredAt: string | null;
  notes: string;
};

export type Payment = {
  id: string;
  dealerId: string;
  orderId: string | null;
  amount: number;
  method: PaymentMethod;
  date: string;
  notes: string;
};

export type Visit = {
  id: string;
  dealerId: string;
  date: string;
  purpose: VisitPurpose;
  notes: string;
  result: string;
};

export type AppData = {
  dealers: Dealer[];
  products: Product[];
  orders: Order[];
  vehicles: Vehicle[];
  shipments: Shipment[];
  payments: Payment[];
  visits: Visit[];
};
