import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { toNumber } from "@/lib/format";
import type { Vehicle } from "@/lib/types";

type VehicleRow = {
  id: number;
  name: string;
  plate: string;
  driver_phone: string;
  freight_cost: unknown;
  notes: string;
};

function mapVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    name: row.name,
    plate: row.plate,
    driverPhone: row.driver_phone,
    freightCost: toNumber(row.freight_cost),
    notes: row.notes,
  };
}

const vehicleInput = z.object({
  name: z.string().trim().min(1, "Nhập tên xe"),
  plate: z.string().trim().min(1, "Nhập biển số"),
  driverPhone: z.string().trim().default(""),
  freightCost: z.number().nonnegative(),
  notes: z.string().trim().default(""),
});

export const listVehicles = createServerFn({ method: "GET" }).handler(
  async (): Promise<Vehicle[]> => {
    const sql = await getSql();
    const rows = await sql<VehicleRow>`
      select id, name, plate, driver_phone, freight_cost, notes
      from vehicles
      order by name
    `;
    return rows.map(mapVehicle);
  },
);

export const createVehicle = createServerFn({ method: "POST" })
  .validator(vehicleInput)
  .handler(async ({ data }): Promise<Vehicle> => {
    const sql = await getSql();
    const rows = await sql<VehicleRow>`
      insert into vehicles (name, plate, driver_phone, freight_cost, notes)
      values (${data.name}, ${data.plate}, ${data.driverPhone}, ${data.freightCost}, ${data.notes})
      returning id, name, plate, driver_phone, freight_cost, notes
    `;
    const row = rows[0];
    if (!row) throw new Error("Không tạo được xe");
    return mapVehicle(row);
  });

export const updateVehicle = createServerFn({ method: "POST" })
  .validator(vehicleInput.extend({ id: z.number().int() }))
  .handler(async ({ data }): Promise<Vehicle> => {
    const sql = await getSql();
    const rows = await sql<VehicleRow>`
      update vehicles
      set name = ${data.name},
          plate = ${data.plate},
          driver_phone = ${data.driverPhone},
          freight_cost = ${data.freightCost},
          notes = ${data.notes}
      where id = ${data.id}
      returning id, name, plate, driver_phone, freight_cost, notes
    `;
    const row = rows[0];
    if (!row) throw new Error("Không tìm thấy xe");
    return mapVehicle(row);
  });

export const deleteVehicle = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int() }))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const sql = await getSql();
    const used = await sql<{ c: number }>`
      select count(*)::int as c from orders where vehicle_id = ${data.id}
    `;
    if ((used[0]?.c ?? 0) > 0) {
      throw new Error("Không thể xoá xe đã gắn với đơn hàng");
    }
    await sql`delete from vehicles where id = ${data.id}`;
    return { ok: true };
  });
