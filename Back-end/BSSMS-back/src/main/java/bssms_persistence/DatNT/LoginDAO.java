package bssms_persistence.DatNT;

import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.HashMap;
import java.util.Map;

public class LoginDAO extends DBContext {

    public Map<String, Object> authenticateUser(String emailOrPhone, String password) {
        Map<String, Object> userMap = null;
        
        String query = "SELECT a.account_id, a.email, a.status, a.role, "
                     + "c.full_name AS customer_name, "
                     + "s.full_name AS staff_name "
                     + "FROM Account a "
                     + "LEFT JOIN Customer c ON a.account_id = c.account_id "
                     + "LEFT JOIN Staff s ON a.account_id = s.account_id "
                     + "WHERE (a.email = ? OR a.phone = ?) AND a.password = ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                
                ps.setString(1, emailOrPhone); 
                ps.setString(2, emailOrPhone);
                ps.setString(3, password);
                
                ResultSet rs = ps.executeQuery();
                
                if (rs.next()) {
                    userMap = new HashMap<>();
                    userMap.put("accountId", rs.getInt("account_id"));
                    userMap.put("email", rs.getString("email"));
                    userMap.put("status", rs.getString("status"));
                    
                    String role = rs.getString("role");
                    userMap.put("role", role);

                    if ("Customer".equals(role)) {
                        userMap.put("fullName", rs.getString("customer_name"));
                    } else {
                        userMap.put("fullName", rs.getString("staff_name"));
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return userMap;
    }
}