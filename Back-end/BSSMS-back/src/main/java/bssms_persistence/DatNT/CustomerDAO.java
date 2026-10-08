package bssms_persistence.DatNT;

import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CustomerDAO extends DBContext {

    public List<Map<String, Object>> getAllCustomerDetails() {
        List<Map<String, Object>> list = new ArrayList<>();
        String query = "SELECT c.customer_id, c.full_name, a.phone, a.email, a.status "
                     + "FROM Customer c "
                     + "JOIN Account a ON c.account_id = a.account_id";
        try {
            if (conn != null) { 
                PreparedStatement ps = conn.prepareStatement(query);
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("customerId", rs.getInt("customer_id"));
                    map.put("fullName", rs.getString("full_name"));
                    map.put("phone", rs.getString("phone"));
                    map.put("email", rs.getString("email"));
                    map.put("status", rs.getString("status"));

                    list.add(map);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public boolean deactivateCustomer(int customerId) {
        String query = "UPDATE Account SET status = 'Inactive' "
                + "WHERE account_id = (SELECT account_id FROM Customer WHERE customer_id = ?)";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setInt(1, customerId);
                int rowsAffected = ps.executeUpdate();
                return rowsAffected > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }
    
    public boolean createWalkInCustomer(String username, String password, String email, String phone, String fullName, String dob, String gender) {
        String insertAccount = "INSERT INTO Account (username, password, email, phone, status, role) VALUES (?, ?, ?, ?, 'Active', 'Customer')";
        String insertCustomer = "INSERT INTO Customer (account_id, membership_tier_id, full_name, date_of_birth, gender, phone) VALUES (?, 1, ?, ?, ?, ?)";

        try {
            if (conn != null) {
                conn.setAutoCommit(false);

                PreparedStatement psAcc = conn.prepareStatement(insertAccount, java.sql.Statement.RETURN_GENERATED_KEYS);
                psAcc.setString(1, username);
                psAcc.setString(2, bssms_security.PasswordUtil.hashMD5(password));
                psAcc.setString(3, email);
                psAcc.setString(4, phone);
                psAcc.executeUpdate();

                ResultSet rs = psAcc.getGeneratedKeys();
                int accountId = -1;
                if (rs.next()) {
                    accountId = rs.getInt(1);
                }

                if (accountId != -1) {
                    PreparedStatement psCus = conn.prepareStatement(insertCustomer);
                    psCus.setInt(1, accountId);
                    psCus.setString(2, fullName);
                    psCus.setString(3, dob);
                    psCus.setString(4, gender);
                    psCus.setString(5, phone);
                    psCus.executeUpdate();
                }

                conn.commit();
                return true;
            }
        } catch (Exception e) {
            try { if (conn != null) conn.rollback(); } catch (Exception ex) { ex.printStackTrace(); }
            e.printStackTrace();
        } finally {
            try { if (conn != null) conn.setAutoCommit(true); } catch (Exception ex) { ex.printStackTrace(); }
        }
        return false;
    }
}
