package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class BirthdayMonthPromotionDAO extends DBContext implements AutoCloseable {

    private void requireConnection() {
        if (conn == null) throw new DataAccessException("Database connection unavailable");
    }
    @Override public void close() throws java.sql.SQLException { if (conn != null) conn.close(); }

    // Lấy danh sách khách hàng có sinh nhật trong tháng hiện tại
    public List<Map<String, Object>> getBirthdayCustomersThisMonth() {
        requireConnection();
        List<Map<String, Object>> list = new ArrayList<>();
        String query = "SELECT c.customer_id, c.full_name, c.date_of_birth, c.phone, c.email "
                     + "FROM Customer c "
                     + "WHERE MONTH(c.date_of_birth) = MONTH(GETDATE()) "
                     + "ORDER BY DAY(c.date_of_birth) ASC";
        java.sql.Connection newConn = conn;
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
            DataAccessException.rethrowIfDatabase(e);
        }
        return list;
    }

    // Lấy tất cả voucher sinh nhật (BDAY-*)
    public List<Map<String, Object>> getAllBirthdayVouchers() {
        requireConnection();
        List<Map<String, Object>> list = new ArrayList<>();
        String query = "SELECT v.voucher_id, v.customer_id, v.voucher_code, v.voucher_name, "
                     + "v.discount_type, v.discount_value, v.start_date, v.end_date, v.status, "
                     + "c.full_name AS customer_name, c.phone AS customer_phone "
                     + "FROM Voucher v "
                     + "LEFT JOIN Customer c ON v.customer_id = c.customer_id "
                     + "WHERE v.voucher_code LIKE 'BDAY-%' "
                     + "ORDER BY v.start_date DESC";
        java.sql.Connection newConn = conn;
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
            DataAccessException.rethrowIfDatabase(e);
        }
        return list;
    }

    // Tạo voucher sinh nhật cho 1 khách hàng
    public boolean createBirthdayVoucher(int customerId, String voucherName, double discountPercent, 
                                         String startDate, String endDate) {
        requireConnection();
        String voucherCode = "BDAY-" + customerId + "-" + System.currentTimeMillis() % 100000;
        String query = "INSERT INTO Voucher (customer_id, voucher_code, voucher_name, discount_type, "
                      + "discount_value, start_date, end_date, status) "
                      + "VALUES (?, ?, ?, 'Percent', ?, ?, ?, 'Active')";
        java.sql.Connection newConn = conn;
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
            DataAccessException.rethrowIfDatabase(e);
        }
        return false;
    }

    // Cập nhật voucher sinh nhật
    public boolean updateBirthdayVoucher(int voucherId, String voucherName, double discountPercent, 
                                        String startDate, String endDate, String status) {
        requireConnection();
        String query = "UPDATE Voucher SET voucher_name = ?, discount_type = 'Percent', discount_value = ?, "
                      + "start_date = ?, end_date = ?, status = ? WHERE voucher_id = ?";
        java.sql.Connection newConn = conn;
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
            DataAccessException.rethrowIfDatabase(e);
        }
        return false;
    }

    // Xóa voucher sinh nhật
    public boolean deleteBirthdayVoucher(int voucherId) {
        requireConnection();
        String query = "DELETE FROM Voucher WHERE voucher_id = ? AND voucher_code LIKE 'BDAY-%'";
        java.sql.Connection newConn = conn;
        if (newConn == null) return false;
        try {
            PreparedStatement ps = newConn.prepareStatement(query);
            ps.setInt(1, voucherId);
            int rowsAffected = ps.executeUpdate();
            ps.close();
            System.out.println("deleteBirthdayVoucher: voucherId=" + voucherId + ", rows=" + rowsAffected);
            return rowsAffected > 0;
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return false;
    }

    // Tạo voucher sinh nhật hàng loạt cho tất cả khách hàng có sinh nhật trong tháng
    public int createBulkBirthdayVouchers(double discountPercent) {
        requireConnection();
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
    }

    // Lấy tất cả khách hàng (để chọn tạo voucher sinh nhật)
    public List<Map<String, Object>> getAllCustomersForBirthdayVoucher() {
        requireConnection();
        List<Map<String, Object>> list = new ArrayList<>();
        String query = "SELECT c.customer_id, c.full_name, c.date_of_birth, c.phone, c.email "
                     + "FROM Customer c "
                     + "ORDER BY c.full_name";
        java.sql.Connection newConn = conn;
        if (newConn == null) {
            System.out.println("=== BirthdayMonthPromotionDAO DEBUG ===");
            System.out.println("getAllCustomersForBirthdayVoucher: Cannot get new connection!");
            System.out.println("conn returned: null");
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
            DataAccessException.rethrowIfDatabase(e);
            System.out.println("=====================================");
        }
        return list;
    }

    // Lấy voucher sinh nhật theo ID
    public Map<String, Object> getBirthdayVoucherById(int voucherId) {
        requireConnection();
        Map<String, Object> map = new HashMap<>();
        String query = "SELECT v.voucher_id, v.customer_id, v.voucher_code, v.voucher_name, "
                     + "v.discount_type, v.discount_value, v.start_date, v.end_date, v.status, "
                     + "c.full_name AS customer_name, c.phone AS customer_phone "
                     + "FROM Voucher v "
                     + "LEFT JOIN Customer c ON v.customer_id = c.customer_id "
                     + "WHERE v.voucher_id = ? AND v.voucher_code LIKE 'BDAY-%'";
        java.sql.Connection newConn = conn;
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
            DataAccessException.rethrowIfDatabase(e);
        }
        return map;
    }
}
