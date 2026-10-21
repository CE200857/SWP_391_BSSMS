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
                
                String finalUsername = getUniqueUsername(username);

                PreparedStatement psAcc = conn.prepareStatement(insertAccount, java.sql.Statement.RETURN_GENERATED_KEYS);
                psAcc.setString(1, finalUsername);
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
    
    public Map<String, Object> getCustomerById(int customerId) {
        Map<String, Object> map = new HashMap<>();
        
        String query = "SELECT c.customer_id, c.account_id, c.full_name, c.gender, "
                     + "c.date_of_birth, c.address, a.phone, a.email, a.status, a.username "
                     + "FROM Customer c "
                     + "JOIN Account a ON c.account_id = a.account_id "
                     + "WHERE c.customer_id = ?";
                     
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setInt(1, customerId);
                ResultSet rs = ps.executeQuery();
                
                if (rs.next()) {
                    map.put("customerId", rs.getInt("customer_id"));
                    map.put("accountId", rs.getInt("account_id"));
                    map.put("fullName", rs.getString("full_name"));
                    map.put("phone", rs.getString("phone"));
                    map.put("email", rs.getString("email"));
                    map.put("status", rs.getString("status"));
                    map.put("gender", rs.getString("gender"));
                    map.put("address", rs.getString("address"));
                    map.put("username", rs.getString("username"));
                    
                    java.sql.Date dob = rs.getDate("date_of_birth");
                    if (dob != null) {
                        map.put("dob", dob.toString());
                    } else {
                        map.put("dob", "");
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return map;
    }
    
    public boolean updateCustomer(int accountId, String fullName, String phone, String email, String gender, String dob, String address, String status) {
        String updateAccountSql = "UPDATE Account SET phone = ?, email = ?, status = ? WHERE account_id = ?";
        String updateCustomerSql = "UPDATE Customer SET full_name = ?, gender = ?, date_of_birth = ?, address = ? WHERE account_id = ?";
        
        try {
            if (conn != null) {
                conn.setAutoCommit(false);
               
                PreparedStatement psAccount = conn.prepareStatement(updateAccountSql);
                psAccount.setString(1, phone);
                psAccount.setString(2, email);
                psAccount.setString(3, status);
                psAccount.setInt(4, accountId);
                psAccount.executeUpdate();

                PreparedStatement psCustomer = conn.prepareStatement(updateCustomerSql);
                psCustomer.setString(1, fullName);
                psCustomer.setString(2, gender);
                
                if (dob != null && !dob.trim().isEmpty() && !dob.equals("null")) {
                    try {
                        psCustomer.setDate(3, java.sql.Date.valueOf(dob.trim()));
                    } catch (IllegalArgumentException e) {
                        psCustomer.setNull(3, java.sql.Types.DATE);
                    }
                } else {
                    psCustomer.setNull(3, java.sql.Types.DATE);
                }
                
                psCustomer.setString(4, address);
                psCustomer.setInt(5, accountId);
                psCustomer.executeUpdate();

                conn.commit();
                return true;
            }
        } catch (Exception e) {
            try {
                if (conn != null) conn.rollback();
            } catch (Exception ex) {
                ex.printStackTrace();
            }
            e.printStackTrace();
        } finally {
            try {
                if (conn != null) conn.setAutoCommit(true);
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
        return false;
    }
    
    public String checkDuplicate(String username, String email, String phone, Integer excludeAccountId) {
        if (username != null && username.trim().isEmpty()) username = null;
        if (email != null && email.trim().isEmpty()) email = null;
        if (phone != null && phone.trim().isEmpty()) phone = null;
        
        if (email != null && email.equalsIgnoreCase(bssms_security.EmailUtil.FROM_EMAIL)) {
            return "Email (Trùng với email hệ thống)";
        }

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
                
                while (rs.next()) {
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
    
    private String getUniqueUsername(String baseUsername) {
        String username = baseUsername;
        int counter = 1;
        String checkSql = "SELECT account_id FROM Account WHERE username = ?";
        try {
            if (conn != null) {
                while (true) {
                    PreparedStatement ps = conn.prepareStatement(checkSql);
                    ps.setString(1, username);
                    ResultSet rs = ps.executeQuery();
                    if (!rs.next()) {
                        break;
                    }
                    username = baseUsername + counter;
                    counter++;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return username;
    }
}
