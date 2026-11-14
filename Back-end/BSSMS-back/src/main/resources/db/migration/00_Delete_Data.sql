USE [BeautySalonDB];
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DELETE FROM dbo.ServiceFeedback;
DELETE FROM dbo.TreatmentPhoto;
DELETE FROM dbo.Refund;
DELETE FROM dbo.PaymentAttempt;
DELETE FROM dbo.Payment;
DELETE FROM dbo.InvoiceService;
DELETE FROM dbo.InvoicePackage;
DELETE FROM dbo.AppointmentStatusHistory;
DELETE FROM dbo.AppointmentService;
DELETE FROM dbo.CustomerPackage;
DELETE FROM dbo.Invoice;
DELETE FROM dbo.Appointment;
DELETE FROM dbo.TechnicianDailyTour;
DELETE FROM dbo.StaffLeave;
DELETE FROM dbo.StaffShift;
DELETE FROM dbo.StaffService;
DELETE FROM dbo.Bed;
DELETE FROM dbo.Room;
DELETE FROM dbo.TreatmentPackageService;
DELETE FROM dbo.TreatmentPackage;
DELETE FROM dbo.Voucher;
DELETE FROM dbo.Service;
DELETE FROM dbo.Customer;
DELETE FROM dbo.Staff;
DELETE FROM dbo.MembershipTier;

DECLARE @t SYSNAME, @sql NVARCHAR(400);
DECLARE c CURSOR LOCAL FAST_FORWARD FOR
    SELECT t.name FROM sys.tables t
    WHERE t.schema_id = SCHEMA_ID(N'dbo')
      AND t.name IN (N'MembershipTier', N'Staff', N'Customer', N'Service', N'TreatmentPackage', N'Room', N'Bed',
                     N'StaffShift', N'StaffLeave', N'Voucher', N'Appointment', N'AppointmentService',
                     N'AppointmentStatusHistory', N'CustomerPackage', N'Invoice', N'InvoiceService',
                     N'Payment', N'PaymentAttempt', N'Refund', N'TreatmentPhoto', N'ServiceFeedback')
      AND EXISTS (SELECT 1 FROM sys.identity_columns ic WHERE ic.object_id = t.object_id AND ic.last_value IS NOT NULL);
OPEN c;
FETCH NEXT FROM c INTO @t;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql = N'DBCC CHECKIDENT (''dbo.' + @t + N''', RESEED, 0) WITH NO_INFOMSGS;';
    EXEC sp_executesql @sql;
    FETCH NEXT FROM c INTO @t;
END
CLOSE c; DEALLOCATE c;

COMMIT TRANSACTION;
PRINT N'Đã xóa toàn bộ dữ liệu BSSMS.';
GO
