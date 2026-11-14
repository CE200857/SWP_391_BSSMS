package bssms_persistence.common;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.SQLException;
import java.util.*;

public final class BillingWorkflow {
    private final Workflow w;
    public BillingWorkflow(Workflow w) { this.w = w; }

    static BigDecimal money(Object value) {
        return value == null ? BigDecimal.ZERO : new BigDecimal(String.valueOf(value)).setScale(2, RoundingMode.HALF_UP);
    }
    static BigDecimal round(BigDecimal value) { return value.setScale(0, RoundingMode.HALF_UP).setScale(2); }

    public BigDecimal tierPercent(int customer) throws SQLException {
        return money(w.one("SELECT t.discount_percent FROM Customer c JOIN MembershipTier t ON t.membership_tier_id=c.membership_tier_id WHERE c.customer_id=?", customer).get("discountPercent"));
    }

    public BigDecimal voucherDiscount(Integer voucher, BigDecimal afterTier) throws SQLException {
        if (voucher == null) return BigDecimal.ZERO;
        Map<String, Object> v = w.one("SELECT * FROM Voucher WHERE voucher_id=?", voucher);
        BigDecimal value = money(v.get("discountValue"));
        BigDecimal discount = "Percent".equals(v.get("discountType")) ? round(afterTier.multiply(value).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)) : value;
        if (v.get("maxDiscount") != null) discount = discount.min(money(v.get("maxDiscount")));
        return discount.min(afterTier).max(BigDecimal.ZERO);
    }

    public int validateVoucher(String code, BigDecimal afterTier) throws SQLException {
        List<Map<String, Object>> rows = w.query("SELECT voucher_id,status,start_date,end_date,max_uses,used_count,min_order_amount FROM Voucher WHERE voucher_code=?", code == null ? "" : code.trim());
        if (rows.isEmpty()) throw new WorkflowException(404, "Mã voucher không tồn tại.");
        Map<String, Object> v = rows.get(0);
        if (!"Active".equals(v.get("status"))) throw new WorkflowException(409, "Voucher đã ngừng áp dụng.");
        if (w.query("SELECT voucher_id FROM Voucher WHERE voucher_id=? AND SYSDATETIME() BETWEEN start_date AND end_date", v.get("voucherId")).isEmpty())
            throw new WorkflowException(409, "Voucher chưa đến hạn hoặc đã hết hạn.");
        if (((Number) v.get("usedCount")).intValue() >= ((Number) v.get("maxUses")).intValue()) throw new WorkflowException(409, "Voucher đã hết lượt sử dụng.");
        if (afterTier.compareTo(money(v.get("minOrderAmount"))) < 0) throw new WorkflowException(409, "Đơn hàng chưa đạt giá trị tối thiểu của voucher.");
        return Workflow.id(v.get("voucherId"));
    }

    void writeAmounts(int invoice, int customer, BigDecimal subtotal, Integer voucher) throws SQLException {
        BigDecimal tier = round(subtotal.multiply(tierPercent(customer)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        BigDecimal limit = round(subtotal.multiply(new BigDecimal("0.5")));
        tier = tier.min(limit);
        BigDecimal voucherDiscount = voucherDiscount(voucher, subtotal.subtract(tier)).min(limit.subtract(tier));
        BigDecimal total = tier.add(voucherDiscount);
        w.update("UPDATE Invoice SET subtotal=?,tier_discount=?,voucher_discount=?,total_discount=?,total_amount=?,voucher_id=? WHERE invoice_id=?",
                subtotal, tier, voucherDiscount, total, subtotal.subtract(total), voucher, invoice);
    }

    public void syncAppointmentInvoice(int appointment, Integer staff) throws SQLException {
        Map<String, Object> a = w.one("SELECT customer_id FROM Appointment WHERE appointment_id=?", appointment);
        int customer = Workflow.id(a.get("customerId"));
        List<Map<String, Object>> lines = w.query("SELECT l.appointment_service_id,l.unit_price,l.customer_package_id,s.service_name FROM AppointmentService l JOIN Service s ON s.service_id=l.service_id WHERE l.appointment_id=? ORDER BY l.line_no", appointment);
        BigDecimal subtotal = BigDecimal.ZERO;
        for (Map<String, Object> l : lines) subtotal = subtotal.add(money(l.get("unitPrice")));
        List<Map<String, Object>> invoices = w.query("SELECT invoice_id,status,subtotal,voucher_id FROM Invoice WHERE appointment_id=? AND status IN ('Unpaid','Paid')", appointment);
        if (!invoices.isEmpty() && "Paid".equals(invoices.get(0).get("status"))) {
            if (money(invoices.get(0).get("subtotal")).compareTo(subtotal) != 0)
                throw new WorkflowException(409, "Hóa đơn đã thanh toán nên không thể đổi dịch vụ làm thay đổi số tiền. Vui lòng liên hệ lễ tân.");
            int invoice = Workflow.id(invoices.get(0).get("invoiceId"));
            w.update("DELETE FROM InvoiceService WHERE invoice_id=?", invoice);
            insertInvoiceLines(invoice, lines);
            return;
        }
        if (subtotal.signum() == 0) {
            for (Map<String, Object> i : invoices) cancel(Workflow.id(i.get("invoiceId")), "Lịch chỉ dùng buổi trong gói", staff);
            return;
        }
        int invoice;
        Integer voucher = null;
        if (invoices.isEmpty()) {
            invoice = w.insert("INSERT INTO Invoice(customer_id,invoice_type,appointment_id,created_by_staff_id,invoice_date,subtotal,tier_discount,voucher_discount,total_discount,total_amount,status) VALUES(?,'Appointment',?,?,SYSDATETIME(),?,0,0,0,?,'Unpaid')",
                    customer, appointment, staff, subtotal, subtotal);
        } else {
            invoice = Workflow.id(invoices.get(0).get("invoiceId"));
            voucher = invoices.get(0).get("voucherId") == null ? null : Workflow.id(invoices.get(0).get("voucherId"));
            w.update("DELETE FROM InvoiceService WHERE invoice_id=?", invoice);
        }
        insertInvoiceLines(invoice, lines);
        writeAmounts(invoice, customer, subtotal, voucher);
    }
    private void insertInvoiceLines(int invoice, List<Map<String, Object>> lines) throws SQLException {
        for (Map<String, Object> l : lines)
            w.update("INSERT INTO InvoiceService(invoice_id,appointment_service_id,service_name,unit_price,is_package_session,discount_amount) VALUES(?,?,?,?,?,0)",
                    invoice, l.get("appointmentServiceId"), l.get("serviceName"), money(l.get("unitPrice")), l.get("customerPackageId") != null);
    }

    public int packageInvoice(int customer, int pkg, String voucherCode, Integer staff) throws SQLException {
        Map<String, Object> p = w.query("SELECT treatment_package_id,package_name,price FROM TreatmentPackage WHERE treatment_package_id=? AND status='Active'", pkg)
                .stream().findFirst().orElseThrow(() -> new WorkflowException(404, "Gói liệu trình không tồn tại hoặc đã ngừng bán."));
        if (w.query("SELECT customer_id FROM Customer WHERE customer_id=? AND status='Active'", customer).isEmpty()) throw new WorkflowException(404, "Khách hàng không hoạt động.");
        BigDecimal price = money(p.get("price"));
        int invoice = w.insert("INSERT INTO Invoice(customer_id,invoice_type,appointment_id,created_by_staff_id,invoice_date,subtotal,tier_discount,voucher_discount,total_discount,total_amount,status) VALUES(?,'Package',NULL,?,SYSDATETIME(),?,0,0,0,?,'Unpaid')",
                customer, staff, price, price);
        w.update("INSERT INTO InvoicePackage(invoice_id,treatment_package_id,package_name,unit_price) VALUES(?,?,?,?)", invoice, pkg, p.get("packageName"), price);
        Integer voucher = null;
        if (voucherCode != null && !voucherCode.isBlank()) {
            BigDecimal afterTier = price.subtract(round(price.multiply(tierPercent(customer)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)));
            voucher = validateVoucher(voucherCode, afterTier);
        }
        writeAmounts(invoice, customer, price, voucher);
        return invoice;
    }

    public Map<String, Object> applyVoucher(int invoice, String code) throws SQLException {
        Map<String, Object> i = w.one("SELECT customer_id,subtotal,status FROM Invoice WHERE invoice_id=?", invoice);
        if (!"Unpaid".equals(i.get("status"))) throw new WorkflowException(409, "Chỉ áp voucher cho hóa đơn chưa thanh toán.");
        int customer = Workflow.id(i.get("customerId"));
        BigDecimal subtotal = money(i.get("subtotal"));
        Integer voucher = null;
        if (code != null && !code.isBlank()) {
            BigDecimal afterTier = subtotal.subtract(round(subtotal.multiply(tierPercent(customer)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)));
            voucher = validateVoucher(code, afterTier);
        }
        writeAmounts(invoice, customer, subtotal, voucher);
        return w.one("SELECT invoice_id,subtotal,tier_discount,voucher_discount,total_discount,total_amount,voucher_id FROM Invoice WHERE invoice_id=?", invoice);
    }

    public int pay(int invoice, String method, String transactionCode, Integer staff) throws SQLException {
        Map<String, Object> i = w.one("SELECT * FROM Invoice WHERE invoice_id=?", invoice);
        if (!"Unpaid".equals(i.get("status"))) throw new WorkflowException(409, "Hóa đơn không ở trạng thái chưa thanh toán.");
        if (!Arrays.asList("Cash", "BankTransfer", "VNPay").contains(method)) throw new IllegalArgumentException("Phương thức thanh toán không hợp lệ.");
        BigDecimal total = money(i.get("totalAmount"));
        int customer = Workflow.id(i.get("customerId"));
        int payment = 0;
        if (total.signum() > 0)
            payment = w.insert("INSERT INTO Payment(invoice_id,payment_method,amount,payment_date,transaction_code,received_by_staff_id,status) VALUES(?,?,?,SYSDATETIME(),?,?,'Success')",
                    invoice, method, total, transactionCode, staff);
        w.update("UPDATE Invoice SET status='Paid',paid_at=SYSDATETIME() WHERE invoice_id=?", invoice);
        if (i.get("voucherId") != null && w.update("UPDATE Voucher SET used_count=used_count+1 WHERE voucher_id=? AND used_count<max_uses", i.get("voucherId")) != 1)
            throw new WorkflowException(409, "Voucher đã hết lượt sử dụng.");
        addSpending(customer, total);
        if ("Package".equals(i.get("invoiceType"))) {
            for (Map<String, Object> p : w.query("SELECT ip.treatment_package_id,tp.number_of_sessions,tp.validity_days FROM InvoicePackage ip JOIN TreatmentPackage tp ON tp.treatment_package_id=ip.treatment_package_id WHERE ip.invoice_id=?", invoice)) {
                int sessions = ((Number) p.get("numberOfSessions")).intValue();
                w.update("INSERT INTO CustomerPackage(customer_id,treatment_package_id,sold_invoice_id,sold_by_staff_id,purchase_date,expiry_date,total_sessions,remaining_sessions,purchase_price,status) VALUES(?,?,?,?,SYSDATETIME(),DATEADD(day,?,CAST(SYSDATETIME() AS date)),?,?,?,'Active')",
                        customer, p.get("treatmentPackageId"), invoice, i.get("createdByStaffId"), p.get("validityDays"), sessions, sessions, total);
            }
        } else if (i.get("appointmentId") != null) {
            int appointment = Workflow.id(i.get("appointmentId"));
            if (w.update("UPDATE Appointment SET status='Confirmed',confirmed_at=SYSDATETIME(),payment_choice=CASE WHEN ?='VNPay' THEN 'Online' ELSE payment_choice END WHERE appointment_id=? AND status='Pending'", method, appointment) == 1)
                w.history(appointment, "Pending", "Confirmed", "Thanh toán thành công");
        }
        return payment;
    }

    public void requireCollectible(int invoice) throws SQLException {
        Map<String, Object> i = w.one("SELECT appointment_id FROM Invoice WHERE invoice_id=?", invoice);
        if (i.get("appointmentId") == null) return;
        String block = Timing.collect(String.valueOf(w.one("SELECT status FROM Appointment WHERE appointment_id=?", i.get("appointmentId")).get("status")));
        if (block != null) throw new WorkflowException(409, block);
    }

    public void requireOnlinePayable(int invoice) throws SQLException {
        Map<String, Object> i = w.one("SELECT appointment_id FROM Invoice WHERE invoice_id=?", invoice);
        if (i.get("appointmentId") == null) return;
        String block = Timing.payOnline(new Timing.Appt(w.one("SELECT status,appointment_date,start_time,created_at FROM Appointment WHERE appointment_id=?", i.get("appointmentId"))));
        if (block != null) throw new WorkflowException(409, block);
    }

    public void cancel(int invoice, String reason, Integer staff) throws SQLException {
        if (w.update("UPDATE Invoice SET status='Cancelled',cancelled_at=SYSDATETIME(),cancellation_reason=? WHERE invoice_id=? AND status='Unpaid'", reason == null ? "Hủy" : reason, invoice) != 1)
            throw new WorkflowException(409, "Chỉ hủy được hóa đơn chưa thanh toán. Hóa đơn đã thanh toán dùng chức năng Hoàn tiền.");
    }

    public int refund(int invoice, String reason, int staff, boolean completed) throws SQLException {
        Map<String, Object> i = w.one("SELECT * FROM Invoice WHERE invoice_id=?", invoice);
        if (!"Paid".equals(i.get("status"))) throw new WorkflowException(409, "Chỉ hoàn tiền hóa đơn đã thanh toán.");
        if ("Appointment".equals(i.get("invoiceType"))) {
            Object status = w.one("SELECT status FROM Appointment WHERE appointment_id=?", i.get("appointmentId")).get("status");
            if ("No-show".equals(status)) throw new WorkflowException(409, "Lịch No-show không được hoàn tiền (BR-19).");
            if (!"Cancelled".equals(status)) throw new WorkflowException(409, "Chỉ hoàn tiền khi lịch hẹn đã bị hủy.");
        } else {
            if (!w.query("SELECT customer_package_id FROM CustomerPackage WHERE sold_invoice_id=? AND remaining_sessions<total_sessions", invoice).isEmpty())
                throw new WorkflowException(409, "Gói đã sử dụng buổi nên không thể hoàn tiền.");
            w.update("UPDATE CustomerPackage SET status='Cancelled' WHERE sold_invoice_id=?", invoice);
        }
        int refund = 0;
        for (Map<String, Object> p : w.query("SELECT payment_id,amount FROM Payment WHERE invoice_id=? AND status='Success'", invoice)) {
            refund = w.insert("INSERT INTO Refund(payment_id,amount,reason,status,approved_by_staff_id,created_at,completed_at) VALUES(?,?,?,?,?,SYSDATETIME(),?)",
                    p.get("paymentId"), money(p.get("amount")), reason, completed ? "Completed" : "Pending", staff, completed ? new java.sql.Timestamp(System.currentTimeMillis()) : null);
            w.update("UPDATE Payment SET status='Refunded' WHERE payment_id=?", p.get("paymentId"));
        }
        w.update("UPDATE Invoice SET status='Refunded' WHERE invoice_id=?", invoice);
        addSpending(Workflow.id(i.get("customerId")), money(i.get("totalAmount")).negate());
        return refund;
    }

    public void addSpending(int customer, BigDecimal amount) throws SQLException {
        w.update("UPDATE Customer SET lifetime_spending=CASE WHEN lifetime_spending+?<0 THEN 0 ELSE lifetime_spending+? END WHERE customer_id=?", amount, amount, customer);
        w.update("UPDATE c SET membership_tier_id=(SELECT TOP 1 t.membership_tier_id FROM MembershipTier t WHERE t.min_spending<=c.lifetime_spending ORDER BY t.min_spending DESC) FROM Customer c WHERE c.customer_id=?", customer);
    }
}
