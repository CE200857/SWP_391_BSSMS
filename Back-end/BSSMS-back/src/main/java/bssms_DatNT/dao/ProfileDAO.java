package bssms_DatNT.dao;

import bssms_common.util.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.HashMap;
import java.util.Map;

public class ProfileDAO extends DBContext {

    public Map<String, Object> getProfileByAccountId(int accountId, String role) {
        Map<String, Object> map = new HashMap<>();
        String query = "";
        
        // Nếu là Customer thì JOIN bảng Account với Customer[cite: 17]
        if ("Customer".equals(role)) {
            query = "SELECT a.email, a.phone, a.status, c.full_name, c.date_of_birth, c.gender, c.address "
                  + "FROM Account a JOIN Customer c ON a.account_id = c.account_id "
                  + "WHERE a.account_id = ?";
        } else {
            // Nếu là Nhân viên (Manager, Technician, Receptionist) thì JOIN bảng Account với Staff[cite: 17]
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
}