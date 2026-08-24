# GốcPro — quản lý bán hàng phân bón gốc

**Dùng ngay trên điện thoại / máy tính:** [khoahuynh020997.github.io/gocpro](https://khoahuynh020997.github.io/gocpro/)

App bán hàng cho đại lý phân bón miền Tây: đại lý, sản phẩm, đơn hàng, vận chuyển (xe + cước) và doanh số theo tháng/năm (tấn + tiền).

Dữ liệu lưu trên máy (localStorage), chạy được offline. App khởi động trống — tự thêm đại lý, sản phẩm, đơn hàng.

## Cài ra màn hình iPhone

1. Mở Safari: [Cài GốcPro](https://khoahuynh020997.github.io/gocpro/install.html)
2. Bấm **Cài đặt hồ sơ**
3. Vào **Cài đặt → Hồ sơ đã tải về → Cài đặt**

File hồ sơ: [gocpro.mobileconfig](https://khoahuynh020997.github.io/gocpro/gocpro.mobileconfig)

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

Nút **Xóa hết dữ liệu** trong menu sẽ xoá toàn bộ dữ liệu trên máy này.
