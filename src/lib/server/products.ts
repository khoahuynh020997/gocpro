import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { toNumber } from "@/lib/format";
import type { Product } from "@/lib/types";

type ProductRow = {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit: string;
  price_per_ton: unknown;
  notes: string;
};

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    unit: row.unit,
    pricePerTon: toNumber(row.price_per_ton),
    notes: row.notes,
  };
}

const productInput = z.object({
  name: z.string().trim().min(1, "Nhập tên sản phẩm"),
  sku: z.string().trim().default(""),
  category: z.string().trim().default(""),
  unit: z.string().trim().default("tấn"),
  pricePerTon: z.number().nonnegative(),
  notes: z.string().trim().default(""),
});

export const listProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Product[]> => {
    const sql = await getSql();
    const rows = await sql<ProductRow>`
      select id, name, sku, category, unit, price_per_ton, notes
      from products
      order by name
    `;
    return rows.map(mapProduct);
  },
);

export const createProduct = createServerFn({ method: "POST" })
  .validator(productInput)
  .handler(async ({ data }): Promise<Product> => {
    const sql = await getSql();
    const rows = await sql<ProductRow>`
      insert into products (name, sku, category, unit, price_per_ton, notes)
      values (${data.name}, ${data.sku}, ${data.category}, ${data.unit}, ${data.pricePerTon}, ${data.notes})
      returning id, name, sku, category, unit, price_per_ton, notes
    `;
    const row = rows[0];
    if (!row) throw new Error("Không tạo được sản phẩm");
    return mapProduct(row);
  });

export const updateProduct = createServerFn({ method: "POST" })
  .validator(productInput.extend({ id: z.number().int() }))
  .handler(async ({ data }): Promise<Product> => {
    const sql = await getSql();
    const rows = await sql<ProductRow>`
      update products
      set name = ${data.name},
          sku = ${data.sku},
          category = ${data.category},
          unit = ${data.unit},
          price_per_ton = ${data.pricePerTon},
          notes = ${data.notes}
      where id = ${data.id}
      returning id, name, sku, category, unit, price_per_ton, notes
    `;
    const row = rows[0];
    if (!row) throw new Error("Không tìm thấy sản phẩm");
    return mapProduct(row);
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int() }))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const sql = await getSql();
    const used = await sql<{ c: number }>`
      select count(*)::int as c from order_items where product_id = ${data.id}
    `;
    if ((used[0]?.c ?? 0) > 0) {
      throw new Error("Không thể xoá sản phẩm đã có trong đơn hàng");
    }
    await sql`delete from products where id = ${data.id}`;
    return { ok: true };
  });
