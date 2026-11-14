USE [BeautySalonDB];
GO

ALTER TABLE dbo.MembershipTier           ADD CONSTRAINT PK_MembershipTier           PRIMARY KEY (membership_tier_id);
ALTER TABLE dbo.Staff                    ADD CONSTRAINT PK_Staff                    PRIMARY KEY (staff_id);
ALTER TABLE dbo.Customer                 ADD CONSTRAINT PK_Customer                 PRIMARY KEY (customer_id);
ALTER TABLE dbo.Service                  ADD CONSTRAINT PK_Service                  PRIMARY KEY (service_id);
ALTER TABLE dbo.TreatmentPackage         ADD CONSTRAINT PK_TreatmentPackage         PRIMARY KEY (treatment_package_id);
ALTER TABLE dbo.TreatmentPackageService  ADD CONSTRAINT PK_TreatmentPackageService  PRIMARY KEY (treatment_package_id, service_id);
ALTER TABLE dbo.Room                     ADD CONSTRAINT PK_Room                     PRIMARY KEY (room_id);
ALTER TABLE dbo.Bed                      ADD CONSTRAINT PK_Bed                      PRIMARY KEY (bed_id);
ALTER TABLE dbo.StaffService             ADD CONSTRAINT PK_StaffService             PRIMARY KEY (staff_id, service_id);
ALTER TABLE dbo.StaffShift               ADD CONSTRAINT PK_StaffShift               PRIMARY KEY (staff_shift_id);
ALTER TABLE dbo.StaffLeave               ADD CONSTRAINT PK_StaffLeave               PRIMARY KEY (leave_id);
ALTER TABLE dbo.TechnicianDailyTour      ADD CONSTRAINT PK_TechnicianDailyTour      PRIMARY KEY (staff_id, work_date);
ALTER TABLE dbo.Voucher                  ADD CONSTRAINT PK_Voucher                  PRIMARY KEY (voucher_id);
ALTER TABLE dbo.Appointment              ADD CONSTRAINT PK_Appointment              PRIMARY KEY (appointment_id);
ALTER TABLE dbo.CustomerPackage          ADD CONSTRAINT PK_CustomerPackage          PRIMARY KEY (customer_package_id);
ALTER TABLE dbo.AppointmentService       ADD CONSTRAINT PK_AppointmentService       PRIMARY KEY (appointment_service_id);
ALTER TABLE dbo.AppointmentStatusHistory ADD CONSTRAINT PK_AppointmentStatusHistory PRIMARY KEY (history_id);
ALTER TABLE dbo.TreatmentPhoto           ADD CONSTRAINT PK_TreatmentPhoto           PRIMARY KEY (photo_id);
ALTER TABLE dbo.Invoice                  ADD CONSTRAINT PK_Invoice                  PRIMARY KEY (invoice_id);
ALTER TABLE dbo.InvoiceService           ADD CONSTRAINT PK_InvoiceService           PRIMARY KEY (invoice_service_id);
ALTER TABLE dbo.InvoicePackage           ADD CONSTRAINT PK_InvoicePackage           PRIMARY KEY (invoice_id, treatment_package_id);
ALTER TABLE dbo.Payment                  ADD CONSTRAINT PK_Payment                  PRIMARY KEY (payment_id);
ALTER TABLE dbo.PaymentAttempt           ADD CONSTRAINT PK_PaymentAttempt           PRIMARY KEY (attempt_id);
ALTER TABLE dbo.Refund                   ADD CONSTRAINT PK_Refund                   PRIMARY KEY (refund_id);
ALTER TABLE dbo.ServiceFeedback          ADD CONSTRAINT PK_ServiceFeedback          PRIMARY KEY (feedback_id);
GO

ALTER TABLE dbo.MembershipTier     ADD CONSTRAINT UQ_MembershipTier_Name      UNIQUE (tier_name);
ALTER TABLE dbo.MembershipTier     ADD CONSTRAINT UQ_MembershipTier_MinSpend  UNIQUE (min_spending);
ALTER TABLE dbo.Service            ADD CONSTRAINT UQ_Service_Name             UNIQUE (service_name);
ALTER TABLE dbo.TreatmentPackage   ADD CONSTRAINT UQ_TreatmentPackage_Name    UNIQUE (package_name);
ALTER TABLE dbo.Room               ADD CONSTRAINT UQ_Room_Name                UNIQUE (room_name);
ALTER TABLE dbo.Bed                ADD CONSTRAINT UQ_Bed_Room_Number          UNIQUE (room_id, bed_number);
ALTER TABLE dbo.StaffShift         ADD CONSTRAINT UQ_StaffShift_StaffDate     UNIQUE (staff_id, shift_date);
ALTER TABLE dbo.Voucher            ADD CONSTRAINT UQ_Voucher_Code             UNIQUE (voucher_code);
ALTER TABLE dbo.Customer           ADD CONSTRAINT UQ_Customer_Phone           UNIQUE (phone);
ALTER TABLE dbo.CustomerPackage    ADD CONSTRAINT UQ_CustomerPackage_Cust     UNIQUE (customer_package_id, customer_id);
ALTER TABLE dbo.AppointmentService ADD CONSTRAINT UQ_AppointmentService_Line  UNIQUE (appointment_id, line_no);
ALTER TABLE dbo.PaymentAttempt     ADD CONSTRAINT UQ_PaymentAttempt_MerchRef  UNIQUE (merchant_reference);
ALTER TABLE dbo.ServiceFeedback    ADD CONSTRAINT UQ_ServiceFeedback_Line     UNIQUE (customer_id, appointment_service_id);
ALTER TABLE dbo.Appointment        ADD CONSTRAINT UQ_Appointment_Customer     UNIQUE (appointment_id, customer_id);
GO
CREATE UNIQUE INDEX UX_Staff_Email          ON dbo.Staff(email)            WHERE email IS NOT NULL;
CREATE UNIQUE INDEX UX_Staff_Phone          ON dbo.Staff(phone)            WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX UX_Staff_Username       ON dbo.Staff(username)         WHERE username IS NOT NULL;
CREATE UNIQUE INDEX UX_Customer_Email       ON dbo.Customer(email)         WHERE email IS NOT NULL;
CREATE UNIQUE INDEX UX_Customer_Username    ON dbo.Customer(username)      WHERE username IS NOT NULL;
CREATE UNIQUE INDEX UX_Payment_TxnCode      ON dbo.Payment(transaction_code) WHERE transaction_code IS NOT NULL;
GO

ALTER TABLE dbo.Customer        ADD CONSTRAINT FK_Customer_MembershipTier  FOREIGN KEY (membership_tier_id)   REFERENCES dbo.MembershipTier(membership_tier_id);
ALTER TABLE dbo.TreatmentPackageService ADD CONSTRAINT FK_TPS_Package      FOREIGN KEY (treatment_package_id) REFERENCES dbo.TreatmentPackage(treatment_package_id) ON DELETE CASCADE;
ALTER TABLE dbo.TreatmentPackageService ADD CONSTRAINT FK_TPS_Service      FOREIGN KEY (service_id)           REFERENCES dbo.Service(service_id);
ALTER TABLE dbo.Bed             ADD CONSTRAINT FK_Bed_Room                 FOREIGN KEY (room_id)              REFERENCES dbo.Room(room_id);
ALTER TABLE dbo.StaffService    ADD CONSTRAINT FK_StaffService_Staff       FOREIGN KEY (staff_id)             REFERENCES dbo.Staff(staff_id) ON DELETE CASCADE;
ALTER TABLE dbo.StaffService    ADD CONSTRAINT FK_StaffService_Service     FOREIGN KEY (service_id)           REFERENCES dbo.Service(service_id) ON DELETE CASCADE;
ALTER TABLE dbo.StaffShift      ADD CONSTRAINT FK_StaffShift_Staff         FOREIGN KEY (staff_id)             REFERENCES dbo.Staff(staff_id);
ALTER TABLE dbo.StaffLeave      ADD CONSTRAINT FK_StaffLeave_Staff         FOREIGN KEY (staff_id)             REFERENCES dbo.Staff(staff_id);
ALTER TABLE dbo.StaffLeave      ADD CONSTRAINT FK_StaffLeave_ApprovedBy    FOREIGN KEY (approved_by_staff_id) REFERENCES dbo.Staff(staff_id);
ALTER TABLE dbo.TechnicianDailyTour ADD CONSTRAINT FK_TechnicianDailyTour_Staff FOREIGN KEY (staff_id)        REFERENCES dbo.Staff(staff_id);
ALTER TABLE dbo.Voucher         ADD CONSTRAINT FK_Voucher_CreatedBy        FOREIGN KEY (created_by_staff_id)  REFERENCES dbo.Staff(staff_id);
ALTER TABLE dbo.Appointment     ADD CONSTRAINT FK_Appointment_Customer     FOREIGN KEY (customer_id)          REFERENCES dbo.Customer(customer_id);
ALTER TABLE dbo.Appointment     ADD CONSTRAINT FK_Appointment_CreatedStaff FOREIGN KEY (created_by_staff_id)  REFERENCES dbo.Staff(staff_id);
ALTER TABLE dbo.Invoice         ADD CONSTRAINT FK_Invoice_Customer         FOREIGN KEY (customer_id)          REFERENCES dbo.Customer(customer_id);
ALTER TABLE dbo.Invoice         ADD CONSTRAINT FK_Invoice_Appointment      FOREIGN KEY (appointment_id, customer_id) REFERENCES dbo.Appointment(appointment_id, customer_id);
ALTER TABLE dbo.Invoice         ADD CONSTRAINT FK_Invoice_Voucher          FOREIGN KEY (voucher_id)           REFERENCES dbo.Voucher(voucher_id);
ALTER TABLE dbo.Invoice         ADD CONSTRAINT FK_Invoice_CreatedBy        FOREIGN KEY (created_by_staff_id)  REFERENCES dbo.Staff(staff_id);
ALTER TABLE dbo.CustomerPackage ADD CONSTRAINT FK_CustomerPackage_Customer FOREIGN KEY (customer_id)          REFERENCES dbo.Customer(customer_id);
ALTER TABLE dbo.CustomerPackage ADD CONSTRAINT FK_CustomerPackage_Package  FOREIGN KEY (treatment_package_id) REFERENCES dbo.TreatmentPackage(treatment_package_id);
ALTER TABLE dbo.CustomerPackage ADD CONSTRAINT FK_CustomerPackage_Invoice  FOREIGN KEY (sold_invoice_id)      REFERENCES dbo.Invoice(invoice_id);
ALTER TABLE dbo.CustomerPackage ADD CONSTRAINT FK_CustomerPackage_SoldBy   FOREIGN KEY (sold_by_staff_id)     REFERENCES dbo.Staff(staff_id);
ALTER TABLE dbo.AppointmentService ADD CONSTRAINT FK_AS_Appointment        FOREIGN KEY (appointment_id)       REFERENCES dbo.Appointment(appointment_id) ON DELETE CASCADE;
ALTER TABLE dbo.AppointmentService ADD CONSTRAINT FK_AS_Service            FOREIGN KEY (service_id)           REFERENCES dbo.Service(service_id);
ALTER TABLE dbo.AppointmentService ADD CONSTRAINT FK_AS_Bed                FOREIGN KEY (bed_id)               REFERENCES dbo.Bed(bed_id);
ALTER TABLE dbo.AppointmentService ADD CONSTRAINT FK_AS_Technician         FOREIGN KEY (technician_id)        REFERENCES dbo.Staff(staff_id);
ALTER TABLE dbo.AppointmentService ADD CONSTRAINT FK_AS_CustomerPackage    FOREIGN KEY (customer_package_id)  REFERENCES dbo.CustomerPackage(customer_package_id);
ALTER TABLE dbo.AppointmentStatusHistory ADD CONSTRAINT FK_ASH_Appointment FOREIGN KEY (appointment_id)       REFERENCES dbo.Appointment(appointment_id) ON DELETE CASCADE;
ALTER TABLE dbo.TreatmentPhoto  ADD CONSTRAINT FK_TreatmentPhoto_Line      FOREIGN KEY (appointment_service_id) REFERENCES dbo.AppointmentService(appointment_service_id) ON DELETE CASCADE;
ALTER TABLE dbo.InvoiceService  ADD CONSTRAINT FK_InvoiceService_Invoice   FOREIGN KEY (invoice_id)           REFERENCES dbo.Invoice(invoice_id) ON DELETE CASCADE;
ALTER TABLE dbo.InvoiceService  ADD CONSTRAINT FK_InvoiceService_Line      FOREIGN KEY (appointment_service_id) REFERENCES dbo.AppointmentService(appointment_service_id);
ALTER TABLE dbo.InvoicePackage  ADD CONSTRAINT FK_InvoicePackage_Invoice   FOREIGN KEY (invoice_id)           REFERENCES dbo.Invoice(invoice_id) ON DELETE CASCADE;
ALTER TABLE dbo.InvoicePackage  ADD CONSTRAINT FK_InvoicePackage_Package   FOREIGN KEY (treatment_package_id) REFERENCES dbo.TreatmentPackage(treatment_package_id);
ALTER TABLE dbo.Payment         ADD CONSTRAINT FK_Payment_Invoice          FOREIGN KEY (invoice_id)           REFERENCES dbo.Invoice(invoice_id);
ALTER TABLE dbo.Payment         ADD CONSTRAINT FK_Payment_ReceivedBy       FOREIGN KEY (received_by_staff_id) REFERENCES dbo.Staff(staff_id);
ALTER TABLE dbo.PaymentAttempt  ADD CONSTRAINT FK_PaymentAttempt_Invoice   FOREIGN KEY (invoice_id)           REFERENCES dbo.Invoice(invoice_id);
ALTER TABLE dbo.Refund          ADD CONSTRAINT FK_Refund_Payment           FOREIGN KEY (payment_id)           REFERENCES dbo.Payment(payment_id);
ALTER TABLE dbo.Refund          ADD CONSTRAINT FK_Refund_ApprovedBy        FOREIGN KEY (approved_by_staff_id) REFERENCES dbo.Staff(staff_id);
ALTER TABLE dbo.ServiceFeedback ADD CONSTRAINT FK_ServiceFeedback_Customer FOREIGN KEY (customer_id)          REFERENCES dbo.Customer(customer_id);
ALTER TABLE dbo.ServiceFeedback ADD CONSTRAINT FK_ServiceFeedback_Line     FOREIGN KEY (appointment_service_id) REFERENCES dbo.AppointmentService(appointment_service_id);
ALTER TABLE dbo.ServiceFeedback ADD CONSTRAINT FK_ServiceFeedback_ModBy    FOREIGN KEY (moderated_by_staff_id) REFERENCES dbo.Staff(staff_id);
GO

ALTER TABLE dbo.MembershipTier ADD CONSTRAINT CK_MembershipTier_Values CHECK (min_spending >= 0 AND discount_percent BETWEEN 0 AND 100);

ALTER TABLE dbo.Staff ADD CONSTRAINT CK_Staff_Role   CHECK (role IN (N'Manager', N'Receptionist', N'Technician'));
ALTER TABLE dbo.Staff ADD CONSTRAINT CK_Staff_Status CHECK (status IN (N'Active', N'Inactive', N'Locked'));
ALTER TABLE dbo.Staff ADD CONSTRAINT CK_Staff_Login  CHECK ((username IS NULL AND password IS NULL) OR (username IS NOT NULL AND password IS NOT NULL AND LEN(LTRIM(RTRIM(username))) > 0));
ALTER TABLE dbo.Staff ADD CONSTRAINT CK_Staff_Otp    CHECK (otp_attempts >= 0 AND (otp_purpose IS NULL OR otp_purpose IN (N'Registration', N'PasswordReset', N'EmailChange')));
ALTER TABLE dbo.Customer ADD CONSTRAINT CK_Customer_Gender   CHECK (gender IS NULL OR gender IN (N'Male', N'Female', N'Other'));
ALTER TABLE dbo.Customer ADD CONSTRAINT CK_Customer_Status   CHECK (status IN (N'Pending', N'Active', N'Inactive', N'Locked'));
ALTER TABLE dbo.Customer ADD CONSTRAINT CK_Customer_Spending CHECK (lifetime_spending >= 0);
ALTER TABLE dbo.Customer ADD CONSTRAINT CK_Customer_Login    CHECK ((username IS NULL AND password IS NULL) OR (username IS NOT NULL AND password IS NOT NULL AND LEN(LTRIM(RTRIM(username))) > 0));
ALTER TABLE dbo.Customer ADD CONSTRAINT CK_Customer_Otp      CHECK (otp_attempts >= 0 AND (otp_purpose IS NULL OR otp_purpose IN (N'Registration', N'PasswordReset', N'EmailChange')));

ALTER TABLE dbo.Service ADD CONSTRAINT CK_Service_RoomType CHECK (required_room_type IN (N'Facial', N'Massage', N'HairWash', N'Body'));
ALTER TABLE dbo.Service ADD CONSTRAINT CK_Service_Values   CHECK (price >= 0 AND duration > 0 AND duration % 15 = 0 AND tour_count > 0);
ALTER TABLE dbo.Service ADD CONSTRAINT CK_Service_Status   CHECK (status IN (N'Active', N'Inactive'));
ALTER TABLE dbo.TreatmentPackage ADD CONSTRAINT CK_TreatmentPackage_Values CHECK (price >= 0 AND number_of_sessions > 0 AND validity_days > 0);
ALTER TABLE dbo.TreatmentPackage ADD CONSTRAINT CK_TreatmentPackage_Status CHECK (status IN (N'Active', N'Inactive'));
ALTER TABLE dbo.Room ADD CONSTRAINT CK_Room_Type   CHECK (room_type IN (N'Facial', N'Massage', N'HairWash', N'Body'));
ALTER TABLE dbo.Room ADD CONSTRAINT CK_Room_Status CHECK (status IN (N'Active', N'Maintenance'));
ALTER TABLE dbo.Bed  ADD CONSTRAINT CK_Bed_Status    CHECK (status IN (N'Active', N'Maintenance'));
ALTER TABLE dbo.Bed  ADD CONSTRAINT CK_Bed_UseState  CHECK (use_state IN (N'Free', N'InUse'));
ALTER TABLE dbo.Bed  ADD CONSTRAINT CK_Bed_MaintFree CHECK (status = N'Active' OR use_state = N'Free');

ALTER TABLE dbo.StaffShift ADD CONSTRAINT CK_StaffShift_Type CHECK (
      (shift_type = N'Morning'   AND start_time = '08:30' AND end_time = '13:30')
   OR (shift_type = N'Afternoon' AND start_time = '13:30' AND end_time = '18:30')
   OR (shift_type = N'FullDay'   AND start_time = '08:30' AND end_time = '18:30'));
ALTER TABLE dbo.StaffLeave ADD CONSTRAINT CK_StaffLeave_Dates    CHECK (end_date >= start_date);
ALTER TABLE dbo.StaffLeave ADD CONSTRAINT CK_StaffLeave_Status   CHECK (status IN (N'Pending', N'Approved', N'Rejected', N'Cancelled'));
ALTER TABLE dbo.StaffLeave ADD CONSTRAINT CK_StaffLeave_Decision CHECK (status NOT IN (N'Approved', N'Rejected') OR (approved_by_staff_id IS NOT NULL AND decided_at IS NOT NULL));
ALTER TABLE dbo.TechnicianDailyTour ADD CONSTRAINT CK_TechnicianDailyTour_Values CHECK (
      start_offset_tours >= 0 AND counted_tours >= start_offset_tours AND actual_tours >= 0 AND requested_tours >= 0);

ALTER TABLE dbo.Voucher ADD CONSTRAINT CK_Voucher_Type   CHECK (discount_type IN (N'Percent', N'Amount'));
ALTER TABLE dbo.Voucher ADD CONSTRAINT CK_Voucher_Value  CHECK (discount_value > 0 AND (discount_type = N'Amount' OR discount_value <= 100));
ALTER TABLE dbo.Voucher ADD CONSTRAINT CK_Voucher_Amount CHECK (min_order_amount >= 0 AND (max_discount IS NULL OR max_discount > 0));
ALTER TABLE dbo.Voucher ADD CONSTRAINT CK_Voucher_Uses   CHECK (max_uses > 0 AND used_count BETWEEN 0 AND max_uses);
ALTER TABLE dbo.Voucher ADD CONSTRAINT CK_Voucher_Dates  CHECK (end_date > start_date);
ALTER TABLE dbo.Voucher ADD CONSTRAINT CK_Voucher_Status CHECK (status IN (N'Active', N'Inactive'));

ALTER TABLE dbo.Appointment ADD CONSTRAINT CK_Appointment_Status  CHECK (status IN (N'Pending', N'Confirmed', N'Checked-in', N'In-progress', N'Completed', N'Cancelled', N'No-show'));
ALTER TABLE dbo.Appointment ADD CONSTRAINT CK_Appointment_Payment CHECK (payment_choice IN (N'Online', N'Counter'));
ALTER TABLE dbo.Appointment ADD CONSTRAINT CK_Appointment_Time    CHECK (start_time >= '08:30' AND end_time <= '18:30' AND end_time > start_time);
ALTER TABLE dbo.Appointment ADD CONSTRAINT CK_Appointment_Cancel  CHECK (status <> N'Cancelled' OR cancelled_at IS NOT NULL);
ALTER TABLE dbo.Appointment ADD CONSTRAINT CK_Appointment_CheckIn CHECK (status NOT IN (N'Checked-in', N'In-progress', N'Completed') OR checked_in_at IS NOT NULL);
ALTER TABLE dbo.AppointmentService ADD CONSTRAINT CK_AS_LineNo  CHECK (line_no BETWEEN 1 AND 4);
ALTER TABLE dbo.AppointmentService ADD CONSTRAINT CK_AS_Time    CHECK (start_time >= '08:30' AND end_time <= '18:30' AND end_time > start_time);
ALTER TABLE dbo.AppointmentService ADD CONSTRAINT CK_AS_Status  CHECK (status IN (N'Waiting', N'InProgress', N'Done'));
ALTER TABLE dbo.AppointmentService ADD CONSTRAINT CK_AS_Values  CHECK (tour_count > 0 AND unit_price >= 0);
ALTER TABLE dbo.AppointmentService ADD CONSTRAINT CK_AS_Package CHECK (customer_package_id IS NULL OR unit_price = 0);
ALTER TABLE dbo.AppointmentService ADD CONSTRAINT CK_AS_Progress CHECK (
      (status = N'Waiting'    AND started_at IS NULL)
   OR (status = N'InProgress' AND started_at IS NOT NULL AND done_at IS NULL AND technician_id IS NOT NULL)
   OR (status = N'Done'       AND started_at IS NOT NULL AND done_at IS NOT NULL AND technician_id IS NOT NULL));
ALTER TABLE dbo.AppointmentService ADD CONSTRAINT CK_AS_Requested CHECK (is_requested_technician = 0 OR technician_id IS NOT NULL);
ALTER TABLE dbo.CustomerPackage ADD CONSTRAINT CK_CustomerPackage_Sessions CHECK (total_sessions > 0 AND remaining_sessions BETWEEN 0 AND total_sessions);
ALTER TABLE dbo.CustomerPackage ADD CONSTRAINT CK_CustomerPackage_Status   CHECK (status IN (N'Active', N'Completed', N'Expired', N'Cancelled'));
ALTER TABLE dbo.CustomerPackage ADD CONSTRAINT CK_CustomerPackage_Done     CHECK (status <> N'Completed' OR remaining_sessions = 0);
ALTER TABLE dbo.CustomerPackage ADD CONSTRAINT CK_CustomerPackage_Price    CHECK (purchase_price >= 0);
ALTER TABLE dbo.CustomerPackage ADD CONSTRAINT CK_CustomerPackage_Expiry   CHECK (expiry_date > CAST(purchase_date AS DATE));
ALTER TABLE dbo.AppointmentStatusHistory ADD CONSTRAINT CK_ASH_Status CHECK (
      new_status IN (N'Pending', N'Confirmed', N'Checked-in', N'In-progress', N'Completed', N'Cancelled', N'No-show')
  AND (old_status IS NULL OR old_status IN (N'Pending', N'Confirmed', N'Checked-in', N'In-progress', N'Completed', N'Cancelled', N'No-show')));
ALTER TABLE dbo.TreatmentPhoto ADD CONSTRAINT CK_TreatmentPhoto_Type CHECK (photo_type IN (N'Before', N'After'));

ALTER TABLE dbo.Invoice ADD CONSTRAINT CK_Invoice_Type     CHECK ((invoice_type = N'Appointment' AND appointment_id IS NOT NULL) OR (invoice_type = N'Package' AND appointment_id IS NULL));
ALTER TABLE dbo.Invoice ADD CONSTRAINT CK_Invoice_Status   CHECK (status IN (N'Unpaid', N'Paid', N'Cancelled', N'Refunded'));
ALTER TABLE dbo.Invoice ADD CONSTRAINT CK_Invoice_Amounts  CHECK (
      subtotal >= 0 AND tier_discount >= 0 AND voucher_discount >= 0
  AND total_discount = tier_discount + voucher_discount
  AND total_discount <= subtotal * 0.5
  AND total_amount = subtotal - total_discount);
ALTER TABLE dbo.Invoice ADD CONSTRAINT CK_Invoice_Paid     CHECK (status NOT IN (N'Paid', N'Refunded') OR paid_at IS NOT NULL);
ALTER TABLE dbo.Invoice ADD CONSTRAINT CK_Invoice_Cancel   CHECK (status <> N'Cancelled' OR cancelled_at IS NOT NULL);
ALTER TABLE dbo.InvoiceService ADD CONSTRAINT CK_InvoiceService_Values  CHECK (unit_price >= 0 AND discount_amount >= 0);
ALTER TABLE dbo.InvoiceService ADD CONSTRAINT CK_InvoiceService_Package CHECK (is_package_session = 0 OR unit_price = 0);
ALTER TABLE dbo.InvoicePackage ADD CONSTRAINT CK_InvoicePackage_Price   CHECK (unit_price >= 0);
ALTER TABLE dbo.Payment ADD CONSTRAINT CK_Payment_Method CHECK (payment_method IN (N'Cash', N'BankTransfer', N'VNPay'));
ALTER TABLE dbo.Payment ADD CONSTRAINT CK_Payment_Amount CHECK (amount > 0);
ALTER TABLE dbo.Payment ADD CONSTRAINT CK_Payment_Status CHECK (status IN (N'Success', N'Refunded'));
ALTER TABLE dbo.Payment ADD CONSTRAINT CK_Payment_VNPay  CHECK (payment_method <> N'VNPay' OR transaction_code IS NOT NULL);
ALTER TABLE dbo.PaymentAttempt ADD CONSTRAINT CK_PaymentAttempt_Status CHECK (status IN (N'Pending', N'Success', N'Failed', N'Expired'));
ALTER TABLE dbo.PaymentAttempt ADD CONSTRAINT CK_PaymentAttempt_Values CHECK (amount > 0 AND expires_at > created_at);
ALTER TABLE dbo.PaymentAttempt ADD CONSTRAINT CK_PaymentAttempt_Result CHECK (status = N'Pending' OR verified_at IS NOT NULL);
ALTER TABLE dbo.Refund ADD CONSTRAINT CK_Refund_Amount CHECK (amount > 0);
ALTER TABLE dbo.Refund ADD CONSTRAINT CK_Refund_Status CHECK (status IN (N'Pending', N'Completed', N'Failed'));
ALTER TABLE dbo.Refund ADD CONSTRAINT CK_Refund_Done   CHECK (status <> N'Completed' OR completed_at IS NOT NULL);

ALTER TABLE dbo.ServiceFeedback ADD CONSTRAINT CK_ServiceFeedback_Rating CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE dbo.ServiceFeedback ADD CONSTRAINT CK_ServiceFeedback_Hidden CHECK (is_hidden = 0 OR (moderation_reason IS NOT NULL AND moderated_by_staff_id IS NOT NULL));
GO

ALTER TABLE dbo.MembershipTier ADD CONSTRAINT DF_MembershipTier_Discount DEFAULT (0) FOR discount_percent;
ALTER TABLE dbo.Staff    ADD CONSTRAINT DF_Staff_Status        DEFAULT (N'Active') FOR status;
ALTER TABLE dbo.Staff    ADD CONSTRAINT DF_Staff_CreatedAt     DEFAULT (SYSDATETIME()) FOR created_at;
ALTER TABLE dbo.Staff    ADD CONSTRAINT DF_Staff_OtpAttempts   DEFAULT (0) FOR otp_attempts;
ALTER TABLE dbo.Customer ADD CONSTRAINT DF_Customer_Tier       DEFAULT (1) FOR membership_tier_id;
ALTER TABLE dbo.Customer ADD CONSTRAINT DF_Customer_Spending   DEFAULT (0) FOR lifetime_spending;
ALTER TABLE dbo.Customer ADD CONSTRAINT DF_Customer_Status     DEFAULT (N'Pending') FOR status;
ALTER TABLE dbo.Customer ADD CONSTRAINT DF_Customer_CreatedAt  DEFAULT (SYSDATETIME()) FOR created_at;
ALTER TABLE dbo.Customer ADD CONSTRAINT DF_Customer_OtpAttempts DEFAULT (0) FOR otp_attempts;
ALTER TABLE dbo.Service  ADD CONSTRAINT DF_Service_Tour        DEFAULT (1) FOR tour_count;
ALTER TABLE dbo.Service  ADD CONSTRAINT DF_Service_Status      DEFAULT (N'Active') FOR status;
ALTER TABLE dbo.TreatmentPackage ADD CONSTRAINT DF_TreatmentPackage_Status DEFAULT (N'Active') FOR status;
ALTER TABLE dbo.Room     ADD CONSTRAINT DF_Room_Status         DEFAULT (N'Active') FOR status;
ALTER TABLE dbo.Bed      ADD CONSTRAINT DF_Bed_Status          DEFAULT (N'Active') FOR status;
ALTER TABLE dbo.Bed      ADD CONSTRAINT DF_Bed_UseState        DEFAULT (N'Free') FOR use_state;
ALTER TABLE dbo.StaffLeave ADD CONSTRAINT DF_StaffLeave_Status    DEFAULT (N'Pending') FOR status;
ALTER TABLE dbo.StaffLeave ADD CONSTRAINT DF_StaffLeave_Requested DEFAULT (SYSDATETIME()) FOR requested_at;
ALTER TABLE dbo.TechnicianDailyTour ADD CONSTRAINT DF_TDT_Offset    DEFAULT (0) FOR start_offset_tours;
ALTER TABLE dbo.TechnicianDailyTour ADD CONSTRAINT DF_TDT_Counted   DEFAULT (0) FOR counted_tours;
ALTER TABLE dbo.TechnicianDailyTour ADD CONSTRAINT DF_TDT_Actual    DEFAULT (0) FOR actual_tours;
ALTER TABLE dbo.TechnicianDailyTour ADD CONSTRAINT DF_TDT_Requested DEFAULT (0) FOR requested_tours;
ALTER TABLE dbo.Voucher  ADD CONSTRAINT DF_Voucher_MinOrder    DEFAULT (0) FOR min_order_amount;
ALTER TABLE dbo.Voucher  ADD CONSTRAINT DF_Voucher_UsedCount   DEFAULT (0) FOR used_count;
ALTER TABLE dbo.Voucher  ADD CONSTRAINT DF_Voucher_Status      DEFAULT (N'Active') FOR status;
ALTER TABLE dbo.Appointment ADD CONSTRAINT DF_Appointment_Status    DEFAULT (N'Pending') FOR status;
ALTER TABLE dbo.Appointment ADD CONSTRAINT DF_Appointment_Payment   DEFAULT (N'Counter') FOR payment_choice;
ALTER TABLE dbo.Appointment ADD CONSTRAINT DF_Appointment_CreatedAt DEFAULT (SYSDATETIME()) FOR created_at;
ALTER TABLE dbo.AppointmentService ADD CONSTRAINT DF_AS_Requested DEFAULT (0) FOR is_requested_technician;
ALTER TABLE dbo.AppointmentService ADD CONSTRAINT DF_AS_Status    DEFAULT (N'Waiting') FOR status;
ALTER TABLE dbo.CustomerPackage ADD CONSTRAINT DF_CustomerPackage_Status   DEFAULT (N'Active') FOR status;
ALTER TABLE dbo.CustomerPackage ADD CONSTRAINT DF_CustomerPackage_Purchase DEFAULT (SYSDATETIME()) FOR purchase_date;
ALTER TABLE dbo.AppointmentStatusHistory ADD CONSTRAINT DF_ASH_ChangedAt DEFAULT (SYSDATETIME()) FOR changed_at;
ALTER TABLE dbo.TreatmentPhoto ADD CONSTRAINT DF_TreatmentPhoto_CreatedAt DEFAULT (SYSDATETIME()) FOR created_at;
ALTER TABLE dbo.Invoice  ADD CONSTRAINT DF_Invoice_Date        DEFAULT (SYSDATETIME()) FOR invoice_date;
ALTER TABLE dbo.Invoice  ADD CONSTRAINT DF_Invoice_TierDisc    DEFAULT (0) FOR tier_discount;
ALTER TABLE dbo.Invoice  ADD CONSTRAINT DF_Invoice_VoucherDisc DEFAULT (0) FOR voucher_discount;
ALTER TABLE dbo.Invoice  ADD CONSTRAINT DF_Invoice_TotalDisc   DEFAULT (0) FOR total_discount;
ALTER TABLE dbo.Invoice  ADD CONSTRAINT DF_Invoice_Status      DEFAULT (N'Unpaid') FOR status;
ALTER TABLE dbo.InvoiceService ADD CONSTRAINT DF_InvoiceService_Package  DEFAULT (0) FOR is_package_session;
ALTER TABLE dbo.InvoiceService ADD CONSTRAINT DF_InvoiceService_Discount DEFAULT (0) FOR discount_amount;
ALTER TABLE dbo.Payment  ADD CONSTRAINT DF_Payment_Date        DEFAULT (SYSDATETIME()) FOR payment_date;
ALTER TABLE dbo.Payment  ADD CONSTRAINT DF_Payment_Status      DEFAULT (N'Success') FOR status;
ALTER TABLE dbo.PaymentAttempt ADD CONSTRAINT DF_PaymentAttempt_Status    DEFAULT (N'Pending') FOR status;
ALTER TABLE dbo.PaymentAttempt ADD CONSTRAINT DF_PaymentAttempt_CreatedAt DEFAULT (SYSDATETIME()) FOR created_at;
ALTER TABLE dbo.Refund   ADD CONSTRAINT DF_Refund_Status       DEFAULT (N'Pending') FOR status;
ALTER TABLE dbo.Refund   ADD CONSTRAINT DF_Refund_CreatedAt    DEFAULT (SYSDATETIME()) FOR created_at;
ALTER TABLE dbo.ServiceFeedback ADD CONSTRAINT DF_ServiceFeedback_Hidden    DEFAULT (0) FOR is_hidden;
ALTER TABLE dbo.ServiceFeedback ADD CONSTRAINT DF_ServiceFeedback_CreatedAt DEFAULT (SYSDATETIME()) FOR created_at;
GO
PRINT N'Đã tạo xong toàn bộ ràng buộc cho BeautySalonDB.';
GO
