package bssms_persistence.KhanhLTQ;

import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import java.sql.SQLException;

public class PackagePurchaseDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    public int purchase(int treatmentPackageId, String voucherCode) throws SQLException {
        Workflow w = workflow();
        w.roles("Customer");
        return w.transaction(() -> new BillingWorkflow(w).packageInvoice(w.customerId(), treatmentPackageId, voucherCode, null));
    }
}
