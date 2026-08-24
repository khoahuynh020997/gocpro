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
import { bagsToTons, orderTotal } from "./format";

function rng(seed: number) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, list: T[]): T {
  return list[Math.floor(rand() * list.length)] as T;
}

function iso(y: number, m: number, d: number, h = 9, min = 0): string {
  const dt = new Date(Date.UTC(y, m - 1, d, h - 7, min, 0));
  return dt.toISOString();
}

const DEALERS: Dealer[] = [
  {
    id: "dl-01",
    name: "Đại lý Thanh Phong",
    owner: "Nguyễn Thanh Phong",
    phone: "0903123456",
    address: "Ấp 3, Quốc lộ 91",
    province: "An Giang",
    district: "Châu Thành",
    level: "cap1",
    creditLimit: 800_000_000,
    notes: "Khách lâu năm, lấy mạnh Urê và NPK đầu vụ hè thu.",
    createdAt: iso(2024, 3, 12),
  },
  {
    id: "dl-02",
    name: "VTNN Minh Tâm",
    owner: "Lê Minh Tâm",
    phone: "0918456123",
    address: "Số 48 Nguyễn Huệ",
    province: "Đồng Tháp",
    district: "Cao Lãnh",
    level: "cap1",
    creditLimit: 1_200_000_000,
    notes: "Kho lớn, nhận xe 15 tấn. Ưu tiên DAP Đình Vũ.",
    createdAt: iso(2023, 11, 4),
  },
  {
    id: "dl-03",
    name: "HTX Nông nghiệp Tân Phú",
    owner: "Trần Văn Phú",
    phone: "0939678123",
    address: "Ấp Tân Phú A",
    province: "An Giang",
    district: "Long Xuyên",
    level: "cap2",
    creditLimit: 350_000_000,
    notes: "HTX 86 hộ, đặt theo đợt sạ.",
    createdAt: iso(2025, 1, 20),
  },
  {
    id: "dl-04",
    name: "Đại lý Út Lợi",
    owner: "Phạm Thị Lợi",
    phone: "0987654321",
    address: "Khu phố Vĩnh Hiệp",
    province: "Kiên Giang",
    district: "Rạch Giá",
    level: "cap1",
    creditLimit: 900_000_000,
    notes: "Thanh toán chuyển khoản 7 ngày. Lấy Kali Belarus.",
    createdAt: iso(2024, 6, 8),
  },
  {
    id: "dl-05",
    name: "Cửa hàng VTNN Năm Đạt",
    owner: "Võ Văn Đạt",
    phone: "0975123789",
    address: "Đường 30/4",
    province: "Đồng Tháp",
    district: "Sa Đéc",
    level: "cap2",
    creditLimit: 280_000_000,
    notes: "Bán lẻ nông hộ, đơn nhỏ nhưng đều.",
    createdAt: iso(2025, 4, 2),
  },
  {
    id: "dl-06",
    name: "Đại lý Phước Thành",
    owner: "Huỳnh Phước Thành",
    phone: "0909876543",
    address: "Quốc lộ 1A, km 2098",
    province: "Tiền Giang",
    district: "Cai Lậy",
    level: "cap1",
    creditLimit: 750_000_000,
    notes: "Vùng chuyên canh lúa-màu, NPK 16-16-8 chạy mạnh.",
    createdAt: iso(2024, 2, 18),
  },
  {
    id: "dl-07",
    name: "VTNN Cô Bảy",
    owner: "Ngô Thị Bảy",
    phone: "0944789123",
    address: "Chợ Vị Thanh",
    province: "Hậu Giang",
    district: "Vị Thanh",
    level: "cap2",
    creditLimit: 220_000_000,
    notes: "Hay gọi gấp cuối tuần. Cần giữ tồn Urê.",
    createdAt: iso(2025, 7, 11),
  },
  {
    id: "dl-08",
    name: "Đại lý Hùng Phát",
    owner: "Đặng Hùng Phát",
    phone: "0933456789",
    address: "Lô 12, cụm công nghiệp Hưng Phú",
    province: "Cần Thơ",
    district: "Cái Răng",
    level: "cap1",
    creditLimit: 1_500_000_000,
    notes: "Tổng kho miền Tây, nhận overnight từ kho Cần Thơ.",
    createdAt: iso(2023, 8, 1),
  },
  {
    id: "dl-09",
    name: "HTX Hòa Bình",
    owner: "Lý Văn Bình",
    phone: "0966123456",
    address: "Ấp Hòa Bình",
    province: "An Giang",
    district: "Châu Phú",
    level: "cap2",
    creditLimit: 400_000_000,
    notes: "Mua theo nghị quyết HTX, cần hoá đơn đủ.",
    createdAt: iso(2024, 9, 15),
  },
  {
    id: "dl-10",
    name: "Đại lý Sáu Hương",
    owner: "Bùi Thị Hương",
    phone: "0912333444",
    address: "Tỉnh lộ 827",
    province: "Long An",
    district: "Tân An",
    level: "cap1",
    creditLimit: 650_000_000,
    notes: "Gần kho Long An, giao trong ngày.",
    createdAt: iso(2024, 5, 22),
  },
  {
    id: "dl-11",
    name: "Nông sản Tâm An",
    owner: "Trịnh Tâm An",
    phone: "0988111222",
    address: "Số 15 Phạm Hùng",
    province: "Vĩnh Long",
    district: "Vĩnh Long",
    level: "cap2",
    creditLimit: 300_000_000,
    notes: "Kết hợp vật tư + lúa, hay đổi hàng.",
    createdAt: iso(2025, 2, 9),
  },
  {
    id: "dl-12",
    name: "Nông hộ Ba Khỏe",
    owner: "Phan Văn Khỏe",
    phone: "0901555777",
    address: "Ấp Mỹ Phú",
    province: "An Giang",
    district: "Thoại Sơn",
    level: "nongho",
    creditLimit: 120_000_000,
    notes: "80 ha lúa, lấy thẳng không qua đại lý.",
    createdAt: iso(2025, 10, 3),
  },
];

const PRODUCTS: Product[] = [
  {
    id: "sp-urea",
    name: "Urê hạt đục 46%",
    sku: "URE-46",
    category: "urea",
    formula: "46-0-0",
    bagKg: 50,
    pricePerBag: 590_000,
    stockBags: 4200,
    origin: "Phú Mỹ / Cà Mau",
    description: "Phân đạm gốc, tan nhanh. Dùng bón thúc đẻ nhánh và làm đòng.",
  },
  {
    id: "sp-dap",
    name: "DAP Đình Vũ 18-46",
    sku: "DAP-1846",
    category: "dap",
    formula: "18-46-0",
    bagKg: 50,
    pricePerBag: 820_000,
    stockBags: 2100,
    origin: "Đình Vũ – Hải Phòng",
    description: "Lân gốc hàm lượng cao, bón lót trước sạ.",
  },
  {
    id: "sp-sa",
    name: "SA Phú Mỹ 21%",
    sku: "SA-21",
    category: "sa",
    formula: "21-0-0+24S",
    bagKg: 50,
    pricePerBag: 310_000,
    stockBags: 3600,
    origin: "Phú Mỹ",
    description: "Amoni sulphate, bổ sung lưu huỳnh cho đất phù sa.",
  },
  {
    id: "sp-kcl",
    name: "KCl Belarus 60%",
    sku: "KCL-60",
    category: "kcl",
    formula: "0-0-60",
    bagKg: 50,
    pricePerBag: 675_000,
    stockBags: 1800,
    origin: "Belarus",
    description: "Kali clorua gốc, bón đón đòng và chắc hạt.",
  },
  {
    id: "sp-npk168",
    name: "NPK 16-16-8 Bình Điền",
    sku: "NPK-16168",
    category: "npk",
    formula: "16-16-8",
    bagKg: 50,
    pricePerBag: 640_000,
    stockBags: 2500,
    origin: "Bình Điền",
    description: "NPK cân đối cho lúa giai đoạn đẻ nhánh.",
  },
  {
    id: "sp-npk2015",
    name: "NPK 20-20-15 Cà Mau",
    sku: "NPK-202015",
    category: "npk",
    formula: "20-20-15",
    bagKg: 50,
    pricePerBag: 710_000,
    stockBags: 1900,
    origin: "Cà Mau",
    description: "Công thức giàu đạm-lân, phục hồi sau sạ.",
  },
  {
    id: "sp-npk1515",
    name: "NPK 15-15-15 Con Cò",
    sku: "NPK-151515",
    category: "npk",
    formula: "15-15-15",
    bagKg: 50,
    pricePerBag: 655_000,
    stockBags: 1600,
    origin: "Con Cò",
    description: "NPK tổng quát, dùng được cho lúa và màu.",
  },
  {
    id: "sp-lan",
    name: "Super lân Lâm Thao",
    sku: "LAN-LT",
    category: "lan",
    formula: "0-16-0",
    bagKg: 50,
    pricePerBag: 390_000,
    stockBags: 2800,
    origin: "Lâm Thao",
    description: "Lân dễ tiêu, bón lót cải tạo đất chua.",
  },
  {
    id: "sp-hc",
    name: "Hữu cơ vi sinh Sông Gianh",
    sku: "HC-SG",
    category: "organic",
    formula: "Hữu cơ 30%",
    bagKg: 50,
    pricePerBag: 225_000,
    stockBags: 1400,
    origin: "Sông Gianh",
    description: "Cải tạo đất, dùng phối hợp phân gốc vô cơ.",
  },
  {
    id: "sp-npk16816",
    name: "NPK 16-8-16 Đầu Trâu",
    sku: "NPK-16816",
    category: "npk",
    formula: "16-8-16",
    bagKg: 50,
    pricePerBag: 680_000,
    stockBags: 1500,
    origin: "Bình Điền – Đầu Trâu",
    description: "Giàu kali, chuyên giai đoạn làm đòng.",
  },
];

const FLEET: Vehicle[] = [
  {
    id: "xe-01",
    name: "Hino 15 tấn",
    plate: "51C-123.45",
    driver: "Nguyễn Văn Hùng",
    driverPhone: "0909111222",
    capacityTons: 15,
    notes: "Xe chính tuyến Long Xuyên – Cần Thơ.",
  },
  {
    id: "xe-02",
    name: "Isuzu 8 tấn",
    plate: "65C-678.90",
    driver: "Lê Quốc Dũng",
    driverPhone: "0918333444",
    capacityTons: 8,
    notes: "Giao nội tỉnh Đồng Tháp.",
  },
  {
    id: "xe-03",
    name: "Hyundai 15 tấn",
    plate: "66C-246.81",
    driver: "Trần Minh Hải",
    driverPhone: "0987666555",
    capacityTons: 15,
    notes: "Chạy Kiên Giang – An Giang.",
  },
  {
    id: "xe-04",
    name: "Thaco 5 tấn",
    plate: "51C-555.19",
    driver: "Phạm Tấn Lộc",
    driverPhone: "0933777888",
    capacityTons: 5,
    notes: "Đơn lẻ, nông hộ, nội thành.",
  },
];

const WAREHOUSES = ["Kho Long Xuyên", "Kho Cần Thơ", "Kho Cao Lãnh"];

const MONTHS = [
  { y: 2026, m: 1, tons: 74, days: 31 },
  { y: 2026, m: 2, tons: 86, days: 28 },
  { y: 2026, m: 3, tons: 112, days: 31 },
  { y: 2026, m: 4, tons: 128, days: 30 },
  { y: 2026, m: 5, tons: 96, days: 31 },
  { y: 2026, m: 6, tons: 71, days: 30 },
  { y: 2026, m: 7, tons: 89, days: 31 },
  { y: 2026, m: 8, tons: 104, days: 23 },
];

export function createSeedData(): AppData {
  const rand = rng(20260823);
  const products = PRODUCTS.map((p) => ({ ...p }));
  const stockUsed: Record<string, number> = {};
  const orders: Order[] = [];
  const shipments: Shipment[] = [];
  const payments: Payment[] = [];
  const visits: Visit[] = [];
  let orderSeq = 1;

  const weightedProducts = [
    ...Array(6).fill("sp-urea"),
    ...Array(4).fill("sp-npk168"),
    ...Array(3).fill("sp-dap"),
    ...Array(3).fill("sp-npk2015"),
    ...Array(2).fill("sp-kcl"),
    ...Array(2).fill("sp-sa"),
    ...Array(2).fill("sp-npk1515"),
    ...Array(2).fill("sp-npk16816"),
    "sp-lan",
    "sp-hc",
  ] as string[];

  const weightedDealers = [
    ...Array(4).fill("dl-08"),
    ...Array(3).fill("dl-02"),
    ...Array(3).fill("dl-01"),
    ...Array(3).fill("dl-04"),
    ...Array(2).fill("dl-06"),
    ...Array(2).fill("dl-10"),
    "dl-03",
    "dl-05",
    "dl-07",
    "dl-09",
    "dl-11",
    "dl-12",
  ] as string[];

  for (const month of MONTHS) {
    let tonsLeft = month.tons;
    let guard = 0;
    while (tonsLeft > 3 && guard < 40) {
      guard += 1;
      const dealerId = pick(rand, weightedDealers);
      const nItems = rand() > 0.55 ? 2 : rand() > 0.2 ? 1 : 3;
      const used = new Set<string>();
      const items: Order["items"] = [];
      for (let i = 0; i < nItems; i += 1) {
        let pid = pick(rand, weightedProducts);
        let tries = 0;
        while (used.has(pid) && tries < 8) {
          pid = pick(rand, weightedProducts);
          tries += 1;
        }
        used.add(pid);
        const product = products.find((p) => p.id === pid);
        if (!product) continue;
        const maxTons = Math.min(18, Math.max(2, tonsLeft));
        const tons = 2 + rand() * (maxTons - 2);
        const bags = Math.max(20, Math.round((tons * 20) / 10) * 10);
        items.push({
          productId: pid,
          bags,
          unitPrice: product.pricePerBag,
        });
        stockUsed[pid] = (stockUsed[pid] ?? 0) + bags;
      }
      if (items.length === 0) break;

      const day = 1 + Math.floor(rand() * month.days);
      const hour = 7 + Math.floor(rand() * 10);
      const createdAt = iso(month.y, month.m, day, hour, Math.floor(rand() * 50));
      const deliveryDay = Math.min(month.days, day + 1 + Math.floor(rand() * 3));
      const deliveryDate = iso(month.y, month.m, deliveryDay, 6, 0);

      const isCurrent = month.m === 8;
      let status: Order["status"] = "delivered";
      if (isCurrent) {
        const roll = rand();
        if (roll < 0.12) status = "draft";
        else if (roll < 0.32) status = "confirmed";
        else if (roll < 0.62) status = "shipping";
        else if (roll < 0.95) status = "delivered";
        else status = "cancelled";
      } else if (rand() < 0.04) {
        status = "cancelled";
      }

      const code = `DH-${String(month.y).slice(2)}${String(month.m).padStart(2, "0")}-${String(orderSeq).padStart(3, "0")}`;
      const id = `dh-${String(orderSeq).padStart(3, "0")}`;
      orderSeq += 1;

      const order: Order = {
        id,
        code,
        dealerId,
        items,
        status,
        createdAt,
        deliveryDate,
        notes: rand() > 0.75 ? "Giao buổi sáng, gọi trước 30 phút." : "",
      };
      orders.push(order);

      const tons = items.reduce((s, it) => {
        const p = products.find((x) => x.id === it.productId);
        return s + bagsToTons(it.bags, p?.bagKg ?? 50);
      }, 0);
      if (status !== "cancelled" && status !== "draft") {
        tonsLeft -= tons;
      } else {
        tonsLeft -= 1;
      }

      if (status !== "draft" && status !== "cancelled") {
        const truck = pick(rand, FLEET);
        let shipStatus: Shipment["status"] = "delivered";
        if (status === "confirmed") shipStatus = rand() > 0.5 ? "pending" : "loading";
        if (status === "shipping") shipStatus = "in_transit";
        const rate = 70_000 + Math.round(rand() * 40_000);
        shipments.push({
          id: `vc-${id}`,
          orderId: id,
          vehicleId: truck.id,
          vehicle: truck.name,
          plate: truck.plate,
          driver: truck.driver,
          driverPhone: truck.driverPhone,
          freight: Math.round((tons * rate) / 10_000) * 10_000,
          warehouse: pick(rand, WAREHOUSES),
          status: shipStatus,
          departedAt:
            shipStatus === "pending" ? null : iso(month.y, month.m, deliveryDay, 5, 30),
          deliveredAt:
            shipStatus === "delivered"
              ? iso(month.y, month.m, deliveryDay, 11 + Math.floor(rand() * 5), 0)
              : null,
          notes: "",
        });
      }

      if (status === "delivered" || status === "shipping") {
        const total = orderTotal(order);
        const payRatio = status === "delivered" ? 0.55 + rand() * 0.45 : 0.2 + rand() * 0.4;
        const amount = Math.round((total * payRatio) / 10000) * 10000;
        if (amount > 0) {
          const payDay = Math.min(month.days, deliveryDay + Math.floor(rand() * 10));
          payments.push({
            id: `tt-${id}`,
            dealerId,
            orderId: id,
            amount,
            method: rand() > 0.35 ? "transfer" : "cash",
            date: iso(month.y, month.m, payDay, 14, 0),
            notes: "",
          });
        }
      }
    }
  }

  for (const product of products) {
    const used = stockUsed[product.id] ?? 0;
    product.stockBags = Math.max(80, product.stockBags - Math.floor(used * 0.15));
  }
  const urea = products.find((p) => p.id === "sp-urea");
  if (urea) urea.stockBags = 96;
  const kcl = products.find((p) => p.id === "sp-kcl");
  if (kcl) kcl.stockBags = 140;

  const visitNotes = [
    { purpose: "ban_hang" as const, notes: "Chào NPK 16-8-16 cho đợt đòng.", result: "Hẹn lấy 8 tấn tuần sau." },
    { purpose: "thu_no" as const, notes: "Nhắc công nợ quá 14 ngày.", result: "Hứa chuyển khoản thứ Sáu." },
    { purpose: "cham_soc" as const, notes: "Kiểm tra tồn kho đại lý.", result: "Urê sắp hết, cần bổ sung." },
    { purpose: "giao_hang" as const, notes: "Đi cùng xe giao, đối chiếu bao.", result: "Đủ số, ký biên bản." },
    { purpose: "ban_hang" as const, notes: "Báo giá DAP mới.", result: "Chốt 6 tấn DAP + 4 tấn SA." },
  ];

  for (let i = 0; i < 16; i += 1) {
    const tpl = visitNotes[i % visitNotes.length]!;
    const dealer = DEALERS[i % DEALERS.length]!;
    const day = 2 + ((i * 3) % 20);
    visits.push({
      id: `vt-${String(i + 1).padStart(2, "0")}`,
      dealerId: dealer.id,
      date: iso(2026, 8, day, 8 + (i % 6), 0),
      purpose: tpl.purpose,
      notes: tpl.notes,
      result: tpl.result,
    });
  }

  return {
    dealers: DEALERS,
    products,
    orders,
    vehicles: FLEET,
    shipments,
    payments,
    visits,
  };
}
