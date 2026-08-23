# Gốc Pro

App quản lý bán hàng đại lý: sản phẩm tính theo **tấn**, đơn hàng, xe vận chuyển và báo cáo doanh số.

## Chức năng

- **Đại lý** — danh sách đại lý, thêm / sửa / xoá
- **Sản phẩm** — danh mục hàng, giá theo tấn, thêm / bớt / sửa
- **Đơn hàng** — tạo đơn theo đại lý, chọn xe, nhập số tấn từng mặt hàng
- **Vận chuyển** — tên xe, biển số, SĐT tài xế, tiền cước
- **Doanh số** — theo tháng hoặc theo năm, tính **số tấn** và **số tiền**

## Chạy local

```bash
npm install
npm run dev
```

Mở [http://localhost:8080](http://localhost:8080). Dữ liệu mẫu (đại lý, sản phẩm, xe, đơn) được nạp sẵn.

## Ghi chú

Doanh số **không** tính đơn đã huỷ. Tiền hàng = số tấn × đơn giá. Tiền cước xe được thống kê riêng.
