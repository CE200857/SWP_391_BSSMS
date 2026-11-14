package bssms_persistence.common;

public final class SchemaSql {
    private SchemaSql() {}
    public static final String ACCOUNTS = "(SELECT staff_id*2 AS account_id,username,password,email,phone,status,role,full_name,created_at,staff_id,CAST(NULL AS int) AS customer_id FROM Staff UNION ALL SELECT customer_id*2+1,username,password,email,phone,status,CAST('Customer' AS nvarchar(100)),full_name,created_at,CAST(NULL AS int),customer_id FROM Customer WHERE status<>'Pending')";
    public static final String STAFF = "(SELECT s.staff_id,s.full_name,s.phone,s.email,s.role,s.hire_date,s.username,s.status,s.created_at,s.staff_id*2 AS account_id,s.role AS position FROM Staff s)";
    public static final String CUSTOMERS = "(SELECT c.customer_id,c.membership_tier_id,c.full_name,c.date_of_birth,c.gender,c.address,c.phone,c.email,c.skin_condition,c.allergies,c.notes,c.lifetime_spending,c.username,c.status,c.created_at,c.customer_id*2+1 AS account_id FROM Customer c WHERE c.status<>'Pending')";
    public static final String FEEDBACK = "(SELECT f.feedback_id,f.customer_id,l.appointment_id,l.service_id,f.appointment_service_id,f.rating,f.comment,f.created_at,f.updated_at,f.is_hidden,f.moderation_reason FROM ServiceFeedback f JOIN AppointmentService l ON l.appointment_service_id=f.appointment_service_id)";
    public static final String BUSY_APPOINTMENT = "a.status IN ('Pending','Confirmed','Checked-in','In-progress')";
}
