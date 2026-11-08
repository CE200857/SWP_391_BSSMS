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

    /** 3.7: vouchers and birthday-benefit status of the signed-in customer only. */
    public Map<String, Object> myBenefits(int customerId) throws java.sql.SQLException {
        requireConnection();
        workflow().roles("Customer");
        String now = "CONVERT(datetime2,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time')";
        List<Map<String, Object>> vouchers = workflow().query(
            "SELECT voucher_id,voucher_code,voucher_name,voucher_kind,discount_type,discount_value,applicable_category,"
          + "min_order_amount,max_discount,max_uses,used_count,start_date,end_date,"
          + "CASE WHEN status='Active' AND end_date IS NOT NULL AND end_date<" + now + " THEN 'Expired' ELSE status END AS status "
          + "FROM Voucher WHERE customer_id=? AND status IN ('Active','Used','Expired') "
          + "AND (end_date IS NULL OR end_date>=DATEADD(month,-1," + now + ")) "
          + "ORDER BY CASE WHEN status='Active' AND (end_date IS NULL OR end_date>=" + now + ") THEN 0 ELSE 1 END,end_date DESC",
            customerId);
        Map<String, Object> birthday = workflow().one(
            "SELECT CASE WHEN c.date_of_birth IS NOT NULL AND MONTH(c.date_of_birth)=MONTH(" + now + ") THEN 1 ELSE 0 END AS eligible_month,"
          + "CASE WHEN EXISTS(SELECT 1 FROM Invoice i WHERE i.customer_id=c.customer_id AND i.birthday_benefit_year=YEAR(" + now + ")) THEN 1 ELSE 0 END AS used_this_year "
          + "FROM Customer c WHERE c.customer_id=?", customerId);
        Map<String, Object> result = new HashMap<>();
        result.put("vouchers", vouchers);
        result.put("birthdayEligibleThisMonth", ((Number) birthday.get("eligibleMonth")).intValue() == 1);
        result.put("birthdayBenefitUsedThisYear", ((Number) birthday.get("usedThisYear")).intValue() == 1);
        return result;
    }

    // Lấy tất cả voucher
    public List<Map<String, Object>> getAllVouchers() {
        requireConnection();
        List<Map<String, Object>> list = new ArrayList<>();
        String query = "SELECT v.voucher_id, v.customer_id, v.voucher_code, v.voucher_name, "
                     + "v.discount_type, v.discount_value, v.start_date, v.end_date, v.status, "
                     + "c.full_name AS customer_name "
                     + "FROM Voucher v "
                     + "LEFT JOIN " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c ON v.customer_id = c.customer_id "
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
                     + "LEFT JOIN " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c ON v.customer_id = c.customer_id "
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
                ps.setString(4, "Percent".equals(discountType)?"Percentage":discountType);
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
                      + "WHERE voucher_id = ? AND voucher_kind='Manual' AND used_count=0 AND NOT EXISTS(SELECT 1 FROM " + bssms_persistence.common.SchemaSql.REDEMPTIONS + " vr WHERE vr.voucher_id=Voucher.voucher_id)";
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
                ps.setString(4, "Percent".equals(discountType)?"Percentage":discountType);
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

    /** Đổi trạng thái hoạt động / ngừng hoạt động của voucher (mọi loại voucher, trừ voucher đã dùng hoặc hết hạn). */
    public boolean setVoucherStatus(int voucherId, String status) {
        requireConnection();
        if (!"Active".equals(status) && !"Inactive".equals(status)) throw new IllegalArgumentException("Trạng thái phải là Active hoặc Inactive.");
        try (PreparedStatement ps = conn.prepareStatement("UPDATE Voucher SET status=? WHERE voucher_id=? AND status IN ('Active','Inactive')")) {
            ps.setString(1, status);
            ps.setInt(2, voucherId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return false;
    }

    /** Xóa vĩnh viễn voucher thủ công chưa từng được dùng; voucher đã dùng hoặc tự cấp thì dùng "ngừng hoạt động". */
    public boolean deleteVoucher(int voucherId) {
        requireConnection();
        String query = "DELETE FROM Voucher WHERE voucher_id = ? AND voucher_kind='Manual' AND used_count=0 AND NOT EXISTS(SELECT 1 FROM " + bssms_persistence.common.SchemaSql.REDEMPTIONS + " vr WHERE vr.voucher_id=Voucher.voucher_id) AND NOT EXISTS(SELECT 1 FROM Invoice i WHERE i.voucher_id=Voucher.voucher_id)";
        try (PreparedStatement ps = conn.prepareStatement(query)) {
            ps.setInt(1, voucherId);
            return ps.executeUpdate() > 0;
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
