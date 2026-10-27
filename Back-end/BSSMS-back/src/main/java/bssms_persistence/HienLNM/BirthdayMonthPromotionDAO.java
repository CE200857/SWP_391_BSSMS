package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class BirthdayMonthPromotionDAO extends DBContext {

    // Connection riêng cho mỗi operation
    private java.sql.Connection getNewConnection() {
        String dbURL = "jdbc:sqlserver://localhost:1433;"
                + "databaseName=BeautySalonDB;"
                + "user=sa;"
                + "password=123456;"
                + "encrypt=true;trustServerCertificate=true;";
        try {
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
            return java.sql.DriverManager.getConnection(dbURL);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    // Lấy danh sách khách hàng có sinh nhật trong tháng hiện tại
    public List<Map<String, Object>> getBirthdayCustomersThisMonth() {
        List<Map<String, Object>> list = new ArrayList<>();
        String query = "SELECT c.customer_id, c.full_name, c.date_of_birth, c.phone, acc.email "
                     + "FROM " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c LEFT JOIN " + bssms_persistence.common.SchemaSql.ACCOUNTS + " acc ON acc.account_id=c.account_id "
                     + "WHERE MONTH(c.date_of_birth) = MONTH(GETDATE()) "
                     + "ORDER BY DAY(c.date_of_birth) ASC";
        java.sql.Connection newConn = getNewConnection();
        if (newConn == null) {
            System.out.println("BirthdayMonthPromotionDAO: Cannot get new connection for getBirthdayCustomersThisMonth()");
            return list;
        }
        try {
            PreparedStatement ps = newConn.prepareStatement(query);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> map = new HashMap<>();
                map.put("customerId", rs.getInt("customer_id"));
                map.put("fullName", rs.getString("full_name"));
                map.put("dateOfBirth", rs.getDate("date_of_birth") != null ? rs.getDate("date_of_birth").toString() : null);
                map.put("phone", rs.getString("phone"));
                map.put("email", rs.getString("email"));
                list.add(map);
            }
            rs.close();
            ps.close();
            System.out.println("getBirthdayCustomersThisMonth: found " + list.size() + " customers");
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try { newConn.close(); } catch (Exception ex) { ex.printStackTrace(); }
        }
        return list;
    }

    // Lấy tất cả voucher sinh nhật (BDAY-*)
    public List<Map<String, Object>> getAllBirthdayVouchers() {
        List<Map<String, Object>> list = new ArrayList<>();
        String query = "SELECT v.voucher_id, v.customer_id, v.voucher_code, v.voucher_name, "
                     + "v.discount_type, v.discount_value, v.start_date, v.end_date, v.status, "
                     + "c.full_name AS customer_name, c.phone AS customer_phone "
                     + "FROM Voucher v "
                     + "LEFT JOIN " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c ON v.customer_id = c.customer_id "
                     + "WHERE v.voucher_kind='Birthday' "
                     + "ORDER BY v.start_date DESC";
        java.sql.Connection newConn = getNewConnection();
        if (newConn == null) return list;
        try {
            PreparedStatement ps = newConn.prepareStatement(query);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> map = new HashMap<>();
                map.put("voucherId", rs.getInt("voucher_id"));
                map.put("customerId", rs.getInt("customer_id"));
                map.put("voucherCode", rs.getString("voucher_code"));
                map.put("voucherName", rs.getString("voucher_name"));
                map.put("discountType", rs.getString("discount_type"));
                map.put("discountValue", rs.getDouble("discount_value"));
                map.put("startDate", rs.getTimestamp("start_date") != null ? rs.getTimestamp("start_date").toString() : null);
                map.put("endDate", rs.getTimestamp("end_date") != null ? rs.getTimestamp("end_date").toString() : null);
                map.put("status", rs.getString("status"));
                map.put("customerName", rs.getString("customer_name"));
                map.put("customerPhone", rs.getString("customer_phone"));
                list.add(map);
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try { newConn.close(); } catch (Exception ex) { ex.printStackTrace(); }
        }
        return list;
    }

    // Tạo voucher sinh nhật cho 1 khách hàng
    public boolean createBirthdayVoucher(int customerId, String voucherName, double discountPercent, 
                                         String startDate, String endDate) {
<<<<<<< Updated upstream
        String voucherCode = "BDAY-" + customerId + "-" + System.currentTimeMillis() % 100000;
        String query = "INSERT INTO Voucher (customer_id, voucher_code, voucher_name, discount_type, "
                      + "discount_value, start_date, end_date, status) "
                      + "VALUES (?, ?, ?, 'Percent', ?, ?, ?, 'Active')";
        java.sql.Connection newConn = getNewConnection();
        if (newConn == null) return false;
        try {
            PreparedStatement ps = newConn.prepareStatement(query);
            ps.setInt(1, customerId);
            ps.setString(2, voucherCode);
            ps.setString(3, voucherName);
            ps.setDouble(4, discountPercent);
            ps.setString(5, startDate);
            ps.setString(6, endDate);
            int rowsAffected = ps.executeUpdate();
            ps.close();
            System.out.println("createBirthdayVoucher: customerId=" + customerId + ", rows=" + rowsAffected);
            return rowsAffected > 0;
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try { newConn.close(); } catch (Exception ex) { ex.printStackTrace(); }
        }
        return false;
=======
        throw new bssms_persistence.common.WorkflowException(409,"Birthday benefits follow the fixed policy. Use the monthly issue action; they cannot be edited manually.");
>>>>>>> Stashed changes
    }

    // Cập nhật voucher sinh nhật
    public boolean updateBirthdayVoucher(int voucherId, String voucherName, double discountPercent, 
                                        String startDate, String endDate, String status) {
<<<<<<< Updated upstream
        String query = "UPDATE Voucher SET voucher_name = ?, discount_type = 'Percent', discount_value = ?, "
                      + "start_date = ?, end_date = ?, status = ? WHERE voucher_id = ?";
        java.sql.Connection newConn = getNewConnection();
        if (newConn == null) return false;
        try {
            PreparedStatement ps = newConn.prepareStatement(query);
            ps.setString(1, voucherName);
            ps.setDouble(2, discountPercent);
            ps.setString(3, startDate);
            ps.setString(4, endDate);
            ps.setString(5, status);
            ps.setInt(6, voucherId);
            int rowsAffected = ps.executeUpdate();
            ps.close();
            System.out.println("updateBirthdayVoucher: voucherId=" + voucherId + ", rows=" + rowsAffected);
            return rowsAffected > 0;
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try { newConn.close(); } catch (Exception ex) { ex.printStackTrace(); }
        }
        return false;
=======
        throw new bssms_persistence.common.WorkflowException(409,"Birthday benefits follow the fixed policy. Use the monthly issue action; they cannot be edited manually.");
>>>>>>> Stashed changes
    }

    // Xóa voucher sinh nhật
    public boolean deleteBirthdayVoucher(int voucherId) {
<<<<<<< Updated upstream
        String query = "DELETE FROM Voucher WHERE voucher_id = ? AND voucher_code LIKE 'BDAY-%'";
        java.sql.Connection newConn = getNewConnection();
        if (newConn == null) return false;
        try {
            PreparedStatement ps = newConn.prepareStatement(query);
            ps.setInt(1, voucherId);
            int rowsAffected = ps.executeUpdate();
            ps.close();
            System.out.println("deleteBirthdayVoucher: voucherId=" + voucherId + ", rows=" + rowsAffected);
            return rowsAffected > 0;
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try { newConn.close(); } catch (Exception ex) { ex.printStackTrace(); }
        }
        return false;
=======
        throw new bssms_persistence.common.WorkflowException(409,"Birthday benefits follow the fixed policy. Use the monthly issue action; they cannot be edited manually.");
>>>>>>> Stashed changes
    }

    // Tạo voucher sinh nhật hàng loạt cho tất cả khách hàng có sinh nhật trong tháng
    public int createBulkBirthdayVouchers(double discountPercent) {
<<<<<<< Updated upstream
        int count = 0;
        List<Map<String, Object>> customers = getBirthdayCustomersThisMonth();
        String startDate = java.time.LocalDate.now() + " 00:00:00";
        String endDate = java.time.LocalDate.now().plusDays(30) + " 23:59:59";
        String voucherName = "Voucher Sinh Nhật Tháng " + java.time.LocalDate.now().getMonthValue();

        for (Map<String, Object> customer : customers) {
            int customerId = (int) customer.get("customerId");
            if (createBirthdayVoucher(customerId, voucherName, discountPercent, startDate, endDate)) {
                count++;
            }
        }
        return count;
=======
        try {
            bssms_persistence.common.Workflow w=workflow();w.roles("Manager");
            return w.transaction(()->{
                int before=((Number)w.one("SELECT COUNT(*) AS n FROM Voucher WHERE voucher_kind='Birthday'").get("n")).intValue();
                w.call("usp_IssueMonthlyBenefits");
                return ((Number)w.one("SELECT COUNT(*) AS n FROM Voucher WHERE voucher_kind='Birthday'").get("n")).intValue()-before;
            });
        }catch(java.sql.SQLException ex){throw new DataAccessException(ex);}
>>>>>>> Stashed changes
    }

    // Lấy tất cả khách hàng (để chọn tạo voucher sinh nhật)
    public List<Map<String, Object>> getAllCustomersForBirthdayVoucher() {
        List<Map<String, Object>> list = new ArrayList<>();
        String query = "SELECT c.customer_id, c.full_name, c.date_of_birth, c.phone, acc.email "
                     + "FROM " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c LEFT JOIN " + bssms_persistence.common.SchemaSql.ACCOUNTS + " acc ON acc.account_id=c.account_id "
                     + "ORDER BY c.full_name";
        java.sql.Connection newConn = getNewConnection();
        if (newConn == null) {
            System.out.println("=== BirthdayMonthPromotionDAO DEBUG ===");
            System.out.println("getAllCustomersForBirthdayVoucher: Cannot get new connection!");
            System.out.println("getNewConnection() returned: null");
            System.out.println("=====================================");
            return list;
        }
        System.out.println("=== BirthdayMonthPromotionDAO DEBUG ===");
        System.out.println("getAllCustomersForBirthdayVoucher: Connected successfully!");
        try {
            PreparedStatement ps = newConn.prepareStatement(query);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> map = new HashMap<>();
                map.put("customerId", rs.getInt("customer_id"));
                map.put("fullName", rs.getString("full_name"));
                map.put("dateOfBirth", rs.getDate("date_of_birth") != null ? rs.getDate("date_of_birth").toString() : null);
                map.put("phone", rs.getString("phone"));
                map.put("email", rs.getString("email"));
                list.add(map);
            }
            rs.close();
            ps.close();
            System.out.println("getAllCustomersForBirthdayVoucher: found " + list.size() + " customers");
            System.out.println("=====================================");
        } catch (Exception e) {
            System.out.println("getAllCustomersForBirthdayVoucher ERROR: " + e.getMessage());
            e.printStackTrace();
            System.out.println("=====================================");
        } finally {
            try { newConn.close(); } catch (Exception ex) { ex.printStackTrace(); }
        }
        return list;
    }

    // Lấy voucher sinh nhật theo ID
    public Map<String, Object> getBirthdayVoucherById(int voucherId) {
        Map<String, Object> map = new HashMap<>();
        String query = "SELECT v.voucher_id, v.customer_id, v.voucher_code, v.voucher_name, "
                     + "v.discount_type, v.discount_value, v.start_date, v.end_date, v.status, "
                     + "c.full_name AS customer_name, c.phone AS customer_phone "
                     + "FROM Voucher v "
<<<<<<< Updated upstream
                     + "LEFT JOIN Customer c ON v.customer_id = c.customer_id "
                     + "WHERE v.voucher_id = ? AND v.voucher_code LIKE 'BDAY-%'";
        java.sql.Connection newConn = getNewConnection();
=======
                     + "LEFT JOIN " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c ON v.customer_id = c.customer_id "
                     + "WHERE v.voucher_id = ? AND v.voucher_kind='Birthday'";
        java.sql.Connection newConn = conn;
>>>>>>> Stashed changes
        if (newConn == null) return map;
        try {
            PreparedStatement ps = newConn.prepareStatement(query);
            ps.setInt(1, voucherId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                map.put("voucherId", rs.getInt("voucher_id"));
                map.put("customerId", rs.getInt("customer_id"));
                map.put("voucherCode", rs.getString("voucher_code"));
                map.put("voucherName", rs.getString("voucher_name"));
                map.put("discountType", rs.getString("discount_type"));
                map.put("discountValue", rs.getDouble("discount_value"));
                map.put("startDate", rs.getTimestamp("start_date") != null ? rs.getTimestamp("start_date").toString() : null);
                map.put("endDate", rs.getTimestamp("end_date") != null ? rs.getTimestamp("end_date").toString() : null);
                map.put("status", rs.getString("status"));
                map.put("customerName", rs.getString("customer_name"));
                map.put("customerPhone", rs.getString("customer_phone"));
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try { newConn.close(); } catch (Exception ex) { ex.printStackTrace(); }
        }
        return map;
    }
}
