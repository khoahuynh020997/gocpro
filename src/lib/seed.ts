import type { AppData } from "./types";

export function createEmptyData(): AppData {
  return {
    dealers: [],
    products: [],
    orders: [],
    vehicles: [],
    shipments: [],
    payments: [],
    visits: [],
  };
}

/** @deprecated Use createEmptyData — kept so older imports still compile. */
export function createSeedData(): AppData {
  return createEmptyData();
}
