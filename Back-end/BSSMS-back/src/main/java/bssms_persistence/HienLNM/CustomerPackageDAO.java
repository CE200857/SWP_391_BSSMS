package bssms_persistence.HienLNM;

import bssms_catalog.CustomerPackage;
import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author HienLNM
 */
public class CustomerPackageDAO extends DBContext implements AutoCloseable {

    private void requireConnection() {
        if (conn == null) throw new DataAccessException("Database connection unavailable");
    }
    @Override public void close() throws java.sql.SQLException { if (conn != null) conn.close(); }

    /**
     * Kiểm tra customer có tồn tại hay không.
     */
    public boolean customerExists(int customerId) {
        requireConnection();
        if (conn == null) {
            System.out.println("Database connection is null in CustomerPackageDAO.customerExists()");
            return false;
        }
        String sql = "SELECT COUNT(*) FROM " + bssms_persistence.common.SchemaSql.CUSTOMERS + " Customer WHERE customer_id = ?";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setInt(1, customerId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                int count = rs.getInt(1);
                rs.close();
                ps.close();
                return count > 0;
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return false;
    }

    /**
     * Lấy thông tin gói liệu trình theo id.
     * Trả về Map: packageName, price, numberOfSessions.
     */
    public Map<String, Object> getTreatmentPackageInfo(int treatmentPackageId) {
        requireConnection();
        if (conn == null) {
            System.out.println("Database connection is null in CustomerPackageDAO.getTreatmentPackageInfo()");
            return null;
        }
        String sql = "SELECT treatment_package_id, service_id, package_name, price, number_of_sessions "
                   + "FROM TreatmentPackage WHERE treatment_package_id = ?";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setInt(1, treatmentPackageId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                Map<String, Object> map = new HashMap<>();
                map.put("treatmentPackageId", rs.getInt("treatment_package_id"));
                map.put("serviceId", rs.getInt("service_id"));
                map.put("packageName", rs.getString("package_name"));
                map.put("price", rs.getDouble("price"));
                map.put("numberOfSessions", rs.getInt("number_of_sessions"));
                rs.close();
                ps.close();
                return map;
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return null;
    }

    /**
     * Bán gói liệu trình cho khách hàng.
     *
     * @param customerId
     * @param treatmentPackageId
     * @param expiryMonths số tháng hết hạn (mặc định 12 tháng)
     * @return Map chứa customerPackageId và invoiceId vừa tạo
     */
    public Map<String, Object> sellTreatmentPackage(int customerId, int treatmentPackageId, int expiryMonths) throws Exception {
        bssms_persistence.common.Workflow w=workflow();
        int invoiceId=((Number)w.call("usp_CreateInvoice",requireActorAccountId(),customerId,null,treatmentPackageId,"[]",null,false).get(0).get("invoiceId")).intValue();
        Map<String,Object> result=w.one("SELECT cp.*,ip.invoice_id FROM CustomerPackage cp JOIN " + bssms_persistence.common.SchemaSql.PACKAGE_SALES + " ip ON ip.customer_package_id=cp.customer_package_id WHERE ip.invoice_id=?",invoiceId);
        result.put("paymentStatus","Unpaid");
        result.put("message","Package invoice created. Pay the invoice before booking sessions. Validity follows TreatmentPackage.validity_days.");return result;
    }

    /**
     * Lấy danh sách CustomerPackage của 1 khách hàng.
     */
    public List<CustomerPackage> getCustomerPackagesByCustomerId(int customerId) {
        try {workflow().customerAccess(customerId);} catch(java.sql.SQLException ex){throw new DataAccessException(ex);}
        requireConnection();
        List<CustomerPackage> list = new ArrayList<>();
        if (conn == null) {
            System.out.println("Database connection is null in CustomerPackageDAO.getCustomerPackagesByCustomerId()");
            return list;
        }
        String sql = "SELECT customer_package_id, customer_id, treatment_package_id, "
                   + "purchase_date, remaining_sessions, expiry_date, status "
                   + "FROM CustomerPackage WHERE customer_id = ? ORDER BY purchase_date DESC";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setInt(1, customerId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                CustomerPackage cp = new CustomerPackage();
                cp.setCustomerPackageId(rs.getInt("customer_package_id"));
                cp.setCustomerId(rs.getInt("customer_id"));
                cp.setTreatmentPackageId(rs.getInt("treatment_package_id"));
                cp.setPurchaseDate(rs.getTimestamp("purchase_date"));
                cp.setRemainingSessions(rs.getInt("remaining_sessions"));
                cp.setExpiryDate(rs.getTimestamp("expiry_date"));
                cp.setStatus(rs.getString("status"));
                list.add(cp);
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return list;
    }

    /**
     * Cập nhật CustomerPackage (remaining_sessions, expiry_date, status).
     * Mở connection mới để tránh trường hợp connection đã đóng.
     */
    public boolean updateCustomerPackage(int customerPackageId, int remainingSessions,
                                         String expiryDate, String status) {
        throw new bssms_persistence.common.WorkflowException(409,"Sessions and status follow completion/refund workflows. Direct package editing is disabled.");
    }
}

