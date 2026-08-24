import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  AppData,
  Dealer,
  Order,
  Payment,
  Product,
  Shipment,
  Vehicle,
  Visit,
} from "./types";
import { createSeedData } from "./seed";
import { nowIso, uid } from "./utils";

export type AppState = AppData & {
  addDealer: (input: Omit<Dealer, "id" | "createdAt">) => string;
  updateDealer: (id: string, patch: Partial<Dealer>) => void;
  deleteDealer: (id: string) => void;
  addProduct: (input: Omit<Product, "id">) => string;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addOrder: (input: Omit<Order, "id" | "code"> & { code?: string }) => string;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  setOrderStatus: (id: string, status: Order["status"]) => void;
  deleteOrder: (id: string) => void;
  addVehicle: (input: Omit<Vehicle, "id">) => string;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  addShipment: (input: Omit<Shipment, "id">) => string;
  updateShipment: (id: string, patch: Partial<Shipment>) => void;
  deleteShipment: (id: string) => void;
  addPayment: (input: Omit<Payment, "id">) => string;
  deletePayment: (id: string) => void;
  addVisit: (input: Omit<Visit, "id">) => string;
  updateVisit: (id: string, patch: Partial<Visit>) => void;
  deleteVisit: (id: string) => void;
  resetDemo: () => void;
};

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function nextOrderCode(orders: Order[]): string {
  const now = new Date();
  const prefix = `DH-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}-`;
  const seq =
    orders
      .map((o) => o.code)
      .filter((c) => c.startsWith(prefix))
      .map((c) => Number(c.slice(prefix.length)))
      .reduce((m, n) => (Number.isFinite(n) && n > m ? n : m), 0) + 1;
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

function applyStock(
  products: Product[],
  items: Order["items"],
  direction: 1 | -1,
): Product[] {
  const delta = new Map<string, number>();
  for (const item of items) {
    delta.set(item.productId, (delta.get(item.productId) ?? 0) + item.bags * direction);
  }
  return products.map((p) => {
    const d = delta.get(p.id);
    if (!d) return p;
    return { ...p, stockBags: Math.max(0, p.stockBags + d) };
  });
}

const seed = createSeedData();

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...seed,
      addDealer: (input) => {
        const id = uid("dl");
        set((s) => ({
          dealers: [{ ...input, id, createdAt: nowIso() }, ...s.dealers],
        }));
        return id;
      },
      updateDealer: (id, patch) =>
        set((s) => ({
          dealers: s.dealers.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),
      deleteDealer: (id) =>
        set((s) => ({ dealers: s.dealers.filter((d) => d.id !== id) })),
      addProduct: (input) => {
        const id = uid("sp");
        set((s) => ({ products: [{ ...input, id }, ...s.products] }));
        return id;
      },
      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
      addOrder: (input) => {
        const id = uid("dh");
        const code = input.code ?? nextOrderCode(get().orders);
        const order: Order = { ...input, id, code };
        set((s) => {
          const shouldStock = order.status !== "draft" && order.status !== "cancelled";
          return {
            orders: [order, ...s.orders],
            products: shouldStock
              ? applyStock(s.products, order.items, -1)
              : s.products,
          };
        });
        return id;
      },
      updateOrder: (id, patch) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        })),
      setOrderStatus: (id, status) =>
        set((s) => {
          const order = s.orders.find((o) => o.id === id);
          if (!order || order.status === status) return s;
          const wasActive =
            order.status !== "draft" && order.status !== "cancelled";
          const willActive = status !== "draft" && status !== "cancelled";
          let products = s.products;
          if (wasActive && !willActive) products = applyStock(products, order.items, 1);
          if (!wasActive && willActive) products = applyStock(products, order.items, -1);
          return {
            products,
            orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
          };
        }),
      deleteOrder: (id) =>
        set((s) => {
          const order = s.orders.find((o) => o.id === id);
          let products = s.products;
          if (order && order.status !== "draft" && order.status !== "cancelled") {
            products = applyStock(products, order.items, 1);
          }
          return {
            products,
            orders: s.orders.filter((o) => o.id !== id),
            shipments: s.shipments.filter((sh) => sh.orderId !== id),
          };
        }),
      addVehicle: (input) => {
        const id = uid("xe");
        set((s) => ({ vehicles: [{ ...input, id }, ...s.vehicles] }));
        return id;
      },
      updateVehicle: (id, patch) =>
        set((s) => ({
          vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        })),
      deleteVehicle: (id) =>
        set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) })),
      addShipment: (input) => {
        const id = uid("vc");
        set((s) => ({ shipments: [{ ...input, id }, ...s.shipments] }));
        return id;
      },
      updateShipment: (id, patch) =>
        set((s) => {
          const shipments = s.shipments.map((sh) =>
            sh.id === id ? { ...sh, ...patch } : sh,
          );
          const shipment = shipments.find((sh) => sh.id === id);
          let orders = s.orders;
          if (shipment && patch.status === "delivered") {
            orders = orders.map((o) =>
              o.id === shipment.orderId && o.status !== "cancelled"
                ? { ...o, status: "delivered" }
                : o,
            );
          }
          if (shipment && patch.status === "in_transit") {
            orders = orders.map((o) =>
              o.id === shipment.orderId &&
              (o.status === "confirmed" || o.status === "draft")
                ? { ...o, status: "shipping" }
                : o,
            );
          }
          return { shipments, orders };
        }),
      deleteShipment: (id) =>
        set((s) => ({ shipments: s.shipments.filter((sh) => sh.id !== id) })),
      addPayment: (input) => {
        const id = uid("tt");
        set((s) => ({ payments: [{ ...input, id }, ...s.payments] }));
        return id;
      },
      deletePayment: (id) =>
        set((s) => ({ payments: s.payments.filter((p) => p.id !== id) })),
      addVisit: (input) => {
        const id = uid("vt");
        set((s) => ({ visits: [{ ...input, id }, ...s.visits] }));
        return id;
      },
      updateVisit: (id, patch) =>
        set((s) => ({
          visits: s.visits.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        })),
      deleteVisit: (id) =>
        set((s) => ({ visits: s.visits.filter((v) => v.id !== id) })),
      resetDemo: () => set(() => ({ ...createSeedData() })),
    }),
    {
      name: "gocpro-v2",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : localStorage,
      ),
      skipHydration: true,
      partialize: (s) => ({
        dealers: s.dealers,
        products: s.products,
        orders: s.orders,
        vehicles: s.vehicles,
        shipments: s.shipments,
        payments: s.payments,
        visits: s.visits,
      }),
    },
  ),
);
