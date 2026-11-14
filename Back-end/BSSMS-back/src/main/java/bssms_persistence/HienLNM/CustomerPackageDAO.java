package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import java.sql.SQLException;
import java.util.*;

public class CustomerPackageDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    public Map<String, Object> sellTreatmentPackage(int customerId, int treatmentPackageId, String voucherCode, String paymentMethod) throws SQLException {
        Workflow w = workflow();
        w.roles("Receptionist");
        if (!Arrays.asList("Cash", "BankTransfer", "VNPay").contains(paymentMethod)) throw new IllegalArgumentException("Phương thức thanh toán không hợp lệ.");
        return w.transaction(() -> {
            BillingWorkflow billing = new BillingWorkflow(w);
            int invoice = billing.packageInvoice(customerId, treatmentPackageId, voucherCode, w.staffId());
            if (!"VNPay".equals(paymentMethod)) billing.pay(invoice, paymentMethod, null, w.staffId());
            Map<String, Object> result = new LinkedHashMap<>(w.one("SELECT invoice_id,status,subtotal,tier_discount,voucher_discount,total_amount FROM Invoice WHERE invoice_id=?", invoice));
            result.put("customerPackage", w.query("SELECT customer_package_id,total_sessions,remaining_sessions,expiry_date,status FROM CustomerPackage WHERE sold_invoice_id=?", invoice).stream().findFirst().orElse(null));
            return result;
        });
    }
}
