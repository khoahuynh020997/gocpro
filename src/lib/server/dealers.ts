import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import type { Dealer } from "@/lib/types";

const dealerInput = z.object({
  name: z.string().trim().min(1, "Nhập tên đại lý"),
  phone: z.string().trim().default(""),
  address: z.string().trim().default(""),
  region: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export const listDealers = createServerFn({ method: "GET" }).handler(
  async (): Promise<Dealer[]> => {
    const sql = await getSql();
    return sql<Dealer>`
      select id, name, phone, address, region, notes
      from dealers
      order by name
    `;
  },
);

export const createDealer = createServerFn({ method: "POST" })
  .validator(dealerInput)
  .handler(async ({ data }): Promise<Dealer> => {
    const sql = await getSql();
    const rows = await sql<Dealer>`
      insert into dealers (name, phone, address, region, notes)
      values (${data.name}, ${data.phone}, ${data.address}, ${data.region}, ${data.notes})
      returning id, name, phone, address, region, notes
    `;
    const row = rows[0];
    if (!row) throw new Error("Không tạo được đại lý");
    return row;
  });

export const updateDealer = createServerFn({ method: "POST" })
  .validator(dealerInput.extend({ id: z.number().int() }))
  .handler(async ({ data }): Promise<Dealer> => {
    const sql = await getSql();
    const rows = await sql<Dealer>`
      update dealers
      set name = ${data.name},
          phone = ${data.phone},
          address = ${data.address},
          region = ${data.region},
          notes = ${data.notes}
      where id = ${data.id}
      returning id, name, phone, address, region, notes
    `;
    const row = rows[0];
    if (!row) throw new Error("Không tìm thấy đại lý");
    return row;
  });

export const deleteDealer = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int() }))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const sql = await getSql();
    const used = await sql<{ c: number }>`
      select count(*)::int as c from orders where dealer_id = ${data.id}
    `;
    if ((used[0]?.c ?? 0) > 0) {
      throw new Error("Không thể xoá đại lý đã có đơn hàng");
    }
    await sql`delete from dealers where id = ${data.id}`;
    return { ok: true };
  });
