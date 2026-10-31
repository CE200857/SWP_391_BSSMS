package bssms_persistence.common;

/** Read projections for the 38-table schema. No database tables are created here.
 * accountId remains an opaque API identifier: staff=2*staffId, customer=2*customerId+1.
 * Actual foreign keys always use staffId or customerId, never accountId.
 */
public final class SchemaSql {
    private SchemaSql() {}
    public static final String ACCOUNTS = "(SELECT staff_id*2 AS account_id,username,password,email,phone,status,role,full_name,created_at,staff_id,CAST(NULL AS int) AS customer_id FROM Staff UNION ALL SELECT customer_id*2+1,username,password,email,phone,status,CAST('Customer' AS nvarchar(100)),full_name,created_at,CAST(NULL AS int),customer_id FROM Customer)";
    public static final String STAFF = "(SELECT s.staff_id,s.full_name,s.phone,s.email,s.role,s.salary,s.hire_date,s.username,s.status,s.created_at,s.staff_id*2 AS account_id,s.role AS position FROM Staff s)";
    public static final String CUSTOMERS = "(SELECT c.customer_id,c.membership_tier_id,c.full_name,c.date_of_birth,c.gender,c.address,c.phone,c.email,c.skin_condition,c.allergies,c.notes,c.vip_since,c.username,c.status,c.created_at,c.customer_id*2+1 AS account_id FROM Customer c)";
    public static final String FEEDBACK = "(SELECT feedback_id,customer_id,appointment_id,feedback_rating AS rating,feedback_comment AS comment,feedback_created_at AS created_at,feedback_updated_at AS updated_at,feedback_is_hidden AS is_hidden,feedback_moderation_reason AS moderation_reason FROM Appointment WHERE feedback_id IS NOT NULL)";
    public static final String TREATMENTS = "(SELECT treatment_record_id,appointment_id,treatment_staff_id AS staff_id,result_notes,skin_reaction,treatment_created_at AS created_at,treatment_updated_at AS updated_at FROM Appointment WHERE treatment_record_id IS NOT NULL)";
    public static final String PACKAGE_SALES = "(SELECT invoice_package_id,sold_invoice_id AS invoice_id,customer_package_id,sold_package_name AS package_name,sold_unit_price AS unit_price,sold_discount_amount AS discount_amount FROM CustomerPackage WHERE sold_invoice_id IS NOT NULL)";
    public static final String REDEMPTIONS = "(SELECT voucher_redemption_id AS redemption_id,voucher_id,invoice_id,customer_id,voucher_discount AS discount_amount,voucher_redeemed_at AS redeemed_at FROM Invoice WHERE voucher_redemption_id IS NOT NULL AND status<>'Cancelled')";
    public static final String BIRTHDAYS = "(SELECT customer_id,birthday_benefit_year AS benefit_year,invoice_id,birthday_benefit_used_at AS used_at FROM Invoice WHERE birthday_benefit_year IS NOT NULL)";
    public static final String PACKAGE_USAGE = "(SELECT package_usage_id AS usage_id,customer_package_id,appointment_id,package_used_at AS used_at FROM Appointment WHERE package_usage_id IS NOT NULL)";
}
