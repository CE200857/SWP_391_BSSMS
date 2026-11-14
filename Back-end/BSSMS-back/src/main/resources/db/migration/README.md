# Cơ sở dữ liệu BSSMS (25 bảng)

Chạy lần lượt trên SQL Server (database `BeautySalonDB`) trước khi triển khai back-end:

1. `01_Create_Tables.sql` – tạo 25 bảng.
2. `02_Insert_Data.sql` – dữ liệu mẫu (mật khẩu mọi tài khoản mẫu: 123456).
3. `03_Constraints.sql` – khóa chính, khóa ngoại, UNIQUE, CHECK, DEFAULT (BR-01 … BR-20).

Back-end không dùng stored procedure; mọi nghiệp vụ nằm trong `bssms_persistence.common.BookingWorkflow`,
`BillingWorkflow` và các DAO. Công việc nền (`BackgroundJobWorker`) tự hủy lịch online chưa được xác nhận,
hết hạn liên kết VNPay sau 15 phút và hết hạn gói liệu trình; tắt bằng `BSSMS_JOBS_ENABLED=false`.
