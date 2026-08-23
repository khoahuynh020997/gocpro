-- Gốc Pro wholesale sales schema (unowned rows — no auth)

create table if not exists dealers (
  id         serial primary key,
  name       text not null,
  phone      text not null default '',
  address    text not null default '',
  region     text not null default '',
  notes      text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists products (
  id            serial primary key,
  name          text not null,
  sku           text not null default '',
  category      text not null default '',
  unit          text not null default 'tấn',
  price_per_ton numeric(14, 0) not null default 0,
  notes         text not null default '',
  created_at    timestamptz not null default now()
);

create table if not exists vehicles (
  id           serial primary key,
  name         text not null,
  plate        text not null,
  driver_phone text not null default '',
  freight_cost numeric(14, 0) not null default 0,
  notes        text not null default '',
  created_at   timestamptz not null default now()
);

create table if not exists orders (
  id           serial primary key,
  dealer_id    integer not null references dealers (id),
  vehicle_id   integer references vehicles (id),
  order_date   date not null default current_date,
  status       text not null default 'moi',
  freight_cost numeric(14, 0) not null default 0,
  notes        text not null default '',
  created_at   timestamptz not null default now()
);

create table if not exists order_items (
  id         serial primary key,
  order_id   integer not null references orders (id) on delete cascade,
  product_id integer not null references products (id),
  tons       numeric(12, 2) not null,
  unit_price numeric(14, 0) not null
);

create index if not exists orders_date_idx on orders (order_date);
create index if not exists orders_dealer_idx on orders (dealer_id);
create index if not exists order_items_order_idx on order_items (order_id);

insert into dealers (id, name, phone, address, region, notes) values
  (1, 'Đại lý Minh Phát', '0903 123 456', '12 Quốc lộ 1A, Bình Tân', 'TP. Hồ Chí Minh', 'Đại lý cấp 1, thanh toán 15 ngày'),
  (2, 'Đại lý An Khang', '0912 888 221', '45 Phạm Văn Thuận, Biên Hòa', 'Đồng Nai', 'Chuyên xi măng và cát đá'),
  (3, 'Đại lý Thanh Sơn', '0988 441 009', '88 Đại lộ Bình Dương, Thủ Dầu Một', 'Bình Dương', 'Công trình dân dụng'),
  (4, 'Đại lý Phú Lộc', '0933 556 778', '03 Nguyễn Văn Cừ, Ninh Kiều', 'Cần Thơ', 'Phủ Tây Nam Bộ'),
  (5, 'Đại lý Hoàng Gia', '0905 667 334', '27 Nguyễn Văn Linh, Hải Châu', 'Đà Nẵng', 'Miền Trung');

insert into products (id, name, sku, category, unit, price_per_ton, notes) values
  (1, 'Xi măng PCB40 Holcim', 'XM-HOL-40', 'Xi măng', 'tấn', 1850000, 'Bao 50kg, pallet 2 tấn'),
  (2, 'Xi măng PCB40 Hà Tiên', 'XM-HT-40', 'Xi măng', 'tấn', 1790000, 'Giao kho nhà máy'),
  (3, 'Cát xây tô', 'CAT-XT', 'Cốt liệu', 'tấn', 320000, 'Cát vàng sông Đồng Nai'),
  (4, 'Đá 1x2', 'DA-12', 'Cốt liệu', 'tấn', 280000, 'Đá granite'),
  (5, 'Thép cuộn CB240', 'THEP-CB240', 'Thép', 'tấn', 14200000, 'Cuộn 8mm'),
  (6, 'Thép vằn D10 CB300', 'THEP-D10', 'Thép', 'tấn', 14800000, 'Thanh 11.7m'),
  (7, 'Gạch block AAC', 'GACH-AAC', 'Gạch', 'tấn', 1150000, 'Khối nhẹ 600x200x100');

insert into vehicles (id, name, plate, driver_phone, freight_cost, notes) values
  (1, 'Hino 15 tấn', '51C-123.45', '0901 234 567', 2500000, 'Thùng mui bạt, nội thành HCM'),
  (2, 'Isuzu 8 tấn', '61C-678.90', '0912 345 678', 1800000, 'Đồng Nai — Bình Dương'),
  (3, 'Đầu kéo 30 tấn', '50H-246.80', '0988 765 432', 4200000, 'Container / hàng nặng'),
  (4, 'Hyundai 5 tấn', '72C-334.21', '0934 112 233', 1200000, 'Cần Thơ và lân cận');

insert into orders (id, dealer_id, vehicle_id, order_date, status, freight_cost, notes) values
  (1, 1, 1, '2026-01-12', 'hoan_thanh', 2500000, ''),
  (2, 2, 2, '2026-01-28', 'hoan_thanh', 1800000, ''),
  (3, 3, 1, '2026-02-09', 'hoan_thanh', 2500000, ''),
  (4, 4, 4, '2026-02-21', 'hoan_thanh', 1200000, ''),
  (5, 5, 3, '2026-03-05', 'hoan_thanh', 4200000, ''),
  (6, 1, 1, '2026-03-18', 'hoan_thanh', 2500000, ''),
  (7, 2, 2, '2026-03-29', 'hoan_thanh', 1800000, ''),
  (8, 3, 3, '2026-04-11', 'hoan_thanh', 4200000, ''),
  (9, 1, 1, '2026-04-26', 'hoan_thanh', 2500000, ''),
  (10, 4, 4, '2026-05-07', 'hoan_thanh', 1200000, ''),
  (11, 2, 2, '2026-05-19', 'hoan_thanh', 1800000, ''),
  (12, 5, 3, '2026-05-30', 'hoan_thanh', 4200000, ''),
  (13, 1, 1, '2026-06-08', 'hoan_thanh', 2500000, ''),
  (14, 3, 2, '2026-06-22', 'hoan_thanh', 1800000, ''),
  (15, 2, 1, '2026-07-03', 'hoan_thanh', 2500000, ''),
  (16, 4, 4, '2026-07-14', 'hoan_thanh', 1200000, ''),
  (17, 1, 3, '2026-07-21', 'hoan_thanh', 4200000, ''),
  (18, 5, 3, '2026-07-29', 'hoan_thanh', 4200000, ''),
  (19, 2, 2, '2026-08-06', 'dang_giao', 1800000, 'Giao dở, còn 1 chuyến'),
  (20, 1, 1, '2026-08-15', 'dang_giao', 2500000, ''),
  (21, 3, 1, '2026-08-20', 'moi', 2500000, 'Chờ xác nhận kho'),
  (22, 4, 4, '2026-08-22', 'moi', 1200000, '');

insert into order_items (order_id, product_id, tons, unit_price) values
  (1, 1, 20, 1850000), (1, 3, 12, 320000),
  (2, 2, 18, 1790000), (2, 4, 15, 280000),
  (3, 5, 8, 14200000), (3, 6, 6, 14800000),
  (4, 1, 10, 1850000), (4, 7, 8, 1150000),
  (5, 5, 16, 14200000), (5, 6, 10, 14800000),
  (6, 1, 24, 1850000), (6, 2, 12, 1790000),
  (7, 3, 22, 320000), (7, 4, 20, 280000),
  (8, 5, 12, 14200000), (8, 1, 16, 1850000),
  (9, 2, 20, 1790000), (9, 7, 10, 1150000),
  (10, 1, 14, 1850000), (10, 3, 18, 320000),
  (11, 6, 9, 14800000), (11, 4, 12, 280000),
  (12, 5, 14, 14200000), (12, 2, 10, 1790000),
  (13, 1, 28, 1850000), (13, 3, 16, 320000),
  (14, 2, 18, 1790000), (14, 6, 7, 14800000),
  (15, 1, 22, 1850000), (15, 4, 14, 280000),
  (16, 7, 12, 1150000), (16, 3, 20, 320000),
  (17, 5, 18, 14200000), (17, 6, 8, 14800000),
  (18, 1, 16, 1850000), (18, 5, 10, 14200000),
  (19, 2, 20, 1790000), (19, 3, 15, 320000),
  (20, 1, 26, 1850000), (20, 4, 18, 280000),
  (21, 6, 8, 14800000), (21, 7, 6, 1150000),
  (22, 1, 12, 1850000), (22, 3, 10, 320000);

select setval('dealers_id_seq', (select max(id) from dealers));
select setval('products_id_seq', (select max(id) from products));
select setval('vehicles_id_seq', (select max(id) from vehicles));
select setval('orders_id_seq', (select max(id) from orders));
select setval('order_items_id_seq', (select max(id) from order_items));
