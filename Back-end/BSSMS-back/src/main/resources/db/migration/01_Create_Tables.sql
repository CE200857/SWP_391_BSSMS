USE [master];
GO
IF DB_ID(N'BeautySalonDB') IS NOT NULL
BEGIN
    ALTER DATABASE [BeautySalonDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [BeautySalonDB];
END
GO
CREATE DATABASE [BeautySalonDB];
GO
USE [BeautySalonDB];
GO

CREATE TABLE dbo.MembershipTier (
    membership_tier_id   INT            IDENTITY(1,1) NOT NULL,
    tier_name            NVARCHAR(50)   NOT NULL,
    min_spending         DECIMAL(18,2)  NOT NULL,
    discount_percent     DECIMAL(5,2)   NOT NULL,
    description          NVARCHAR(500)  NULL
);
GO

CREATE TABLE dbo.Staff (
    staff_id          INT            IDENTITY(1,1) NOT NULL,
    full_name         NVARCHAR(100)  NOT NULL,
    phone             NVARCHAR(20)   NULL,
    email             NVARCHAR(100)  NULL,
    role              NVARCHAR(20)   NOT NULL,
    hire_date         DATE           NULL,
    username          NVARCHAR(50)   NULL,
    password          NVARCHAR(255)  NULL,
    status            NVARCHAR(20)   NOT NULL,
    created_at        DATETIME2(0)   NOT NULL,
    otp_code          NVARCHAR(255)  NULL,
    otp_purpose       NVARCHAR(30)   NULL,
    otp_attempts      INT            NOT NULL,
    otp_expiry_time   DATETIME2(0)   NULL,
    otp_created_at    DATETIME2(0)   NULL,
    otp_consumed_at   DATETIME2(0)   NULL
);
GO
CREATE TABLE dbo.Customer (
    customer_id          INT             IDENTITY(1,1) NOT NULL,
    membership_tier_id   INT             NOT NULL,
    full_name            NVARCHAR(100)   NOT NULL,
    date_of_birth        DATE            NULL,
    gender               NVARCHAR(10)    NULL,
    address              NVARCHAR(255)   NULL,
    phone                NVARCHAR(20)    NOT NULL,
    email                NVARCHAR(100)   NULL,
    skin_condition       NVARCHAR(1000)  NULL,
    allergies            NVARCHAR(1000)  NULL,
    notes                NVARCHAR(1000)  NULL,
    lifetime_spending    DECIMAL(18,2)   NOT NULL,
    username             NVARCHAR(50)    NULL,
    password             NVARCHAR(255)   NULL,
    status               NVARCHAR(20)    NOT NULL,
    created_at           DATETIME2(0)    NOT NULL,
    otp_code             NVARCHAR(255)   NULL,
    otp_purpose          NVARCHAR(30)    NULL,
    otp_attempts         INT             NOT NULL,
    otp_expiry_time      DATETIME2(0)    NULL,
    otp_created_at       DATETIME2(0)    NULL,
    otp_consumed_at      DATETIME2(0)    NULL,
    otp_email            NVARCHAR(100)   NULL
);
GO

CREATE TABLE dbo.Service (
    service_id           INT             IDENTITY(1,1) NOT NULL,
    service_name         NVARCHAR(150)   NOT NULL,
    description          NVARCHAR(MAX)   NULL,
    category             NVARCHAR(50)    NOT NULL,
    required_room_type   NVARCHAR(50)    NOT NULL,
    price                DECIMAL(18,2)   NOT NULL,
    duration             INT             NOT NULL,
    tour_count           DECIMAL(3,1)    NOT NULL,
    status               NVARCHAR(20)    NOT NULL,
    image_key            NVARCHAR(260)   NULL
);
GO
CREATE TABLE dbo.TreatmentPackage (
    treatment_package_id  INT            IDENTITY(1,1) NOT NULL,
    package_name          NVARCHAR(150)  NOT NULL,
    description           NVARCHAR(MAX)  NULL,
    price                 DECIMAL(18,2)  NOT NULL,
    number_of_sessions    INT            NOT NULL,
    validity_days         INT            NOT NULL,
    status                NVARCHAR(20)   NOT NULL
);
GO
CREATE TABLE dbo.TreatmentPackageService (
    treatment_package_id  INT  NOT NULL,
    service_id            INT  NOT NULL
);
GO
CREATE TABLE dbo.Room (
    room_id     INT            IDENTITY(1,1) NOT NULL,
    room_name   NVARCHAR(100)  NOT NULL,
    room_type   NVARCHAR(50)   NOT NULL,
    status      NVARCHAR(20)   NOT NULL
);
GO
CREATE TABLE dbo.Bed (
    bed_id                 INT            IDENTITY(1,1) NOT NULL,
    room_id                INT            NOT NULL,
    bed_number             NVARCHAR(20)   NOT NULL,
    status                 NVARCHAR(20)   NOT NULL,
    use_state              NVARCHAR(20)   NOT NULL,
    use_state_updated_at   DATETIME2(0)   NULL
);
GO

CREATE TABLE dbo.StaffService (
    staff_id    INT  NOT NULL,
    service_id  INT  NOT NULL
);
GO
CREATE TABLE dbo.StaffShift (
    staff_shift_id        INT           IDENTITY(1,1) NOT NULL,
    staff_id              INT           NOT NULL,
    shift_date            DATE          NOT NULL,
    shift_type            NVARCHAR(20)  NOT NULL,
    start_time            TIME(0)       NOT NULL,
    end_time              TIME(0)       NOT NULL
);
GO
CREATE TABLE dbo.StaffLeave (
    leave_id               INT            IDENTITY(1,1) NOT NULL,
    staff_id               INT            NOT NULL,
    start_date             DATE           NOT NULL,
    end_date               DATE           NOT NULL,
    reason                 NVARCHAR(500)  NULL,
    status                 NVARCHAR(20)   NOT NULL,
    requested_at           DATETIME2(0)   NOT NULL,
    approved_by_staff_id   INT            NULL,
    decided_at             DATETIME2(0)   NULL,
    decision_note          NVARCHAR(500)  NULL
);
GO
CREATE TABLE dbo.TechnicianDailyTour (
    staff_id             INT           NOT NULL,
    work_date            DATE          NOT NULL,
    start_offset_tours   DECIMAL(5,1)  NOT NULL,
    counted_tours        DECIMAL(5,1)  NOT NULL,
    actual_tours         DECIMAL(5,1)  NOT NULL,
    requested_tours      DECIMAL(5,1)  NOT NULL,
    last_assigned_at     DATETIME2(0)  NULL
);
GO

CREATE TABLE dbo.Voucher (
    voucher_id            INT            IDENTITY(1,1) NOT NULL,
    voucher_code          NVARCHAR(50)   NOT NULL,
    voucher_name          NVARCHAR(100)  NOT NULL,
    discount_type         NVARCHAR(20)   NOT NULL,
    discount_value        DECIMAL(18,2)  NOT NULL,
    min_order_amount      DECIMAL(18,2)  NOT NULL,
    max_discount          DECIMAL(18,2)  NULL,
    max_uses              INT            NOT NULL,
    used_count            INT            NOT NULL,
    start_date            DATETIME2(0)   NOT NULL,
    end_date              DATETIME2(0)   NOT NULL,
    status                NVARCHAR(20)   NOT NULL,
    created_by_staff_id   INT            NULL
);
GO

CREATE TABLE dbo.Appointment (
    appointment_id           INT             IDENTITY(1,1) NOT NULL,
    customer_id              INT             NOT NULL,
    appointment_date         DATE            NOT NULL,
    start_time               TIME(0)         NOT NULL,
    end_time                 TIME(0)         NOT NULL,
    status                   NVARCHAR(20)    NOT NULL,
    payment_choice           NVARCHAR(20)    NOT NULL,
    notes                    NVARCHAR(1000)  NULL,
    created_by_staff_id      INT             NULL,
    created_at               DATETIME2(0)    NOT NULL,
    confirmed_at             DATETIME2(0)    NULL,
    checked_in_at            DATETIME2(0)    NULL,
    completed_at             DATETIME2(0)    NULL,
    cancelled_at             DATETIME2(0)    NULL,
    cancellation_reason      NVARCHAR(500)   NULL
);
GO
CREATE TABLE dbo.CustomerPackage (
    customer_package_id    INT            IDENTITY(1,1) NOT NULL,
    customer_id            INT            NOT NULL,
    treatment_package_id   INT            NOT NULL,
    sold_invoice_id        INT            NOT NULL,
    sold_by_staff_id       INT            NULL,
    purchase_date          DATETIME2(0)   NOT NULL,
    expiry_date            DATE           NOT NULL,
    total_sessions         INT            NOT NULL,
    remaining_sessions     INT            NOT NULL,
    purchase_price         DECIMAL(18,2)  NOT NULL,
    status                 NVARCHAR(20)   NOT NULL
);
GO
CREATE TABLE dbo.AppointmentService (
    appointment_service_id    INT             IDENTITY(1,1) NOT NULL,
    appointment_id            INT             NOT NULL,
    service_id                INT             NOT NULL,
    line_no                   INT             NOT NULL,
    start_time                TIME(0)         NOT NULL,
    end_time                  TIME(0)         NOT NULL,
    technician_id             INT             NULL,
    is_requested_technician   BIT             NOT NULL,
    tour_count                DECIMAL(3,1)    NOT NULL,
    bed_id                    INT             NULL,
    customer_package_id       INT             NULL,
    unit_price                DECIMAL(18,2)   NOT NULL,
    status                    NVARCHAR(20)    NOT NULL,
    started_at                DATETIME2(0)    NULL,
    done_at                   DATETIME2(0)    NULL,
    result_notes              NVARCHAR(MAX)   NULL,
    skin_reaction             NVARCHAR(1000)  NULL
);
GO
CREATE TABLE dbo.AppointmentStatusHistory (
    history_id               BIGINT          IDENTITY(1,1) NOT NULL,
    appointment_id           INT             NOT NULL,
    old_status               NVARCHAR(20)    NULL,
    new_status               NVARCHAR(20)    NOT NULL,
    changed_at               DATETIME2(0)    NOT NULL,
    reason                   NVARCHAR(500)   NULL
);
GO
CREATE TABLE dbo.TreatmentPhoto (
    photo_id                  INT            IDENTITY(1,1) NOT NULL,
    appointment_service_id    INT            NOT NULL,
    photo_type                NVARCHAR(10)   NOT NULL,
    storage_key               NVARCHAR(500)  NOT NULL,
    created_at                DATETIME2(0)   NOT NULL
);
GO

CREATE TABLE dbo.Invoice (
    invoice_id              INT             IDENTITY(1,1) NOT NULL,
    customer_id             INT             NOT NULL,
    invoice_type            NVARCHAR(20)    NOT NULL,
    appointment_id          INT             NULL,
    voucher_id              INT             NULL,
    created_by_staff_id     INT             NULL,
    invoice_date            DATETIME2(0)    NOT NULL,
    subtotal                DECIMAL(18,2)   NOT NULL,
    tier_discount           DECIMAL(18,2)   NOT NULL,
    voucher_discount        DECIMAL(18,2)   NOT NULL,
    total_discount          DECIMAL(18,2)   NOT NULL,
    total_amount            DECIMAL(18,2)   NOT NULL,
    status                  NVARCHAR(20)    NOT NULL,
    paid_at                 DATETIME2(0)    NULL,
    cancelled_at            DATETIME2(0)    NULL,
    cancellation_reason     NVARCHAR(500)   NULL
);
GO
CREATE TABLE dbo.InvoiceService (
    invoice_service_id        INT            IDENTITY(1,1) NOT NULL,
    invoice_id                INT            NOT NULL,
    appointment_service_id    INT            NOT NULL,
    service_name              NVARCHAR(150)  NOT NULL,
    unit_price                DECIMAL(18,2)  NOT NULL,
    is_package_session        BIT            NOT NULL,
    discount_amount           DECIMAL(18,2)  NOT NULL
);
GO
CREATE TABLE dbo.InvoicePackage (
    invoice_id              INT            NOT NULL,
    treatment_package_id    INT            NOT NULL,
    package_name            NVARCHAR(150)  NOT NULL,
    unit_price              DECIMAL(18,2)  NOT NULL
);
GO
CREATE TABLE dbo.Payment (
    payment_id              INT            IDENTITY(1,1) NOT NULL,
    invoice_id              INT            NOT NULL,
    payment_method          NVARCHAR(20)   NOT NULL,
    amount                  DECIMAL(18,2)  NOT NULL,
    payment_date            DATETIME2(0)   NOT NULL,
    transaction_code        NVARCHAR(100)  NULL,
    received_by_staff_id    INT            NULL,
    status                  NVARCHAR(20)   NOT NULL
);
GO
CREATE TABLE dbo.PaymentAttempt (
    attempt_id              INT            IDENTITY(1,1) NOT NULL,
    invoice_id              INT            NOT NULL,
    merchant_reference      NVARCHAR(100)  NOT NULL,
    amount                  DECIMAL(18,2)  NOT NULL,
    status                  NVARCHAR(20)   NOT NULL,
    provider_transaction    NVARCHAR(100)  NULL,
    created_at              DATETIME2(0)   NOT NULL,
    expires_at              DATETIME2(0)   NOT NULL,
    verified_at             DATETIME2(0)   NULL
);
GO
CREATE TABLE dbo.Refund (
    refund_id               INT             IDENTITY(1,1) NOT NULL,
    payment_id              INT             NOT NULL,
    amount                  DECIMAL(18,2)   NOT NULL,
    reason                  NVARCHAR(500)   NOT NULL,
    status                  NVARCHAR(20)    NOT NULL,
    approved_by_staff_id    INT             NOT NULL,
    created_at              DATETIME2(0)    NOT NULL,
    completed_at            DATETIME2(0)    NULL,
    provider_request_id     NVARCHAR(50)    NULL,
    provider_response       NVARCHAR(1000)  NULL
);
GO

CREATE TABLE dbo.ServiceFeedback (
    feedback_id               INT             IDENTITY(1,1) NOT NULL,
    customer_id               INT             NOT NULL,
    appointment_service_id    INT             NOT NULL,
    rating                    INT             NOT NULL,
    comment                   NVARCHAR(1000)  NULL,
    created_at                DATETIME2(0)    NOT NULL,
    updated_at                DATETIME2(0)    NULL,
    is_hidden                 BIT             NOT NULL,
    moderation_reason         NVARCHAR(500)   NULL,
    moderated_by_staff_id     INT             NULL
);
GO
