package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class VoucherDAO extends DBContext implements AutoCloseable {

    private void requireConnection() {
        if (conn == null) throw new DataAccessException("Database connection unavailable");
    }
    @Override public void close() throws java.sql.SQLException { if (conn != null) conn.close(); }

    // Lấy tất cả voucher
    public List<Map<String, Object>> getAllVouchers() {
        requireConnection();
        List<Map<String, Object>> list = new ArrayList<>();
        String query = "SELECT v.voucher_id, v.customer_id, v.voucher_code, v.voucher_name, "
                     + "v.discount_type, v.discount_value, v.start_date, v.end_date, v.status, "
                     + "c.full_name AS customer_name "
                     + "FROM Voucher v "
                     + "LEFT JOIN Customer c ON v.customer_id = c.customer_id "
                     + "ORDER BY v.start_date DESC";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
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
                    list.add(map);
                }
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return list;
    }

    // Lấy voucher theo ID
    public Map<String, Object> getVoucherById(int voucherId) {
        requireConnection();
        Map<String, Object> map = new HashMap<>();
        String query = "SELECT v.voucher_id, v.customer_id, v.voucher_code, v.voucher_name, "
                     + "v.discount_type, v.discount_value, v.start_date, v.end_date, v.status, "
                     + "c.full_name AS customer_name "
                     + "FROM Voucher v "
                     + "LEFT JOIN Customer c ON v.customer_id = c.customer_id "
                     + "WHERE v.voucher_id = ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
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
                }
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return map;
    }

    // Tạo voucher mới
    public boolean createVoucher(Integer customerId, String voucherCode, String voucherName, 
                                String discountType, double discountValue, String startDate, String endDate) {
        requireConnection();
        String query = "INSERT INTO Voucher (customer_id, voucher_code, voucher_name, discount_type, "
                      + "discount_value, start_date, end_date, status) "
                      + "VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                if (customerId != null) {
                    ps.setInt(1, customerId);
                } else {
                    ps.setNull(1, java.sql.Types.INTEGER);
                }
                ps.setString(2, voucherCode);
                ps.setString(3, voucherName);
                ps.setString(4, discountType);
                ps.setDouble(5, discountValue);
                ps.setString(6, startDate);
                ps.setString(7, endDate);
                int rowsAffected = ps.executeUpdate();
                return rowsAffected > 0;
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return false;
    }

    // Cập nhật voucher
    public boolean updateVoucher(int voucherId, Integer customerId, String voucherCode, String voucherName, 
                                String discountType, double discountValue, String startDate, String endDate, String status) {
        requireConnection();
        String query = "UPDATE Voucher SET customer_id = ?, voucher_code = ?, voucher_name = ?, "
                      + "discount_type = ?, discount_value = ?, start_date = ?, end_date = ?, status = ? "
                      + "WHERE voucher_id = ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                if (customerId != null) {
                    ps.setInt(1, customerId);
                } else {
                    ps.setNull(1, java.sql.Types.INTEGER);
                }
                ps.setString(2, voucherCode);
                ps.setString(3, voucherName);
                ps.setString(4, discountType);
                ps.setDouble(5, discountValue);
                ps.setString(6, startDate);
                ps.setString(7, endDate);
                ps.setString(8, status);
                ps.setInt(9, voucherId);
                int rowsAffected = ps.executeUpdate();
                return rowsAffected > 0;
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return false;
    }

    // Xóa voucher
    public boolean deleteVoucher(int voucherId) {
        requireConnection();
        String query = "DELETE FROM Voucher WHERE voucher_id = ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setInt(1, voucherId);
                int rowsAffected = ps.executeUpdate();
                return rowsAffected > 0;
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return false;
    }

    // Kiểm tra voucher code đã tồn tại
    public boolean isVoucherCodeExists(String voucherCode, Integer excludeVoucherId) {
        requireConnection();
        String query = "SELECT voucher_id FROM Voucher WHERE voucher_code = ?";
        if (excludeVoucherId != null) {
            query += " AND voucher_id != ?";
        }
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setString(1, voucherCode);
                if (excludeVoucherId != null) {
                    ps.setInt(2, excludeVoucherId);
                }
                ResultSet rs = ps.executeQuery();
                return rs.next();
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return false;
    }
}
