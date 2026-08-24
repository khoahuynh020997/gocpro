# GốcPro — quản lý bán hàng phân bón gốc

**Dùng ngay trên điện thoại / máy tính:** [khoahuynh020997.github.io/gocpro](https://khoahuynh020997.github.io/gocpro/)

App bán hàng cho đại lý phân bón miền Tây: đại lý, sản phẩm, đơn hàng, vận chuyển (xe + cước) và doanh số theo tháng/năm (tấn + tiền).

Dữ liệu lưu trên máy (localStorage), chạy được offline. Có sẵn dữ liệu mẫu 8 tháng 2026.

## Tính năng

- **Đại lý** — thêm, sửa, xoá; cấp 1 / cấp 2 / nông hộ; hạn mức, công nợ
- **Sản phẩm** — danh mục phân gốc (Urê, DAP, SA, Kali, NPK…); thêm/bớt, giá theo bao, tồn kho
- **Đơn hàng** — tạo đơn nhiều dòng, trạng thái nháp → chốt → giao → xong
- **Vận chuyển**
  - Danh sách xe: tên xe, biển số, tài xế, SĐT, tải trọng
  - Từng chuyến: gán xe, tiền cước, kho xuất, trạng thái
- **Doanh số** — lọc theo tháng hoặc cả năm, tính **số tấn** và **số tiền**, xuất CSV
- **Công nợ / viếng thăm** — thu tiền, ghi chú tuyến

## Chạy trên máy

```bash
npm install
npm run dev
```

## Ghi chú

Nút **Khôi phục dữ liệu mẫu** trong menu sẽ ghi đè dữ liệu trên máy này.
