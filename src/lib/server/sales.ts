import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { MONTH_LABELS, toNumber } from "@/lib/format";
import type { OrderStatus, SalesPeriod, SalesReport } from "@/lib/types";

type AggRow = {
  period: string;
  tons: unknown;
  goods: unknown;
  freight: unknown;
  order_count: unknown;
};

type DealerRow = {
  dealer_id: number;
  dealer_name: string;
  tons: unknown;
  goods: unknown;
};

function mapPeriod(row: AggRow, mode: "month" | "year"): SalesPeriod {
  const period = row.period;
  let label = period;
  if (mode === "month") {
    const month = Number(period.slice(5, 7));
    label = MONTH_LABELS[month - 1] ?? period;
  } else {
    label = `Năm ${period}`;
  }
  return {
    period,
    label,
    tons: toNumber(row.tons),
    goods: toNumber(row.goods),
    freight: toNumber(row.freight),
    orderCount: toNumber(row.order_count),
  };
}

export const getSalesReport = createServerFn({ method: "GET" })
  .validator(
    z.object({
      year: z.coerce.number().int(),
      mode: z.enum(["month", "year"]),
    }),
  )
  .handler(async ({ data }): Promise<SalesReport> => {
    const sql = await getSql();
    const yearFilter = data.mode === "month";
    const periodSql =
      data.mode === "month"
        ? `to_char(order_date, 'YYYY-MM')`
        : `to_char(order_date, 'YYYY')`;

    const periods = await sql.query<AggRow>(
      `with order_totals as (
         select
           o.id,
           o.order_date,
           o.freight_cost,
           coalesce(sum(i.tons), 0) as tons,
           coalesce(sum(i.tons * i.unit_price), 0) as goods
         from orders o
         left join order_items i on i.order_id = o.id
         where o.status <> 'huy'
           and ($2::int = 0 or extract(year from o.order_date) = $1)
         group by o.id
       )
       select
         ${periodSql} as period,
         sum(tons) as tons,
         sum(goods) as goods,
         sum(freight_cost) as freight,
         count(*)::int as order_count
       from order_totals
       group by 1
       order by 1`,
      [data.year, yearFilter ? 1 : 0],
    );

    const byDealer = await sql.query<DealerRow>(
      `select
         d.id as dealer_id,
         d.name as dealer_name,
         coalesce(sum(i.tons), 0) as tons,
         coalesce(sum(i.tons * i.unit_price), 0) as goods
       from orders o
       join dealers d on d.id = o.dealer_id
       left join order_items i on i.order_id = o.id
       where o.status <> 'huy'
         and ($2::int = 0 or extract(year from o.order_date) = $1)
       group by d.id, d.name
       order by goods desc`,
      [data.year, yearFilter ? 1 : 0],
    );

    const mapped = periods.map((row) => mapPeriod(row, data.mode));
    const totals = mapped.reduce(
      (acc, row) => ({
        tons: acc.tons + row.tons,
        goods: acc.goods + row.goods,
        freight: acc.freight + row.freight,
        orderCount: acc.orderCount + row.orderCount,
      }),
      { tons: 0, goods: 0, freight: 0, orderCount: 0 },
    );

    return {
      year: data.year,
      mode: data.mode,
      periods: mapped,
      totals,
      byDealer: byDealer.map((row) => ({
        dealerId: row.dealer_id,
        dealerName: row.dealer_name,
        tons: toNumber(row.tons),
        goods: toNumber(row.goods),
      })),
    };
  });

export const getDashboard = createServerFn({ method: "GET" }).handler(
  async () => {
    const sql = await getSql();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const monthRow = await sql.query<{
      tons: unknown;
      goods: unknown;
      freight: unknown;
      order_count: unknown;
    }>(
      `with order_totals as (
         select
           o.id,
           o.freight_cost,
           coalesce(sum(i.tons), 0) as tons,
           coalesce(sum(i.tons * i.unit_price), 0) as goods
         from orders o
         left join order_items i on i.order_id = o.id
         where o.status <> 'huy'
           and extract(year from o.order_date) = $1
           and extract(month from o.order_date) = $2
         group by o.id
       )
       select
         coalesce(sum(tons), 0) as tons,
         coalesce(sum(goods), 0) as goods,
         coalesce(sum(freight_cost), 0) as freight,
         count(*)::int as order_count
       from order_totals`,
      [year, month],
    );

    const yearRow = await sql.query<{
      tons: unknown;
      goods: unknown;
    }>(
      `select
         coalesce(sum(i.tons), 0) as tons,
         coalesce(sum(i.tons * i.unit_price), 0) as goods
       from orders o
       left join order_items i on i.order_id = o.id
       where o.status <> 'huy'
         and extract(year from o.order_date) = $1`,
      [year],
    );

    const counts = await sql.query<{
      dealers: number;
      products: number;
      vehicles: number;
      open_orders: number;
    }>(
      `select
         (select count(*)::int from dealers) as dealers,
         (select count(*)::int from products) as products,
         (select count(*)::int from vehicles) as vehicles,
         (select count(*)::int from orders where status in ('moi', 'dang_giao')) as open_orders`,
    );

    const monthly = await sql.query<AggRow>(
      `with order_totals as (
         select
           o.id,
           o.order_date,
           coalesce(sum(i.tons), 0) as tons,
           coalesce(sum(i.tons * i.unit_price), 0) as goods
         from orders o
         left join order_items i on i.order_id = o.id
         where o.status <> 'huy'
           and extract(year from o.order_date) = $1
         group by o.id
       )
       select
         to_char(order_date, 'YYYY-MM') as period,
         sum(tons) as tons,
         sum(goods) as goods,
         0 as freight,
         count(*)::int as order_count
       from order_totals
       group by 1
       order by 1`,
      [year],
    );

    const recent = await sql.query<OrderRowLite>(
      `select
         o.id,
         d.name as dealer_name,
         o.order_date::text as order_date,
         o.status,
         coalesce(sum(i.tons), 0) as tons,
         coalesce(sum(i.tons * i.unit_price), 0) as goods
       from orders o
       join dealers d on d.id = o.dealer_id
       left join order_items i on i.order_id = o.id
       group by o.id, d.name
       order by o.order_date desc, o.id desc
       limit 6`,
    );

    const m = monthRow[0];
    const y = yearRow[0];
    const c = counts[0];

    return {
      year,
      month,
      thisMonth: {
        tons: toNumber(m?.tons),
        goods: toNumber(m?.goods),
        freight: toNumber(m?.freight),
        orderCount: toNumber(m?.order_count),
      },
      thisYear: {
        tons: toNumber(y?.tons),
        goods: toNumber(y?.goods),
      },
      counts: {
        dealers: c?.dealers ?? 0,
        products: c?.products ?? 0,
        vehicles: c?.vehicles ?? 0,
        openOrders: c?.open_orders ?? 0,
      },
      monthly: monthly.map((row) => mapPeriod(row, "month")),
      recent: recent.map((row) => ({
        id: row.id,
        dealerName: row.dealer_name,
        orderDate: String(row.order_date).slice(0, 10),
        status: row.status as OrderStatus,
        tons: toNumber(row.tons),
        goods: toNumber(row.goods),
      })),
    };
  },
);

type OrderRowLite = {
  id: number;
  dealer_name: string;
  order_date: string;
  status: string;
  tons: unknown;
  goods: unknown;
};
