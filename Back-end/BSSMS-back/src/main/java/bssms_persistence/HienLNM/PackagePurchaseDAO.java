package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

/** Customer buys a treatment package online: creates an Unpaid package invoice, paid afterwards through VNPay. */
public class PackagePurchaseDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    public int purchase(int treatmentPackageId) throws SQLException {
        workflow().roles("Customer");
        List<Map<String, Object>> rows = workflow().call("usp_PurchasePackageOnline", requireActorAccountId(), treatmentPackageId);
        return ((Number) rows.get(0).get("invoiceId")).intValue();
    }
}
