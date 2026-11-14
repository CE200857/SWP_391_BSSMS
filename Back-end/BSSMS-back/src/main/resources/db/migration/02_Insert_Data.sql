USE [BeautySalonDB];
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @NOW DATETIME2(0) = CAST(DATEADD(HOUR, 7, SYSUTCDATETIME()) AS DATETIME2(0));
DECLARE @D   DATE         = CAST(@NOW AS DATE);

DELETE FROM dbo.ServiceFeedback;   DELETE FROM dbo.TreatmentPhoto;     DELETE FROM dbo.Refund;
DELETE FROM dbo.PaymentAttempt;    DELETE FROM dbo.Payment;            DELETE FROM dbo.InvoiceService;
DELETE FROM dbo.InvoicePackage;    DELETE FROM dbo.AppointmentStatusHistory;
DELETE FROM dbo.AppointmentService; DELETE FROM dbo.CustomerPackage;   DELETE FROM dbo.Invoice;
DELETE FROM dbo.Appointment;       DELETE FROM dbo.TechnicianDailyTour; DELETE FROM dbo.StaffLeave;
DELETE FROM dbo.StaffShift;        DELETE FROM dbo.StaffService;       DELETE FROM dbo.Bed;
DELETE FROM dbo.Room;              DELETE FROM dbo.TreatmentPackageService; DELETE FROM dbo.TreatmentPackage;
DELETE FROM dbo.Voucher;           DELETE FROM dbo.Service;            DELETE FROM dbo.Customer;
DELETE FROM dbo.Staff;             DELETE FROM dbo.MembershipTier;

SET IDENTITY_INSERT dbo.MembershipTier ON;
INSERT INTO dbo.MembershipTier (membership_tier_id, tier_name, min_spending, discount_percent, description) VALUES
  (1, N'Standard', 0, 0, N'Hạng mặc định khi đăng ký'),
  (2, N'Silver', 5000000, 5, N'Giảm 5% dịch vụ và gói liệu trình'),
  (3, N'Gold', 10000000, 10, N'Giảm 10% dịch vụ và gói liệu trình'),
  (4, N'VIP', 15000000, 15, N'Giảm 15%, ưu tiên phòng yên tĩnh'),
  (5, N'VVIP', 20000000, 20, N'Giảm 20%, ưu tiên kỹ thuật viên yêu thích');
SET IDENTITY_INSERT dbo.MembershipTier OFF;

SET IDENTITY_INSERT dbo.Staff ON;
INSERT INTO dbo.Staff (staff_id, full_name, phone, email, role, hire_date, username, password, status, created_at, otp_code, otp_purpose, otp_attempts, otp_expiry_time, otp_created_at, otp_consumed_at) VALUES
  (1, N'Nguyễn Thị Lan', N'0901000001', N'lan.manager@bssms.vn', N'Manager', DATEADD(DAY,-700,@D), N'lan.nt', N'e10adc3949ba59abbe56e057f20f883e', N'Active', DATEADD(MINUTE,480,CAST(DATEADD(DAY,-700,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL),
  (2, N'Trần Thu Hà', N'0901000002', N'ha.reception@bssms.vn', N'Receptionist', DATEADD(DAY,-600,@D), N'ha.tt', N'e10adc3949ba59abbe56e057f20f883e', N'Active', DATEADD(MINUTE,480,CAST(DATEADD(DAY,-600,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL),
  (3, N'Lê Minh Thư', N'0901000003', N'thu.reception@bssms.vn', N'Receptionist', DATEADD(DAY,-500,@D), N'thu.lm', N'e10adc3949ba59abbe56e057f20f883e', N'Active', DATEADD(MINUTE,480,CAST(DATEADD(DAY,-500,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL),
  (4, N'Phạm Ngọc Mai', N'0901000004', N'mai.tech@bssms.vn', N'Technician', DATEADD(DAY,-650,@D), N'mai.pn', N'e10adc3949ba59abbe56e057f20f883e', N'Active', DATEADD(MINUTE,480,CAST(DATEADD(DAY,-650,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL),
  (5, N'Võ Thị Hương', N'0901000005', N'huong.tech@bssms.vn', N'Technician', DATEADD(DAY,-640,@D), N'huong.vt', N'e10adc3949ba59abbe56e057f20f883e', N'Active', DATEADD(MINUTE,480,CAST(DATEADD(DAY,-640,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL),
  (6, N'Đặng Thanh Trúc', N'0901000006', N'truc.tech@bssms.vn', N'Technician', DATEADD(DAY,-560,@D), N'truc.dt', N'e10adc3949ba59abbe56e057f20f883e', N'Active', DATEADD(MINUTE,480,CAST(DATEADD(DAY,-560,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL),
  (7, N'Bùi Thị Ngọc', N'0901000007', N'ngoc.tech@bssms.vn', N'Technician', DATEADD(DAY,-480,@D), N'ngoc.bt', N'e10adc3949ba59abbe56e057f20f883e', N'Active', DATEADD(MINUTE,480,CAST(DATEADD(DAY,-480,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL),
  (8, N'Huỳnh Kim Quy', N'0901000008', N'quy.tech@bssms.vn', N'Technician', DATEADD(DAY,-420,@D), N'quy.hk', N'e10adc3949ba59abbe56e057f20f883e', N'Active', DATEADD(MINUTE,480,CAST(DATEADD(DAY,-420,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL);
SET IDENTITY_INSERT dbo.Staff OFF;

SET IDENTITY_INSERT dbo.Customer ON;
INSERT INTO dbo.Customer (customer_id, membership_tier_id, full_name, date_of_birth, gender, address, phone, email, skin_condition, allergies, notes, lifetime_spending, username, password, status, created_at, otp_code, otp_purpose, otp_attempts, otp_expiry_time, otp_created_at, otp_consumed_at, otp_email) VALUES
  (1, 2, N'Nguyễn Thị Hoa', N'1995-04-12', N'Female', N'12 Lê Lợi, Quận 1, TP. Hồ Chí Minh', N'0912000001', N'hoa.nguyen@gmail.com', N'Da hỗn hợp, lỗ chân lông to', N'Không', N'Thích tinh dầu oải hương', 6200000, N'hoa.nguyen', N'e10adc3949ba59abbe56e057f20f883e', N'Active', DATEADD(MINUTE,600,CAST(DATEADD(DAY,-280,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL, NULL),
  (2, 3, N'Trần Minh Anh', N'1990-09-03', N'Female', N'45 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh', N'0912000002', N'minhanh.tran@gmail.com', N'Da khô', N'Dị ứng hải sản', NULL, 12500000, N'minhanh.tran', N'e10adc3949ba59abbe56e057f20f883e', N'Active', DATEADD(MINUTE,600,CAST(DATEADD(DAY,-250,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL, NULL),
  (3, 1, N'Lê Quốc Bảo', N'1998-01-25', N'Male', N'78 Cách Mạng Tháng 8, Quận 3, TP. Hồ Chí Minh', N'0912000003', N'bao.le@gmail.com', N'Da dầu', N'Không', NULL, 765000, N'bao.le', N'e10adc3949ba59abbe56e057f20f883e', N'Active', DATEADD(MINUTE,600,CAST(DATEADD(DAY,-200,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL, NULL),
  (4, 1, N'Phạm Thu Trang', N'2000-11-30', N'Female', N'9 Võ Văn Tần, Quận 3, TP. Hồ Chí Minh', N'0912000004', N'trang.pham@gmail.com', N'Da nhạy cảm', N'Dị ứng retinol', NULL, 1200000, N'trang.pham', N'e10adc3949ba59abbe56e057f20f883e', N'Active', DATEADD(MINUTE,600,CAST(DATEADD(DAY,-180,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL, NULL),
  (5, 4, N'Hoàng Gia Linh', N'1988-06-18', N'Female', N'120 Hai Bà Trưng, Quận 1, TP. Hồ Chí Minh', N'0912000005', N'linh.hoang@gmail.com', N'Da thường', N'Không', N'Khách quen, thích phòng yên tĩnh', 16800000, N'linh.hoang', N'e10adc3949ba59abbe56e057f20f883e', N'Active', DATEADD(MINUTE,600,CAST(DATEADD(DAY,-160,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL, NULL),
  (6, 2, N'Đỗ Thanh Tâm', N'1993-02-14', N'Female', N'33 Điện Biên Phủ, Bình Thạnh, TP. Hồ Chí Minh', N'0912000006', N'tam.do@gmail.com', N'Da mụn ẩn', N'Không', NULL, 7400000, N'tam.do', N'e10adc3949ba59abbe56e057f20f883e', N'Active', DATEADD(MINUTE,600,CAST(DATEADD(DAY,-130,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL, NULL),
  (7, 5, N'Vũ Ngọc Diệp', N'1985-08-08', N'Female', N'5 Phạm Ngọc Thạch, Quận 3, TP. Hồ Chí Minh', N'0912000007', N'diep.vu@gmail.com', N'Da lão hóa', N'Không', N'Khách VVIP', 23600000, N'diep.vu', N'e10adc3949ba59abbe56e057f20f883e', N'Active', DATEADD(MINUTE,600,CAST(DATEADD(DAY,-100,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL, NULL),
  (8, 1, N'Ngô Hải Yến', N'2002-12-01', N'Female', N'66 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh', N'0912000008', N'yen.ngo@gmail.com', NULL, NULL, NULL, 0, N'yen.ngo', N'e10adc3949ba59abbe56e057f20f883e', N'Active', DATEADD(MINUTE,600,CAST(DATEADD(DAY,-60,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL, NULL),
  (9, 1, N'Bùi Đức Thịnh', N'1997-05-20', N'Male', N'21 Lý Tự Trọng, Quận 1, TP. Hồ Chí Minh', N'0912000009', NULL, NULL, NULL, N'Khách walk-in, tài khoản do lễ tân tạo', 0, NULL, NULL, N'Active', DATEADD(MINUTE,600,CAST(DATEADD(DAY,-40,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL, NULL),
  (10, 3, N'Mai Phương Thảo', N'1991-03-09', N'Female', N'88 Pasteur, Quận 3, TP. Hồ Chí Minh', N'0912000010', N'thao.mai@gmail.com', N'Da khô, nám nhẹ', N'Không', NULL, 10900000, N'thao.mai', N'e10adc3949ba59abbe56e057f20f883e', N'Active', DATEADD(MINUTE,600,CAST(DATEADD(DAY,-220,@D) AS DATETIME2(0))), NULL, NULL, 0, NULL, NULL, NULL, NULL);
SET IDENTITY_INSERT dbo.Customer OFF;

SET IDENTITY_INSERT dbo.Service ON;
INSERT INTO dbo.Service (service_id, service_name, description, category, required_room_type, price, duration, tour_count, status, image_key) VALUES
  (1, N'Gội đầu dưỡng sinh', N'Dịch vụ gội đầu dưỡng sinh tại Seoul Center.', N'Hair', N'HairWash', 150000, 30, 1, N'Active', NULL),
  (2, N'Chăm sóc da mặt cơ bản', N'Dịch vụ chăm sóc da mặt cơ bản tại Seoul Center.', N'Facial', N'Facial', 300000, 60, 1, N'Active', NULL),
  (3, N'Chăm sóc da mặt chuyên sâu', N'Dịch vụ chăm sóc da mặt chuyên sâu tại Seoul Center.', N'Facial', N'Facial', 550000, 90, 2, N'Active', NULL),
  (4, N'Trị mụn chuẩn y khoa', N'Dịch vụ trị mụn chuẩn y khoa tại Seoul Center.', N'Facial', N'Facial', 450000, 60, 1, N'Active', NULL),
  (5, N'Massage body thư giãn', N'Dịch vụ massage body thư giãn tại Seoul Center.', N'Massage', N'Massage', 400000, 60, 1, N'Active', NULL),
  (6, N'Massage đá nóng', N'Dịch vụ massage đá nóng tại Seoul Center.', N'Massage', N'Massage', 600000, 90, 2, N'Active', NULL),
  (7, N'Massage chân', N'Dịch vụ massage chân tại Seoul Center.', N'Massage', N'Massage', 250000, 45, 1, N'Active', NULL),
  (8, N'Tắm trắng toàn thân', N'Dịch vụ tắm trắng toàn thân tại Seoul Center.', N'Body', N'Body', 900000, 120, 2, N'Active', NULL),
  (9, N'Triệt lông vùng nách', N'Dịch vụ triệt lông vùng nách tại Seoul Center.', N'Body', N'Body', 200000, 30, 1, N'Active', NULL),
  (10, N'Combo thư giãn toàn thân', N'Dịch vụ combo thư giãn toàn thân tại Seoul Center.', N'Massage', N'Massage', 1100000, 150, 3, N'Active', NULL);
SET IDENTITY_INSERT dbo.Service OFF;

SET IDENTITY_INSERT dbo.TreatmentPackage ON;
INSERT INTO dbo.TreatmentPackage (treatment_package_id, package_name, description, price, number_of_sessions, validity_days, status) VALUES
  (1, N'Gói massage body 10 buổi', N'10 buổi massage body hoặc massage chân, dùng trong 180 ngày.', 3500000, 10, 180, N'Active'),
  (2, N'Gói chăm sóc da mặt 6 buổi', N'6 buổi chăm sóc da mặt cơ bản, dùng trong 120 ngày.', 1600000, 6, 120, N'Active'),
  (3, N'Gói trị mụn 8 buổi', N'8 buổi trị mụn chuẩn y khoa, dùng trong 150 ngày.', 3200000, 8, 150, N'Active'),
  (4, N'Gói gội đầu 10 buổi', N'10 buổi gội đầu dưỡng sinh, dùng trong 90 ngày.', 1200000, 10, 90, N'Active');
SET IDENTITY_INSERT dbo.TreatmentPackage OFF;

INSERT INTO dbo.TreatmentPackageService (treatment_package_id, service_id) VALUES
  (1, 5),
  (1, 7),
  (2, 2),
  (3, 4),
  (4, 1);

SET IDENTITY_INSERT dbo.Room ON;
INSERT INTO dbo.Room (room_id, room_name, room_type, status) VALUES
  (1, N'Phòng Facial 1', N'Facial', N'Active'),
  (2, N'Phòng Massage 1', N'Massage', N'Active'),
  (3, N'Phòng Gội đầu', N'HairWash', N'Active'),
  (4, N'Phòng Body', N'Body', N'Active'),
  (5, N'Phòng Massage 2', N'Massage', N'Maintenance');
SET IDENTITY_INSERT dbo.Room OFF;

SET IDENTITY_INSERT dbo.Bed ON;
INSERT INTO dbo.Bed (bed_id, room_id, bed_number, status, use_state, use_state_updated_at) VALUES
  (1, 1, N'F1-01', N'Active', N'Free', NULL),
  (2, 1, N'F1-02', N'Active', N'Free', NULL),
  (3, 1, N'F1-03', N'Maintenance', N'Free', NULL),
  (4, 2, N'M1-01', N'Active', N'Free', NULL),
  (5, 2, N'M1-02', N'Active', N'Free', NULL),
  (6, 2, N'M1-03', N'Active', N'Free', NULL),
  (7, 3, N'H-01', N'Active', N'Free', NULL),
  (8, 3, N'H-02', N'Active', N'Free', NULL),
  (9, 4, N'B-01', N'Active', N'Free', NULL),
  (10, 4, N'B-02', N'Active', N'Free', NULL),
  (11, 5, N'M2-01', N'Maintenance', N'Free', NULL);
SET IDENTITY_INSERT dbo.Bed OFF;

INSERT INTO dbo.StaffService (staff_id, service_id) VALUES
  (4, 1),
  (4, 2),
  (4, 3),
  (4, 4),
  (5, 2),
  (5, 3),
  (5, 4),
  (5, 8),
  (5, 9),
  (6, 5),
  (6, 6),
  (6, 7),
  (6, 10),
  (7, 1),
  (7, 5),
  (7, 7),
  (7, 8),
  (7, 9),
  (8, 1),
  (8, 2),
  (8, 5),
  (8, 6),
  (8, 7),
  (8, 10);

WITH n AS (SELECT TOP (38) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 8 AS k FROM sys.all_objects),
     p AS (SELECT * FROM (VALUES (4,N'FullDay'),(5,N'FullDay'),(6,N'Morning'),(7,N'Afternoon'),(8,N'FullDay'),(2,N'FullDay'),(3,N'Afternoon')) v(staff_id, shift_type))
INSERT INTO dbo.StaffShift (staff_id, shift_date, shift_type, start_time, end_time)
SELECT p.staff_id, DATEADD(DAY, n.k, @D), p.shift_type,
       CASE p.shift_type WHEN N'Afternoon' THEN '13:30' ELSE '08:30' END,
       CASE p.shift_type WHEN N'Morning' THEN '13:30' ELSE '18:30' END
FROM n CROSS JOIN p
WHERE NOT (p.staff_id = 7 AND n.k = 3);

SET IDENTITY_INSERT dbo.StaffLeave ON;
INSERT INTO dbo.StaffLeave (leave_id, staff_id, start_date, end_date, reason, status, requested_at, approved_by_staff_id, decided_at, decision_note) VALUES
  (1, 7, DATEADD(DAY,3,@D), DATEADD(DAY,3,@D), N'Việc gia đình', N'Approved', DATEADD(MINUTE,540,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), 1, DATEADD(MINUTE,900,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), N'Lễ tân điều phối lại lịch của khách'),
  (2, 4, DATEADD(DAY,5,@D), DATEADD(DAY,6,@D), N'Khám sức khỏe', N'Pending', DATEADD(MINUTE,1020,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), NULL, NULL, NULL),
  (3, 6, DATEADD(DAY,8,@D), DATEADD(DAY,8,@D), N'Về quê', N'Rejected', DATEADD(MINUTE,510,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), 1, DATEADD(MINUTE,660,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), N'Ngày đó đã kín lịch');
SET IDENTITY_INSERT dbo.StaffLeave OFF;

SET IDENTITY_INSERT dbo.Voucher ON;
INSERT INTO dbo.Voucher (voucher_id, voucher_code, voucher_name, discount_type, discount_value, min_order_amount, max_discount, max_uses, used_count, start_date, end_date, status, created_by_staff_id) VALUES
  (1, N'WELCOME10', N'Giảm 10% cho khách mới', N'Percent', 10, 300000, 200000, 100, 1, DATEADD(MINUTE,0,CAST(DATEADD(DAY,-30,@D) AS DATETIME2(0))), DATEADD(MINUTE,1439,CAST(DATEADD(DAY,60,@D) AS DATETIME2(0))), N'Active', 1),
  (2, N'GIAM50K', N'Giảm 50.000đ cho đơn từ 400.000đ', N'Amount', 50000, 400000, NULL, 200, 0, DATEADD(MINUTE,0,CAST(DATEADD(DAY,-10,@D) AS DATETIME2(0))), DATEADD(MINUTE,1439,CAST(DATEADD(DAY,20,@D) AS DATETIME2(0))), N'Active', 1),
  (3, N'SUMMER20', N'Ưu đãi hè 20%', N'Percent', 20, 500000, 300000, 50, 50, DATEADD(MINUTE,0,CAST(DATEADD(DAY,-160,@D) AS DATETIME2(0))), DATEADD(MINUTE,1439,CAST(DATEADD(DAY,-70,@D) AS DATETIME2(0))), N'Inactive', 1);
SET IDENTITY_INSERT dbo.Voucher OFF;

SET IDENTITY_INSERT dbo.Appointment ON;
INSERT INTO dbo.Appointment (appointment_id, customer_id, appointment_date, start_time, end_time, status, payment_choice, notes, created_by_staff_id, created_at, confirmed_at, checked_in_at, completed_at, cancelled_at, cancellation_reason) VALUES
  (1, 1, DATEADD(DAY,-3,@D), N'09:00', N'10:30', N'Completed', N'Counter', NULL, NULL, DATEADD(MINUTE,1210,CAST(DATEADD(DAY,-5,@D) AS DATETIME2(0))), DATEADD(MINUTE,520,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), DATEADD(MINUTE,535,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), DATEADD(MINUTE,630,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), NULL, NULL),
  (2, 2, DATEADD(DAY,-3,@D), N'14:00', N'15:00', N'Completed', N'Counter', N'Dùng buổi gói massage', 2, DATEADD(MINUTE,600,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), DATEADD(MINUTE,600,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), DATEADD(MINUTE,835,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), DATEADD(MINUTE,900,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), NULL, NULL),
  (3, 3, DATEADD(DAY,-2,@D), N'10:00', N'12:30', N'Completed', N'Online', NULL, NULL, DATEADD(MINUTE,1260,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), DATEADD(MINUTE,1265,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), DATEADD(MINUTE,598,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), DATEADD(MINUTE,750,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), NULL, NULL),
  (4, 4, DATEADD(DAY,-2,@D), N'09:00', N'10:00', N'No-show', N'Counter', NULL, NULL, DATEADD(MINUTE,1140,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), DATEADD(MINUTE,510,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), NULL, NULL, NULL, NULL),
  (5, 5, DATEADD(DAY,-1,@D), N'15:00', N'16:30', N'Cancelled', N'Online', NULL, NULL, DATEADD(MINUTE,480,CAST(DATEADD(DAY,-5,@D) AS DATETIME2(0))), DATEADD(MINUTE,483,CAST(DATEADD(DAY,-5,@D) AS DATETIME2(0))), NULL, NULL, DATEADD(MINUTE,960,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), N'Khách bận công tác'),
  (6, 10, DATEADD(DAY,-1,@D), N'10:00', N'11:00', N'Completed', N'Counter', NULL, 3, DATEADD(MINUTE,900,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), DATEADD(MINUTE,900,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), DATEADD(MINUTE,595,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), DATEADD(MINUTE,660,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), NULL, NULL),
  (7, 5, DATEADD(DAY,0,@D), N'08:30', N'09:30', N'Completed', N'Counter', N'Khách yêu cầu KTV Quy', 2, DATEADD(MINUTE,540,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), DATEADD(MINUTE,540,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), DATEADD(MINUTE,505,CAST(DATEADD(DAY,0,@D) AS DATETIME2(0))), DATEADD(MINUTE,570,CAST(DATEADD(DAY,0,@D) AS DATETIME2(0))), NULL, NULL),
  (8, 6, DATEADD(DAY,0,@D), N'10:00', N'11:30', N'Checked-in', N'Counter', N'Buổi 1 gói da mặt + gội đầu', NULL, DATEADD(MINUTE,720,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), DATEADD(MINUTE,780,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), DATEADD(MINUTE,595,CAST(DATEADD(DAY,0,@D) AS DATETIME2(0))), NULL, NULL, NULL),
  (9, 10, DATEADD(DAY,0,@D), N'14:00', N'15:30', N'Confirmed', N'Online', N'Đã thanh toán VNPay', NULL, DATEADD(MINUTE,1200,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), DATEADD(MINUTE,1204,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), NULL, NULL, NULL, NULL),
  (10, 7, DATEADD(DAY,0,@D), N'15:00', N'17:45', N'Confirmed', N'Counter', N'3 dịch vụ: chia 2 KTV khi check-in', 3, DATEADD(MINUTE,900,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), DATEADD(MINUTE,900,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), NULL, NULL, NULL, NULL),
  (11, 4, DATEADD(DAY,0,@D), N'09:00', N'10:00', N'Confirmed', N'Counter', NULL, NULL, DATEADD(MINUTE,1140,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), DATEADD(MINUTE,1200,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), NULL, NULL, NULL, NULL),
  (12, 8, DATEADD(DAY,1,@D), N'10:00', N'11:30', N'Pending', N'Counter', N'Khách đặt online, chờ lễ tân xác nhận', NULL, DATEADD(MINUTE,-60,@NOW), NULL, NULL, NULL, NULL, NULL),
  (13, 3, DATEADD(DAY,1,@D), N'14:00', N'14:30', N'Pending', N'Online', N'Chọn thanh toán VNPay, chưa thanh toán', NULL, DATEADD(MINUTE,-60,@NOW), NULL, NULL, NULL, NULL, NULL),
  (14, 1, DATEADD(DAY,2,@D), N'09:30', N'10:30', N'Confirmed', N'Counter', N'Dùng buổi gói da mặt', NULL, DATEADD(MINUTE,1260,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), DATEADD(MINUTE,520,CAST(DATEADD(DAY,0,@D) AS DATETIME2(0))), NULL, NULL, NULL, NULL),
  (15, 2, DATEADD(DAY,3,@D), N'13:30', N'14:30', N'Confirmed', N'Counter', N'Khách yêu cầu KTV Ngọc (đã được duyệt nghỉ)', NULL, DATEADD(MINUTE,600,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), DATEADD(MINUTE,630,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), NULL, NULL, NULL, NULL),
  (16, 10, DATEADD(DAY,5,@D), N'09:00', N'10:30', N'Confirmed', N'Counter', N'Khách yêu cầu KTV Mai', 2, DATEADD(MINUTE,660,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), DATEADD(MINUTE,660,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), NULL, NULL, NULL, NULL);
SET IDENTITY_INSERT dbo.Appointment OFF;

SET IDENTITY_INSERT dbo.Invoice ON;
INSERT INTO dbo.Invoice (invoice_id, customer_id, invoice_type, appointment_id, voucher_id, created_by_staff_id, invoice_date, subtotal, tier_discount, voucher_discount, total_discount, total_amount, status, paid_at, cancelled_at, cancellation_reason) VALUES
  (1, 1, N'Appointment', 1, NULL, 2, DATEADD(MINUTE,1210,CAST(DATEADD(DAY,-5,@D) AS DATETIME2(0))), 450000, 22500, 0, 22500, 427500, N'Paid', DATEADD(MINUTE,635,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), NULL, NULL),
  (2, 3, N'Appointment', 3, 1, NULL, DATEADD(MINUTE,1260,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), 850000, 0, 85000, 85000, 765000, N'Paid', DATEADD(MINUTE,1265,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), NULL, NULL),
  (3, 4, N'Appointment', 4, NULL, NULL, DATEADD(MINUTE,1140,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), 450000, 0, 0, 0, 450000, N'Cancelled', NULL, DATEADD(MINUTE,556,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), N'Khách không đến (No-show)'),
  (4, 5, N'Appointment', 5, NULL, NULL, DATEADD(MINUTE,480,CAST(DATEADD(DAY,-5,@D) AS DATETIME2(0))), 600000, 90000, 0, 90000, 510000, N'Refunded', DATEADD(MINUTE,483,CAST(DATEADD(DAY,-5,@D) AS DATETIME2(0))), NULL, NULL),
  (5, 10, N'Appointment', 6, NULL, 3, DATEADD(MINUTE,900,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), 300000, 30000, 0, 30000, 270000, N'Paid', DATEADD(MINUTE,665,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), NULL, NULL),
  (6, 5, N'Appointment', 7, NULL, 2, DATEADD(MINUTE,540,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), 400000, 60000, 0, 60000, 340000, N'Paid', DATEADD(MINUTE,575,CAST(DATEADD(DAY,0,@D) AS DATETIME2(0))), NULL, NULL),
  (7, 6, N'Appointment', 8, NULL, NULL, DATEADD(MINUTE,720,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), 150000, 7500, 0, 7500, 142500, N'Unpaid', NULL, NULL, NULL),
  (8, 10, N'Appointment', 9, NULL, NULL, DATEADD(MINUTE,1200,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), 550000, 55000, 0, 55000, 495000, N'Paid', DATEADD(MINUTE,1204,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), NULL, NULL),
  (9, 7, N'Appointment', 10, NULL, 3, DATEADD(MINUTE,900,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), 950000, 190000, 0, 190000, 760000, N'Unpaid', NULL, NULL, NULL),
  (10, 4, N'Appointment', 11, NULL, NULL, DATEADD(MINUTE,1140,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), 450000, 0, 0, 0, 450000, N'Unpaid', NULL, NULL, NULL),
  (11, 8, N'Appointment', 12, NULL, NULL, DATEADD(MINUTE,-60,@NOW), 450000, 0, 0, 0, 450000, N'Unpaid', NULL, NULL, NULL),
  (12, 3, N'Appointment', 13, NULL, NULL, DATEADD(MINUTE,-60,@NOW), 200000, 0, 0, 0, 200000, N'Unpaid', NULL, NULL, NULL),
  (13, 10, N'Appointment', 16, NULL, 2, DATEADD(MINUTE,660,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), 550000, 55000, 0, 55000, 495000, N'Unpaid', NULL, NULL, NULL),
  (14, 2, N'Package', NULL, NULL, NULL, DATEADD(MINUTE,1140,CAST(DATEADD(DAY,-30,@D) AS DATETIME2(0))), 3500000, 350000, 0, 350000, 3150000, N'Paid', DATEADD(MINUTE,1140,CAST(DATEADD(DAY,-30,@D) AS DATETIME2(0))), NULL, NULL),
  (15, 6, N'Package', NULL, NULL, 2, DATEADD(MINUTE,600,CAST(DATEADD(DAY,-13,@D) AS DATETIME2(0))), 1600000, 80000, 0, 80000, 1520000, N'Paid', DATEADD(MINUTE,600,CAST(DATEADD(DAY,-13,@D) AS DATETIME2(0))), NULL, NULL),
  (16, 1, N'Package', NULL, NULL, NULL, DATEADD(MINUTE,1200,CAST(DATEADD(DAY,-10,@D) AS DATETIME2(0))), 1600000, 80000, 0, 80000, 1520000, N'Paid', DATEADD(MINUTE,1200,CAST(DATEADD(DAY,-10,@D) AS DATETIME2(0))), NULL, NULL),
  (17, 1, N'Package', NULL, NULL, NULL, DATEADD(MINUTE,1205,CAST(DATEADD(DAY,-10,@D) AS DATETIME2(0))), 1200000, 60000, 0, 60000, 1140000, N'Paid', DATEADD(MINUTE,1205,CAST(DATEADD(DAY,-10,@D) AS DATETIME2(0))), NULL, NULL);
SET IDENTITY_INSERT dbo.Invoice OFF;

SET IDENTITY_INSERT dbo.CustomerPackage ON;
INSERT INTO dbo.CustomerPackage (customer_package_id, customer_id, treatment_package_id, sold_invoice_id, sold_by_staff_id, purchase_date, expiry_date, total_sessions, remaining_sessions, purchase_price, status) VALUES
  (1, 2, 1, 14, NULL, DATEADD(MINUTE,1140,CAST(DATEADD(DAY,-30,@D) AS DATETIME2(0))), DATEADD(DAY,150,@D), 10, 9, 3150000, N'Active'),
  (2, 6, 2, 15, 2, DATEADD(MINUTE,600,CAST(DATEADD(DAY,-13,@D) AS DATETIME2(0))), DATEADD(DAY,107,@D), 6, 6, 1520000, N'Active'),
  (3, 1, 2, 16, NULL, DATEADD(MINUTE,1200,CAST(DATEADD(DAY,-10,@D) AS DATETIME2(0))), DATEADD(DAY,110,@D), 6, 6, 1520000, N'Active'),
  (4, 1, 4, 17, NULL, DATEADD(MINUTE,1205,CAST(DATEADD(DAY,-10,@D) AS DATETIME2(0))), DATEADD(DAY,80,@D), 10, 10, 1140000, N'Active');
SET IDENTITY_INSERT dbo.CustomerPackage OFF;

SET IDENTITY_INSERT dbo.AppointmentService ON;
INSERT INTO dbo.AppointmentService (appointment_service_id, appointment_id, service_id, line_no, start_time, end_time, technician_id, is_requested_technician, tour_count, bed_id, customer_package_id, unit_price, status, started_at, done_at, result_notes, skin_reaction) VALUES
  (1, 1, 1, 1, N'09:00', N'09:30', 4, 0, 1, 7, NULL, 150000, N'Done', DATEADD(MINUTE,540,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), DATEADD(MINUTE,570,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), N'Da đầu khỏe, giảm gàu', NULL),
  (2, 1, 2, 2, N'09:30', N'10:30', 4, 0, 1, 1, NULL, 300000, N'Done', DATEADD(MINUTE,571,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), DATEADD(MINUTE,630,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), N'Da sạch, se khít lỗ chân lông', N'Không kích ứng'),
  (3, 2, 5, 1, N'14:00', N'15:00', 8, 1, 1, 4, 1, 0, N'Done', DATEADD(MINUTE,840,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), DATEADD(MINUTE,900,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), N'Giảm đau mỏi vai gáy', NULL),
  (4, 3, 1, 1, N'10:00', N'10:30', 4, 0, 1, 7, NULL, 150000, N'Done', DATEADD(MINUTE,600,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), DATEADD(MINUTE,630,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), NULL, NULL),
  (5, 3, 2, 2, N'10:30', N'11:30', 4, 0, 1, 1, NULL, 300000, N'Done', DATEADD(MINUTE,632,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), DATEADD(MINUTE,690,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), N'Da dầu, đã làm sạch sâu', NULL),
  (6, 3, 5, 3, N'11:30', N'12:30', 6, 0, 1, 4, NULL, 400000, N'Done', DATEADD(MINUTE,691,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), DATEADD(MINUTE,750,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), NULL, NULL),
  (7, 4, 4, 1, N'09:00', N'10:00', NULL, 0, 1, NULL, NULL, 450000, N'Waiting', NULL, NULL, NULL, NULL),
  (8, 5, 6, 1, N'15:00', N'16:30', NULL, 0, 2, NULL, NULL, 600000, N'Waiting', NULL, NULL, NULL, NULL),
  (9, 6, 2, 1, N'10:00', N'11:00', 5, 0, 1, 2, NULL, 300000, N'Done', DATEADD(MINUTE,600,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), DATEADD(MINUTE,660,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), N'Da khô cải thiện, đã đắp mặt nạ cấp ẩm', NULL),
  (10, 7, 5, 1, N'08:30', N'09:30', 8, 1, 1, 4, NULL, 400000, N'Done', DATEADD(MINUTE,510,CAST(DATEADD(DAY,0,@D) AS DATETIME2(0))), DATEADD(MINUTE,570,CAST(DATEADD(DAY,0,@D) AS DATETIME2(0))), N'Thư giãn tốt', NULL),
  (11, 8, 2, 1, N'10:00', N'11:00', 5, 0, 1, 1, 2, 0, N'Waiting', NULL, NULL, NULL, NULL),
  (12, 8, 1, 2, N'11:00', N'11:30', 5, 0, 1, 7, NULL, 150000, N'Waiting', NULL, NULL, NULL, NULL),
  (13, 9, 3, 1, N'14:00', N'15:30', NULL, 0, 2, NULL, NULL, 550000, N'Waiting', NULL, NULL, NULL, NULL),
  (14, 10, 5, 1, N'15:00', N'16:00', NULL, 0, 1, NULL, NULL, 400000, N'Waiting', NULL, NULL, NULL, NULL),
  (15, 10, 7, 2, N'16:00', N'16:45', NULL, 0, 1, NULL, NULL, 250000, N'Waiting', NULL, NULL, NULL, NULL),
  (16, 10, 2, 3, N'16:45', N'17:45', NULL, 0, 1, NULL, NULL, 300000, N'Waiting', NULL, NULL, NULL, NULL),
  (17, 11, 4, 1, N'09:00', N'10:00', NULL, 0, 1, NULL, NULL, 450000, N'Waiting', NULL, NULL, NULL, NULL),
  (18, 12, 2, 1, N'10:00', N'11:00', NULL, 0, 1, NULL, NULL, 300000, N'Waiting', NULL, NULL, NULL, NULL),
  (19, 12, 1, 2, N'11:00', N'11:30', NULL, 0, 1, NULL, NULL, 150000, N'Waiting', NULL, NULL, NULL, NULL),
  (20, 13, 9, 1, N'14:00', N'14:30', NULL, 0, 1, NULL, NULL, 200000, N'Waiting', NULL, NULL, NULL, NULL),
  (21, 14, 2, 1, N'09:30', N'10:30', NULL, 0, 1, NULL, 3, 0, N'Waiting', NULL, NULL, NULL, NULL),
  (22, 15, 5, 1, N'13:30', N'14:30', 7, 1, 1, NULL, 1, 0, N'Waiting', NULL, NULL, NULL, NULL),
  (23, 16, 3, 1, N'09:00', N'10:30', 4, 1, 2, NULL, NULL, 550000, N'Waiting', NULL, NULL, NULL, NULL);
SET IDENTITY_INSERT dbo.AppointmentService OFF;

SET IDENTITY_INSERT dbo.InvoiceService ON;
INSERT INTO dbo.InvoiceService (invoice_service_id, invoice_id, appointment_service_id, service_name, unit_price, is_package_session, discount_amount) VALUES
  (1, 1, 1, N'Gội đầu dưỡng sinh', 150000, 0, 0),
  (2, 1, 2, N'Chăm sóc da mặt cơ bản', 300000, 0, 0),
  (4, 2, 4, N'Gội đầu dưỡng sinh', 150000, 0, 0),
  (5, 2, 5, N'Chăm sóc da mặt cơ bản', 300000, 0, 0),
  (6, 2, 6, N'Massage body thư giãn', 400000, 0, 0),
  (7, 3, 7, N'Trị mụn chuẩn y khoa', 450000, 0, 0),
  (8, 4, 8, N'Massage đá nóng', 600000, 0, 0),
  (9, 5, 9, N'Chăm sóc da mặt cơ bản', 300000, 0, 0),
  (10, 6, 10, N'Massage body thư giãn', 400000, 0, 0),
  (11, 7, 11, N'Chăm sóc da mặt cơ bản', 0, 1, 0),
  (12, 7, 12, N'Gội đầu dưỡng sinh', 150000, 0, 0),
  (13, 8, 13, N'Chăm sóc da mặt chuyên sâu', 550000, 0, 0),
  (14, 9, 14, N'Massage body thư giãn', 400000, 0, 0),
  (15, 9, 15, N'Massage chân', 250000, 0, 0),
  (16, 9, 16, N'Chăm sóc da mặt cơ bản', 300000, 0, 0),
  (17, 10, 17, N'Trị mụn chuẩn y khoa', 450000, 0, 0),
  (18, 11, 18, N'Chăm sóc da mặt cơ bản', 300000, 0, 0),
  (19, 11, 19, N'Gội đầu dưỡng sinh', 150000, 0, 0),
  (20, 12, 20, N'Triệt lông vùng nách', 200000, 0, 0),
  (23, 13, 23, N'Chăm sóc da mặt chuyên sâu', 550000, 0, 0);
SET IDENTITY_INSERT dbo.InvoiceService OFF;

INSERT INTO dbo.InvoicePackage (invoice_id, treatment_package_id, package_name, unit_price) VALUES
  (14, 1, N'Gói massage body 10 buổi', 3500000),
  (15, 2, N'Gói chăm sóc da mặt 6 buổi', 1600000),
  (16, 2, N'Gói chăm sóc da mặt 6 buổi', 1600000),
  (17, 4, N'Gói gội đầu 10 buổi', 1200000);

SET IDENTITY_INSERT dbo.Payment ON;
INSERT INTO dbo.Payment (payment_id, invoice_id, payment_method, amount, payment_date, transaction_code, received_by_staff_id, status) VALUES
  (1, 1, N'Cash', 427500, DATEADD(MINUTE,635,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), NULL, 2, N'Success'),
  (2, 2, N'VNPay', 765000, DATEADD(MINUTE,1265,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), N'VNP0000002', NULL, N'Success'),
  (3, 4, N'VNPay', 510000, DATEADD(MINUTE,483,CAST(DATEADD(DAY,-5,@D) AS DATETIME2(0))), N'VNP0000004', NULL, N'Refunded'),
  (4, 5, N'BankTransfer', 270000, DATEADD(MINUTE,665,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), N'FT0000005', 3, N'Success'),
  (5, 6, N'Cash', 340000, DATEADD(MINUTE,575,CAST(DATEADD(DAY,0,@D) AS DATETIME2(0))), NULL, 2, N'Success'),
  (6, 8, N'VNPay', 495000, DATEADD(MINUTE,1204,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), N'VNP0000008', NULL, N'Success'),
  (7, 14, N'VNPay', 3150000, DATEADD(MINUTE,1140,CAST(DATEADD(DAY,-30,@D) AS DATETIME2(0))), N'VNP0000014', NULL, N'Success'),
  (8, 15, N'Cash', 1520000, DATEADD(MINUTE,600,CAST(DATEADD(DAY,-13,@D) AS DATETIME2(0))), NULL, 2, N'Success'),
  (9, 16, N'VNPay', 1520000, DATEADD(MINUTE,1200,CAST(DATEADD(DAY,-10,@D) AS DATETIME2(0))), N'VNP0000016', NULL, N'Success'),
  (10, 17, N'VNPay', 1140000, DATEADD(MINUTE,1205,CAST(DATEADD(DAY,-10,@D) AS DATETIME2(0))), N'VNP0000017', NULL, N'Success');
SET IDENTITY_INSERT dbo.Payment OFF;

SET IDENTITY_INSERT dbo.PaymentAttempt ON;
INSERT INTO dbo.PaymentAttempt (attempt_id, invoice_id, merchant_reference, amount, status, provider_transaction, created_at, expires_at, verified_at) VALUES
  (1, 2, N'BSSMS-00002-1', 765000, N'Success', N'VNP0000002', DATEADD(MINUTE,1265,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), DATEADD(MINUTE,15,DATEADD(MINUTE,1265,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0)))), DATEADD(MINUTE,1265,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0)))),
  (2, 4, N'BSSMS-00004-1', 510000, N'Success', N'VNP0000004', DATEADD(MINUTE,483,CAST(DATEADD(DAY,-5,@D) AS DATETIME2(0))), DATEADD(MINUTE,15,DATEADD(MINUTE,483,CAST(DATEADD(DAY,-5,@D) AS DATETIME2(0)))), DATEADD(MINUTE,483,CAST(DATEADD(DAY,-5,@D) AS DATETIME2(0)))),
  (3, 8, N'BSSMS-00008-1', 495000, N'Success', N'VNP0000008', DATEADD(MINUTE,1204,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), DATEADD(MINUTE,15,DATEADD(MINUTE,1204,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0)))), DATEADD(MINUTE,1204,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0)))),
  (4, 14, N'BSSMS-00014-1', 3150000, N'Success', N'VNP0000014', DATEADD(MINUTE,1140,CAST(DATEADD(DAY,-30,@D) AS DATETIME2(0))), DATEADD(MINUTE,15,DATEADD(MINUTE,1140,CAST(DATEADD(DAY,-30,@D) AS DATETIME2(0)))), DATEADD(MINUTE,1140,CAST(DATEADD(DAY,-30,@D) AS DATETIME2(0)))),
  (5, 16, N'BSSMS-00016-1', 1520000, N'Success', N'VNP0000016', DATEADD(MINUTE,1200,CAST(DATEADD(DAY,-10,@D) AS DATETIME2(0))), DATEADD(MINUTE,15,DATEADD(MINUTE,1200,CAST(DATEADD(DAY,-10,@D) AS DATETIME2(0)))), DATEADD(MINUTE,1200,CAST(DATEADD(DAY,-10,@D) AS DATETIME2(0)))),
  (6, 17, N'BSSMS-00017-1', 1140000, N'Success', N'VNP0000017', DATEADD(MINUTE,1205,CAST(DATEADD(DAY,-10,@D) AS DATETIME2(0))), DATEADD(MINUTE,15,DATEADD(MINUTE,1205,CAST(DATEADD(DAY,-10,@D) AS DATETIME2(0)))), DATEADD(MINUTE,1205,CAST(DATEADD(DAY,-10,@D) AS DATETIME2(0)))),
  (7, 12, N'BSSMS-00012-1', 200000, N'Failed', NULL, DATEADD(MINUTE,-50,@NOW), DATEADD(MINUTE,-35,@NOW), DATEADD(MINUTE,-48,@NOW));
SET IDENTITY_INSERT dbo.PaymentAttempt OFF;

SET IDENTITY_INSERT dbo.Refund ON;
INSERT INTO dbo.Refund (refund_id, payment_id, amount, reason, status, approved_by_staff_id, created_at, completed_at, provider_request_id, provider_response) VALUES
  (1, 3, 510000, N'Khách hủy trước giờ hẹn hơn 2 tiếng (BR-19)', N'Completed', 1, DATEADD(MINUTE,990,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), DATEADD(MINUTE,995,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), N'RF0000000001', N'00 - Hoàn tiền thành công');
SET IDENTITY_INSERT dbo.Refund OFF;

SET IDENTITY_INSERT dbo.AppointmentStatusHistory ON;
INSERT INTO dbo.AppointmentStatusHistory (history_id, appointment_id, old_status, new_status, changed_at, reason) VALUES
  (1, 1, NULL, N'Pending', DATEADD(MINUTE,1210,CAST(DATEADD(DAY,-5,@D) AS DATETIME2(0))), N'Khách đặt online'),
  (2, 1, N'Pending', N'Confirmed', DATEADD(MINUTE,520,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), N'Lễ tân xác nhận'),
  (3, 1, N'Confirmed', N'Checked-in', DATEADD(MINUTE,535,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), NULL),
  (4, 1, N'Checked-in', N'In-progress', DATEADD(MINUTE,540,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), N'Bắt đầu dịch vụ đầu tiên'),
  (5, 1, N'In-progress', N'Completed', DATEADD(MINUTE,630,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), N'Hoàn thành tất cả dịch vụ'),
  (6, 2, NULL, N'Confirmed', DATEADD(MINUTE,600,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), N'Lễ tân tạo lịch'),
  (7, 2, N'Confirmed', N'Checked-in', DATEADD(MINUTE,835,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), NULL),
  (8, 2, N'Checked-in', N'In-progress', DATEADD(MINUTE,840,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), N'Bắt đầu dịch vụ đầu tiên'),
  (9, 2, N'In-progress', N'Completed', DATEADD(MINUTE,900,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), N'Hoàn thành tất cả dịch vụ'),
  (10, 3, NULL, N'Pending', DATEADD(MINUTE,1260,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), N'Khách đặt online'),
  (11, 3, N'Pending', N'Confirmed', DATEADD(MINUTE,1265,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), N'Thanh toán VNPay thành công'),
  (12, 3, N'Confirmed', N'Checked-in', DATEADD(MINUTE,598,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), NULL),
  (13, 3, N'Checked-in', N'In-progress', DATEADD(MINUTE,600,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), N'Bắt đầu dịch vụ đầu tiên'),
  (14, 3, N'In-progress', N'Completed', DATEADD(MINUTE,750,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), N'Hoàn thành tất cả dịch vụ'),
  (15, 4, NULL, N'Pending', DATEADD(MINUTE,1140,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), N'Khách đặt online'),
  (16, 4, N'Pending', N'Confirmed', DATEADD(MINUTE,510,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), N'Lễ tân xác nhận'),
  (17, 4, N'Confirmed', N'No-show', DATEADD(MINUTE,556,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), N'Khách trễ quá 15 phút (BR-10)'),
  (18, 5, NULL, N'Pending', DATEADD(MINUTE,480,CAST(DATEADD(DAY,-5,@D) AS DATETIME2(0))), N'Khách đặt online'),
  (19, 5, N'Pending', N'Confirmed', DATEADD(MINUTE,483,CAST(DATEADD(DAY,-5,@D) AS DATETIME2(0))), N'Thanh toán VNPay thành công'),
  (20, 5, N'Confirmed', N'Cancelled', DATEADD(MINUTE,960,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), N'Khách bận công tác'),
  (21, 6, NULL, N'Confirmed', DATEADD(MINUTE,900,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), N'Lễ tân tạo lịch'),
  (22, 6, N'Confirmed', N'Checked-in', DATEADD(MINUTE,595,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), NULL),
  (23, 6, N'Checked-in', N'In-progress', DATEADD(MINUTE,600,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), N'Bắt đầu dịch vụ đầu tiên'),
  (24, 6, N'In-progress', N'Completed', DATEADD(MINUTE,660,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), N'Hoàn thành tất cả dịch vụ'),
  (25, 7, NULL, N'Confirmed', DATEADD(MINUTE,540,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), N'Lễ tân tạo lịch'),
  (26, 7, N'Confirmed', N'Checked-in', DATEADD(MINUTE,505,CAST(DATEADD(DAY,0,@D) AS DATETIME2(0))), NULL),
  (27, 7, N'Checked-in', N'In-progress', DATEADD(MINUTE,510,CAST(DATEADD(DAY,0,@D) AS DATETIME2(0))), N'Bắt đầu dịch vụ đầu tiên'),
  (28, 7, N'In-progress', N'Completed', DATEADD(MINUTE,570,CAST(DATEADD(DAY,0,@D) AS DATETIME2(0))), N'Hoàn thành tất cả dịch vụ'),
  (29, 8, NULL, N'Pending', DATEADD(MINUTE,720,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), N'Khách đặt online'),
  (30, 8, N'Pending', N'Confirmed', DATEADD(MINUTE,780,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), N'Lễ tân xác nhận'),
  (31, 8, N'Confirmed', N'Checked-in', DATEADD(MINUTE,595,CAST(DATEADD(DAY,0,@D) AS DATETIME2(0))), NULL),
  (32, 9, NULL, N'Pending', DATEADD(MINUTE,1200,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), N'Khách đặt online'),
  (33, 9, N'Pending', N'Confirmed', DATEADD(MINUTE,1204,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), N'Thanh toán VNPay thành công'),
  (34, 10, NULL, N'Confirmed', DATEADD(MINUTE,900,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), N'Lễ tân tạo lịch'),
  (35, 11, NULL, N'Pending', DATEADD(MINUTE,1140,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), N'Khách đặt online'),
  (36, 11, N'Pending', N'Confirmed', DATEADD(MINUTE,1200,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), N'Lễ tân xác nhận'),
  (37, 12, NULL, N'Pending', DATEADD(MINUTE,-60,@NOW), N'Khách đặt online'),
  (38, 13, NULL, N'Pending', DATEADD(MINUTE,-60,@NOW), N'Khách đặt online'),
  (39, 14, NULL, N'Pending', DATEADD(MINUTE,1260,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), N'Khách đặt online'),
  (40, 14, N'Pending', N'Confirmed', DATEADD(MINUTE,520,CAST(DATEADD(DAY,0,@D) AS DATETIME2(0))), N'Lễ tân xác nhận'),
  (41, 15, NULL, N'Pending', DATEADD(MINUTE,600,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), N'Khách đặt online'),
  (42, 15, N'Pending', N'Confirmed', DATEADD(MINUTE,630,CAST(DATEADD(DAY,-4,@D) AS DATETIME2(0))), N'Lễ tân xác nhận'),
  (43, 16, NULL, N'Confirmed', DATEADD(MINUTE,660,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0))), N'Lễ tân tạo lịch');
SET IDENTITY_INSERT dbo.AppointmentStatusHistory OFF;

SET IDENTITY_INSERT dbo.TreatmentPhoto ON;
INSERT INTO dbo.TreatmentPhoto (photo_id, appointment_service_id, photo_type, storage_key, created_at) VALUES
  (1, 2, N'Before', N'treatments/a1-l2-before.jpg', DATEADD(MINUTE,572,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0)))),
  (2, 2, N'After', N'treatments/a1-l2-after.jpg', DATEADD(MINUTE,629,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))));
SET IDENTITY_INSERT dbo.TreatmentPhoto OFF;

INSERT INTO dbo.TechnicianDailyTour (staff_id, work_date, start_offset_tours, counted_tours, actual_tours, requested_tours, last_assigned_at) VALUES
  (4, DATEADD(DAY,-3,@D), 0, 2, 2, 0, DATEADD(MINUTE,535,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0)))),
  (8, DATEADD(DAY,-3,@D), 0, 0, 1, 1, NULL),
  (4, DATEADD(DAY,-2,@D), 0, 2, 2, 0, DATEADD(MINUTE,598,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0)))),
  (6, DATEADD(DAY,-2,@D), 0, 1, 1, 0, DATEADD(MINUTE,598,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0)))),
  (5, DATEADD(DAY,-1,@D), 0, 1, 1, 0, DATEADD(MINUTE,595,CAST(DATEADD(DAY,-1,@D) AS DATETIME2(0)))),
  (4, DATEADD(DAY,0,@D), 0, 0, 0, 0, NULL),
  (5, DATEADD(DAY,0,@D), 0, 2, 0, 0, DATEADD(MINUTE,595,CAST(DATEADD(DAY,0,@D) AS DATETIME2(0)))),
  (6, DATEADD(DAY,0,@D), 0, 0, 0, 0, NULL),
  (8, DATEADD(DAY,0,@D), 0, 0, 1, 1, NULL);

SET IDENTITY_INSERT dbo.ServiceFeedback ON;
INSERT INTO dbo.ServiceFeedback (feedback_id, customer_id, appointment_service_id, rating, comment, created_at, updated_at, is_hidden, moderation_reason, moderated_by_staff_id) VALUES
  (1, 1, 2, 5, N'Da mềm và sạch hẳn, nhân viên nhẹ nhàng.', DATEADD(MINUTE,1200,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), NULL, 0, NULL, NULL),
  (2, 3, 6, 5, N'Massage rất đã, sẽ quay lại.', DATEADD(MINUTE,1080,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), DATEADD(MINUTE,1090,CAST(DATEADD(DAY,-2,@D) AS DATETIME2(0))), 0, NULL, NULL),
  (3, 2, 3, 1, N'Nội dung quảng cáo không liên quan ...', DATEADD(MINUTE,1260,CAST(DATEADD(DAY,-3,@D) AS DATETIME2(0))), NULL, 1, N'Nội dung spam', 1);
SET IDENTITY_INSERT dbo.ServiceFeedback OFF;

COMMIT TRANSACTION;
GO

