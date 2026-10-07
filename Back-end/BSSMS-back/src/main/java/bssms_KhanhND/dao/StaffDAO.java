package bssms_KhanhND.dao;

import bssms_common.util.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class StaffDAO extends DBContext {

    // View Staff Account
    public List<Map<String, Object>> getAllStaffDetails() {

        List<Map<String, Object>> list = new ArrayList<>();

        String query = "SELECT s.staff_id, s.account_id, "
                + "a.username, s.full_name, a.phone, "
                + "a.email, s.position, s.salary, "
                + "s.hire_date, a.status "
                + "FROM Staff s "
                + "JOIN Account a ON s.account_id = a.account_id";

        try {
            if (conn != null) {

                PreparedStatement ps = conn.prepareStatement(query);
                ResultSet rs = ps.executeQuery();

                while (rs.next()) {

                    Map<String, Object> map = new HashMap<>();

                    map.put("staffId", rs.getInt("staff_id"));
                    map.put("accountId", rs.getInt("account_id"));
                    map.put("username", rs.getString("username"));
                    map.put("fullName", rs.getString("full_name"));
                    map.put("phone", rs.getString("phone"));
                    map.put("email", rs.getString("email"));
                    map.put("position", rs.getString("position"));
                    map.put("salary", rs.getDouble("salary"));
                    map.put("hireDate", rs.getDate("hire_date"));
                    map.put("status", rs.getString("status"));

                    list.add(map);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return list;
    }

    // Deactivate Staff Account
    public boolean deactivateStaff(int staffId) {

        String query = "UPDATE Account SET status = 'Inactive' "
                + "WHERE account_id = ("
                + "SELECT account_id FROM Staff WHERE staff_id = ?"
                + ")";

        try {
            if (conn != null) {

                PreparedStatement ps = conn.prepareStatement(query);
                ps.setInt(1, staffId);

                int rowsAffected = ps.executeUpdate();

                return rowsAffected > 0;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return false;
    }
}