package bssms_persistence.HienLNM;

import bssms_catalog.CustomerPackage;
import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author HienLNM
 */
public class CustomerPackageDAO extends DBContext {

    /**
     * Kiểm tra customer có tồn tại hay không.
     */
    public boolean customerExists(int customerId) {
        if (conn == null) {
            System.out.println("Database connection is null in CustomerPackageDAO.customerExists()");
            return false;
        }
        String sql = "SELECT COUNT(*) FROM Customer WHERE customer_id = ?";
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
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Lấy thông tin gói liệu trình theo id.
     * Trả về Map: packageName, price, numberOfSessions.
     */
    public Map<String, Object> getTreatmentPackageInfo(int treatmentPackageId) {
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
            e.printStackTrace();
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
        if (conn == null) {
            throw new Exception("Database connection is null in CustomerPackageDAO.sellTreatmentPackage()");
        }
        if (expiryMonths <= 0) {
            expiryMonths = 12;
        }

        // 1. Kiểm tra customer tồn tại
        if (!customerExists(customerId)) {
            throw new Exception("Khong tim thay customer voi id = " + customerId);
        }

        // 2. Lấy thông tin gói liệu trình
        Map<String, Object> pkg = getTreatmentPackageInfo(treatmentPackageId);
        if (pkg == null) {
            throw new Exception("Khong tim thay treatment package voi id = " + treatmentPackageId);
        }
        int numberOfSessions = (Integer) pkg.get("numberOfSessions");
        double price = (Double) pkg.get("price");

        try {
            // Tắt auto-commit để dùng transaction
            conn.setAutoCommit(false);

            // 3. INSERT CustomerPackage
            String cpSql = "INSERT INTO CustomerPackage (customer_id, treatment_package_id, "
                         + "purchase_date, remaining_sessions, expiry_date, status) "
                         + "VALUES (?, ?, GETDATE(), ?, DATEADD(MONTH, ?, GETDATE()), 'Active')";
            PreparedStatement psCp = conn.prepareStatement(cpSql, PreparedStatement.RETURN_GENERATED_KEYS);
            psCp.setInt(1, customerId);
            psCp.setInt(2, treatmentPackageId);
            psCp.setInt(3, numberOfSessions);
            psCp.setInt(4, expiryMonths);
            int cpRows = psCp.executeUpdate();
            if (cpRows == 0) {
                conn.rollback();
                psCp.close();
                throw new Exception("Tao CustomerPackage that bai");
            }

            int customerPackageId;
            ResultSet generatedKeys = psCp.getGeneratedKeys();
            if (generatedKeys.next()) {
                customerPackageId = generatedKeys.getInt(1);
            } else {
                conn.rollback();
                generatedKeys.close();
                psCp.close();
                throw new Exception("Khong lay duoc customer_package_id vua tao");
            }
            generatedKeys.close();
            psCp.close();

            // 3.5. INSERT Appointment (mặc định) để làm khóa ngoại cho Invoice
            //      Vì Invoice.appointment_id là FK NOT NULL, cần appointment thật
            String aptSql = "INSERT INTO Appointment (customer_id, service_id, customer_package_id, "
                          + "room_id, bed_id, appointment_date, start_time, end_time, status, notes) "
                          + "VALUES (?, NULL, NULL, NULL, NULL, GETDATE(), GETDATE(), NULL, 'Completed', "
                          + "N'Bán gói liệu trình')";
            PreparedStatement psApt = conn.prepareStatement(aptSql, PreparedStatement.RETURN_GENERATED_KEYS);
            psApt.setInt(1, customerId);
            int aptRows = psApt.executeUpdate();
            if (aptRows == 0) {
                conn.rollback();
                psApt.close();
                throw new Exception("Tao Appointment mac dinh that bai");
            }
            int appointmentId;
            ResultSet aptKeys = psApt.getGeneratedKeys();
            if (aptKeys.next()) {
                appointmentId = aptKeys.getInt(1);
            } else {
                conn.rollback();
                aptKeys.close();
                psApt.close();
                throw new Exception("Khong lay duoc appointment_id vua tao");
            }
            aptKeys.close();
            psApt.close();

            // 3.6. UPDATE Appointment de lien ket voi customer_package vua tao
            String updAptSql = "UPDATE Appointment SET customer_package_id = ? WHERE appointment_id = ?";
            PreparedStatement psUpdApt = conn.prepareStatement(updAptSql);
            psUpdApt.setInt(1, customerPackageId);
            psUpdApt.setInt(2, appointmentId);
            psUpdApt.executeUpdate();
            psUpdApt.close();

            // 4. INSERT Invoice (dung appointment_id vua tao o buoc 3.5)
            //    total_amount = subtotal = price, discount = 0
            String invSql = "INSERT INTO Invoice (appointment_id, voucher_id, invoice_date, "
                          + "subtotal, discount, total_amount, status) "
                          + "VALUES (?, NULL, GETDATE(), ?, 0, ?, 'Unpaid')";
            PreparedStatement psInv = conn.prepareStatement(invSql, PreparedStatement.RETURN_GENERATED_KEYS);
            psInv.setInt(1, appointmentId);
            psInv.setDouble(2, price);
            psInv.setDouble(3, price);
            int invRows = psInv.executeUpdate();
            if (invRows == 0) {
                conn.rollback();
                psInv.close();
                throw new Exception("Tao Invoice that bai");
            }

            int invoiceId;
            ResultSet invKeys = psInv.getGeneratedKeys();
            if (invKeys.next()) {
                invoiceId = invKeys.getInt(1);
            } else {
                conn.rollback();
                invKeys.close();
                psInv.close();
                throw new Exception("Khong lay duoc invoice_id vua tao");
            }
            invKeys.close();
            psInv.close();

            // Commit transaction
            conn.commit();

            Map<String, Object> result = new HashMap<>();
            result.put("customerPackageId", customerPackageId);
            result.put("invoiceId", invoiceId);
            result.put("remainingSessions", numberOfSessions);
            result.put("totalAmount", price);
            result.put("packageName", pkg.get("packageName"));
            return result;
        } catch (Exception e) {
            try {
                conn.rollback();
            } catch (Exception ex) {
                ex.printStackTrace();
            }
            e.printStackTrace();
            throw e;
        } finally {
            try {
                conn.setAutoCommit(true);
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }

    /**
     * Lấy danh sách CustomerPackage của 1 khách hàng.
     */
    public List<CustomerPackage> getCustomerPackagesByCustomerId(int customerId) {
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
            e.printStackTrace();
        }
        return list;
    }
}
