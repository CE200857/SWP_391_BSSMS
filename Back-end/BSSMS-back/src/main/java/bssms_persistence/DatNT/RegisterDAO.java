package bssms_persistence.DatNT;

import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class RegisterDAO extends DBContext {

    public String checkDuplicate(String username, String email, String phone, Integer excludeAccountId) {
        String sql = "SELECT username, email, phone FROM Account WHERE (username = ? OR email = ? OR phone = ?)";
        
        if (excludeAccountId != null) {
            sql += " AND account_id != ?";
        }
        
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setString(1, username);
                ps.setString(2, email);
                ps.setString(3, phone);
                
                if (excludeAccountId != null) {
                    ps.setInt(4, excludeAccountId);
                }
                
                ResultSet rs = ps.executeQuery();
                
                if (rs.next()) {
                    String dbUsername = rs.getString("username");
                    String dbEmail = rs.getString("email");
                    String dbPhone = rs.getString("phone");
                    
                    if (username != null && username.equalsIgnoreCase(dbUsername)) {
                        return "Tên đăng nhập (Username)";
                    }
                    if (phone != null && phone.equals(dbPhone)) {
                        return "Số điện thoại";
                    }
                    if (email != null && email.equalsIgnoreCase(dbEmail)) {
                        return "Email";
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean createAccount(String username, String password, String email) {
        String sql = "INSERT INTO Account (username, password, email, status, role) VALUES (?, ?, ?, 'Active', 'Customer')";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setString(1, username);
                ps.setString(2, password);
                ps.setString(3, email);

                int rowsAffected = ps.executeUpdate();
                return rowsAffected > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }
}