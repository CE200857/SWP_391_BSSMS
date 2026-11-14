# Kiểm thử API tự động BSSMS

Yêu cầu: Node.js 18 trở lên (`node -v`). Không cần `npm install`.

1. Chạy `00_Delete_Data.sql` (tùy chọn) rồi `02_Insert_Data.sql` để có dữ liệu mẫu theo ngày hôm nay.
2. Bật back-end trên Tomcat (mặc định `http://localhost:8080/BSSMS-back`).
3. Trong thư mục này chạy:

```
node bssms-api-test.mjs
```

Back-end chạy ở địa chỉ khác thì đặt biến môi trường trước khi chạy:

- Windows (cmd): `set BSSMS_API=http://localhost:8080/BSSMS-back && node bssms-api-test.mjs`
- PowerShell: `$env:BSSMS_API="http://localhost:8080/BSSMS-back"; node bssms-api-test.mjs`

Kết quả in ra màn hình và ghi vào `bssms-test-report.md` (danh sách bước lỗi kèm API, mã HTTP, thông báo).
Script có ghi dữ liệu (đặt lịch, thanh toán, duyệt nghỉ…), nên chạy lại `02_Insert_Data.sql` trước mỗi lần test.
