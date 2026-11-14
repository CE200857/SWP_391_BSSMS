package bssms_persistence.KhanhND;

import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import java.sql.SQLException;
import java.util.*;

public class InvoiceDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    private static final String SCOPE = "EXISTS(SELECT 1 FROM " + SchemaSql.ACCOUNTS + " ac WHERE ac.account_id=? AND ac.status='Active' AND (ac.role IN ('Receptionist','Manager') OR (ac.role='Customer' AND ac.customer_id=i.customer_id)))";

    public List<Map<String, Object>> getInvoices(String status, String fromDate, String toDate) throws SQLException {
        Workflow w = workflow();
        return w.query("SELECT i.invoice_id,i.invoice_type,i.appointment_id,i.customer_id,c.full_name AS customer_name,c.phone AS customer_phone,i.invoice_date,i.subtotal,i.tier_discount,i.voucher_discount,i.total_discount,i.total_amount,i.status,i.paid_at,"
                + "a.appointment_date,a.start_time,a.status AS appointment_status,a.payment_choice,"
                + "(SELECT TOP 1 p.payment_method FROM Payment p WHERE p.invoice_id=i.invoice_id ORDER BY p.payment_id DESC) AS payment_method,"
                + "(SELECT TOP 1 ip.package_name FROM InvoicePackage ip WHERE ip.invoice_id=i.invoice_id) AS package_name "
                + "FROM Invoice i JOIN Customer c ON c.customer_id=i.customer_id LEFT JOIN Appointment a ON a.appointment_id=i.appointment_id "
                + "WHERE " + SCOPE + " AND (? IS NULL OR i.status=?) AND CAST(i.invoice_date AS date)>=COALESCE(?,'1900-01-01') AND CAST(i.invoice_date AS date)<=COALESCE(?,'9999-12-31') "
                + "ORDER BY i.invoice_date DESC", w.actor, status, status, fromDate, toDate);
    }

    public Map<String, Object> getInvoiceDetails(int invoiceId) throws SQLException {
        Workflow w = workflow();
        List<Map<String, Object>> rows = w.query("SELECT i.*,c.full_name AS customer_name,c.phone AS customer_phone,c.email AS customer_email,t.tier_name,t.discount_percent,v.voucher_code,v.voucher_name,"
                + "a.appointment_date,a.start_time,a.status AS appointment_status,a.payment_choice,st.full_name AS created_by_name "
                + "FROM Invoice i JOIN Customer c ON c.customer_id=i.customer_id JOIN MembershipTier t ON t.membership_tier_id=c.membership_tier_id "
                + "LEFT JOIN Voucher v ON v.voucher_id=i.voucher_id LEFT JOIN Appointment a ON a.appointment_id=i.appointment_id LEFT JOIN Staff st ON st.staff_id=i.created_by_staff_id "
                + "WHERE i.invoice_id=? AND " + SCOPE, invoiceId, w.actor);
        if (rows.isEmpty()) throw new WorkflowException(404, "Không tìm thấy hóa đơn.");
        Map<String, Object> invoice = new LinkedHashMap<>(rows.get(0));
        invoice.put("services", w.query("SELECT x.invoice_service_id,x.appointment_service_id,x.service_name,x.unit_price,x.is_package_session,x.discount_amount,l.start_time,l.end_time,st.full_name AS technician_name "
                + "FROM InvoiceService x JOIN AppointmentService l ON l.appointment_service_id=x.appointment_service_id LEFT JOIN Staff st ON st.staff_id=l.technician_id WHERE x.invoice_id=? ORDER BY l.line_no", invoiceId));
        invoice.put("packages", w.query("SELECT ip.treatment_package_id,ip.package_name,ip.unit_price,tp.number_of_sessions,tp.validity_days FROM InvoicePackage ip JOIN TreatmentPackage tp ON tp.treatment_package_id=ip.treatment_package_id WHERE ip.invoice_id=?", invoiceId));
        invoice.put("payments", w.query("SELECT p.payment_id,p.payment_method,p.amount,p.payment_date,p.transaction_code,p.status,st.full_name AS received_by FROM Payment p LEFT JOIN Staff st ON st.staff_id=p.received_by_staff_id WHERE p.invoice_id=? ORDER BY p.payment_id", invoiceId));
        invoice.put("refunds", w.query("SELECT r.refund_id,r.amount,r.reason,r.status,r.created_at,r.completed_at,st.full_name AS approved_by FROM Refund r JOIN Payment p ON p.payment_id=r.payment_id LEFT JOIN Staff st ON st.staff_id=r.approved_by_staff_id WHERE p.invoice_id=? ORDER BY r.refund_id", invoiceId));
        return invoice;
    }

    public List<Map<String, Object>> unpaidAppointments() throws SQLException {
        workflow().roles("Receptionist");
        List<Map<String, Object>> rows = workflow().query("SELECT i.invoice_id,i.appointment_id,i.total_amount,a.appointment_date,a.start_time,a.status AS appointment_status,c.full_name AS customer_name,c.phone AS customer_phone,"
                + "(SELECT STRING_AGG(s.service_name,N', ') WITHIN GROUP (ORDER BY l.line_no) FROM AppointmentService l JOIN Service s ON s.service_id=l.service_id WHERE l.appointment_id=a.appointment_id) AS service_names "
                + "FROM Invoice i JOIN Appointment a ON a.appointment_id=i.appointment_id JOIN Customer c ON c.customer_id=i.customer_id "
                + "WHERE i.status='Unpaid' AND a.status IN ('Confirmed','Checked-in','In-progress','Completed') "
                + "ORDER BY CASE WHEN a.status IN ('Checked-in','In-progress','Completed') THEN 0 ELSE 1 END,a.appointment_date,a.start_time");
        for (Map<String, Object> r : rows) {
            String block = Timing.collect(String.valueOf(r.get("appointmentStatus")));
            r.put("canCollect", block == null);
            r.put("collectNote", block);
        }
        return rows;
    }

    public Map<String, Object> applyVoucher(int invoiceId, String code) throws SQLException {
        Workflow w = workflow();
        w.roles("Receptionist");
        return w.transaction(() -> new BillingWorkflow(w).applyVoucher(invoiceId, code));
    }

    public Map<String, Object> pay(int invoiceId, String method, String voucherCode, String transactionCode) throws SQLException {
        Workflow w = workflow();
        w.roles("Receptionist");
        if ("VNPay".equals(method)) throw new IllegalArgumentException("Thanh toán VNPay được xác nhận qua cổng VNPay.");
        return w.transaction(() -> {
            BillingWorkflow billing = new BillingWorkflow(w);
            billing.requireCollectible(invoiceId);
            if (voucherCode != null) billing.applyVoucher(invoiceId, voucherCode);
            int payment = billing.pay(invoiceId, method, transactionCode, w.staffId());
            Map<String, Object> result = new LinkedHashMap<>(w.one("SELECT invoice_id,status,total_amount,paid_at FROM Invoice WHERE invoice_id=?", invoiceId));
            result.put("paymentId", payment);
            return result;
        });
    }

    public void cancelInvoice(int invoiceId, String reason) throws SQLException {
        Workflow w = workflow();
        w.roles("Manager");
        if (reason == null || reason.isBlank()) throw new IllegalArgumentException("Vui lòng nhập lý do hủy.");
        w.transaction(() -> { new BillingWorkflow(w).cancel(invoiceId, reason.trim(), w.staffId()); return null; });
    }

    public Map<String, Object> refundInvoice(int invoiceId, String reason) throws SQLException {
        Workflow w = workflow();
        w.roles("Manager");
        if (reason == null || reason.isBlank()) throw new IllegalArgumentException("Vui lòng nhập lý do hoàn tiền.");
        return w.transaction(() -> {
            boolean online = !w.query("SELECT payment_id FROM Payment WHERE invoice_id=? AND payment_method='VNPay' AND status='Success'", invoiceId).isEmpty();
            int refund = new BillingWorkflow(w).refund(invoiceId, reason.trim(), w.staffId(), !online);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("refundId", refund);
            result.put("status", online ? "Pending" : "Completed");
            result.put("message", online ? "Đã tạo yêu cầu hoàn tiền VNPay." : "Đã hoàn tiền.");
            return result;
        });
    }
}
