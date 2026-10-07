package bssms_persistence.DatNT;

import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

public class ProfileDAO extends DBContext {

    public Map<String, Object> getProfileByAccountId(int accountId, String role) {
        Map<String, Object> map = new HashMap<>();
        String query = "";
        
        if ("Customer".equals(role)) {
            query = "SELECT a.email, a.phone, a.status, c.full_name, c.date_of_birth, c.gender, c.address "
                  + "FROM Account a JOIN Customer c ON a.account_id = c.account_id "
                  + "WHERE a.account_id = ?";
        } else {
            query = "SELECT a.email, a.status, s.full_name, s.phone, s.position AS role "
                  + "FROM Account a JOIN Staff s ON a.account_id = s.account_id "
                  + "WHERE a.account_id = ?";
        }
        
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setInt(1, accountId);
                ResultSet rs = ps.executeQuery();
                
                if (rs.next()) {
                    map.put("email", rs.getString("email"));
                    map.put("phone", rs.getString("phone"));
                    map.put("status", rs.getString("status"));
                    map.put("fullName", rs.getString("full_name"));
                    
                    if ("Customer".equals(role)) {
                        map.put("dob", rs.getDate("date_of_birth"));
                        map.put("gender", rs.getString("gender"));
                        map.put("address", rs.getString("address"));
                        map.put("role", "Customer");
                    } else {
                        map.put("role", rs.getString("role"));
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return map;
    }
    
    public boolean createCustomerProfile(int accountId, String fullName, String dob, String gender, String phone, String address) {
        String updateAccountSql = "UPDATE Account SET phone = ? WHERE account_id = ?";
        String insertCustomerSql = "INSERT INTO Customer (account_id, membership_tier_id, full_name, date_of_birth, gender, address) VALUES (?, 1, ?, ?, ?, ?)";
        
        try {
            if (conn != null) {
                conn.setAutoCommit(false); // Bật Transaction

                // Cập nhật SĐT vào bảng Account
                PreparedStatement psAccount = conn.prepareStatement(updateAccountSql);
                psAccount.setString(1, phone);
                psAccount.setInt(2, accountId);
                psAccount.executeUpdate();

                // Thêm thông tin vào bảng Customer (membership_tier_id = 1 là Member)
                PreparedStatement psCustomer = conn.prepareStatement(insertCustomerSql);
                psCustomer.setInt(1, accountId);
                psCustomer.setString(2, fullName);
                psCustomer.setString(3, dob);
                psCustomer.setString(4, gender);
                psCustomer.setString(5, address);
                psCustomer.executeUpdate();

                conn.commit(); // Xác nhận lưu dữ liệu
                return true;
            }
        } catch (Exception e) {
            try {
                if (conn != null) conn.rollback(); // Hủy bỏ nếu có lỗi
            } catch (SQLException ex) {
                ex.printStackTrace();
            }
            e.printStackTrace();
        } finally {
            try {
                if (conn != null) conn.setAutoCommit(true);
            } catch (SQLException ex) {
                ex.printStackTrace();
            }
        }
        return false;
    }
}