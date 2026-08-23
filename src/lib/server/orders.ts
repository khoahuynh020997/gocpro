import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { toNumber } from "@/lib/format";
import type { OrderDetail, OrderItem, OrderListRow, OrderStatus } from "@/lib/types";

type OrderRow = {
  id: number;
  dealer_id: number;
  dealer_name: string;
  vehicle_id: number | null;
  vehicle_name: string | null;
  plate: string | null;
  order_date: string;
  status: OrderStatus;
  freight_cost: unknown;
  tons: unknown;
  goods: unknown;
  notes: string;
};

function mapOrder(row: OrderRow): OrderListRow {
  return {
    id: row.id,
    dealerId: row.dealer_id,
    dealerName: row.dealer_name,
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name,
    plate: row.plate,
    orderDate: String(row.order_date).slice(0, 10),
    status: row.status,
    freightCost: toNumber(row.freight_cost),
    tons: toNumber(row.tons),
    goods: toNumber(row.goods),
    notes: row.notes,
  };
}

const listSql = `
  select
    o.id,
    o.dealer_id,
    d.name as dealer_name,
    o.vehicle_id,
    v.name as vehicle_name,
    v.plate,
    o.order_date::text as order_date,
    o.status,
    o.freight_cost,
    coalesce(sum(i.tons), 0) as tons,
    coalesce(sum(i.tons * i.unit_price), 0) as goods,
    o.notes
  from orders o
  join dealers d on d.id = o.dealer_id
  left join vehicles v on v.id = o.vehicle_id
  left join order_items i on i.order_id = o.id
`;

export const listOrders = createServerFn({ method: "GET" }).handler(
  async (): Promise<OrderListRow[]> => {
    const sql = await getSql();
    const rows = await sql.query<OrderRow>(
      `${listSql}
       group by o.id, d.name, v.name, v.plate
       order by o.order_date desc, o.id desc`,
    );
    return rows.map(mapOrder);
  },
);

export const getOrder = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.coerce.number().int() }))
  .handler(async ({ data }): Promise<OrderDetail> => {
    const sql = await getSql();
    const rows = await sql.query<OrderRow>(
      `${listSql}
       where o.id = $1
       group by o.id, d.name, v.name, v.plate`,
      [data.id],
    );
    const row = rows[0];
    if (!row) throw new Error("Không tìm thấy đơn hàng");
    const items = await sql.query<{
      id: number;
      product_id: number;
      product_name: string;
      tons: unknown;
      unit_price: unknown;
    }>(
      `select i.id, i.product_id, p.name as product_name, i.tons, i.unit_price
       from order_items i
       join products p on p.id = i.product_id
       where i.order_id = $1
       order by i.id`,
      [data.id],
    );
    const mappedItems: OrderItem[] = items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      tons: toNumber(item.tons),
      unitPrice: toNumber(item.unit_price),
    }));
    return { ...mapOrder(row), items: mappedItems };
  });

const itemInput = z.object({
  productId: z.number().int(),
  tons: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

const orderInput = z.object({
  dealerId: z.number().int(),
  vehicleId: z.number().int().nullable(),
  orderDate: z.string().min(8),
  status: z.enum(["moi", "dang_giao", "hoan_thanh", "huy"]),
  freightCost: z.number().nonnegative(),
  notes: z.string().trim().default(""),
  items: z.array(itemInput).min(1, "Thêm ít nhất một sản phẩm"),
});

export const createOrder = createServerFn({ method: "POST" })
  .validator(orderInput)
  .handler(async ({ data }): Promise<{ id: number }> => {
    const sql = await getSql();
    const inserted = await sql<{ id: number }>`
      insert into orders (dealer_id, vehicle_id, order_date, status, freight_cost, notes)
      values (
        ${data.dealerId},
        ${data.vehicleId},
        ${data.orderDate}::date,
        ${data.status},
        ${data.freightCost},
        ${data.notes}
      )
      returning id
    `;
    const id = inserted[0]?.id;
    if (!id) throw new Error("Không tạo được đơn hàng");
    for (const item of data.items) {
      await sql`
        insert into order_items (order_id, product_id, tons, unit_price)
        values (${id}, ${item.productId}, ${item.tons}, ${item.unitPrice})
      `;
    }
    return { id };
  });

export const updateOrder = createServerFn({ method: "POST" })
  .validator(orderInput.extend({ id: z.number().int() }))
  .handler(async ({ data }): Promise<{ id: number }> => {
    const sql = await getSql();
    const updated = await sql<{ id: number }>`
      update orders
      set dealer_id = ${data.dealerId},
          vehicle_id = ${data.vehicleId},
          order_date = ${data.orderDate}::date,
          status = ${data.status},
          freight_cost = ${data.freightCost},
          notes = ${data.notes}
      where id = ${data.id}
      returning id
    `;
    if (!updated[0]) throw new Error("Không tìm thấy đơn hàng");
    await sql`delete from order_items where order_id = ${data.id}`;
    for (const item of data.items) {
      await sql`
        insert into order_items (order_id, product_id, tons, unit_price)
        values (${data.id}, ${item.productId}, ${item.tons}, ${item.unitPrice})
      `;
    }
    return { id: data.id };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.number().int(),
      status: z.enum(["moi", "dang_giao", "hoan_thanh", "huy"]),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const sql = await getSql();
    await sql`update orders set status = ${data.status} where id = ${data.id}`;
    return { ok: true };
  });

export const deleteOrder = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int() }))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const sql = await getSql();
    await sql`delete from order_items where order_id = ${data.id}`;
    await sql`delete from orders where id = ${data.id}`;
    return { ok: true };
  });
