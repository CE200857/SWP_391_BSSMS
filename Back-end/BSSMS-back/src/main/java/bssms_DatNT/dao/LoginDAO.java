package bssms_DatNT.dao;

import bssms_common.util.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.HashMap;
import java.util.Map;

public class LoginDAO extends DBContext {

    public Map<String, Object> authenticateUser(String email, String password) {
        Map<String, Object> userMap = null;
        // Thực hiện JOIN bảng Account với Customer và Staff để lấy Họ tên và Chức vụ (Role)[cite: 23]
        String query = "SELECT a.account_id, a.email, a.status, "
                     + "c.full_name AS customer_name, "
                     + "s.full_name AS staff_name, s.position "
                     + "FROM Account a "
                     + "LEFT JOIN Customer c ON a.account_id = c.account_id "
                     + "LEFT JOIN Staff s ON a.account_id = s.account_id "
                     + "WHERE a.email = ? AND a.password = ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setString(1, email);
                ps.setString(2, password);
                ResultSet rs = ps.executeQuery();
                
                if (rs.next()) {
                    userMap = new HashMap<>();
                    userMap.put("accountId", rs.getInt("account_id"));
                    userMap.put("email", rs.getString("email"));
                    userMap.put("status", rs.getString("status"));

                    // Phân loại role và tên hiển thị dựa vào bảng chứa dữ liệu[cite: 23]
                    String position = rs.getString("position");
                    if (position != null) {
                        // Nếu có position ở bảng Staff -> Đây là nhân viên
                        userMap.put("role", position); 
                        userMap.put("fullName", rs.getString("staff_name"));
                    } else {
                        // Nếu không, đây là Customer
                        userMap.put("role", "Customer");
                        userMap.put("fullName", rs.getString("customer_name"));
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return userMap;
    }
}