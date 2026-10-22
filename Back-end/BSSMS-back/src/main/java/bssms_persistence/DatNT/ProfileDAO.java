package bssms_persistence.DatNT;

import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

public class ProfileDAO extends DBContext implements AutoCloseable {

    private void requireConnection() {
        if (conn == null) throw new DataAccessException("Database connection unavailable");
    }
    @Override public void close() throws java.sql.SQLException { if (conn != null) conn.close(); }

    public Map<String, Object> getProfileByAccountId(int accountId, String role) {
        requireConnection();
        Map<String, Object> map = new HashMap<>();
        String query = "";

        if ("Customer".equals(role)) {
            query = "SELECT a.username, a.email, a.phone, a.status, c.full_name, c.date_of_birth, c.gender, c.address "
                    + "FROM Account a JOIN Customer c ON a.account_id = c.account_id "
                    + "WHERE a.account_id = ?";
        } else {
            query = "SELECT a.username, a.email, a.status, s.full_name, s.phone, s.position AS role "
                    + "FROM Account a JOIN Staff s ON a.account_id = s.account_id "
                    + "WHERE a.account_id = ?";
        }

        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setInt(1, accountId);
                ResultSet rs = ps.executeQuery();

                if (rs.next()) {
                    map.put("username", rs.getString("username"));
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
            DataAccessException.rethrowIfDatabase(e);
        }
        return map;
    }

    public boolean isUsernameTaken(String username, int currentAccountId) {
        requireConnection();
        String sql = "SELECT account_id FROM Account WHERE username = ? AND account_id != ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setString(1, username);
                ps.setInt(2, currentAccountId);
                ResultSet rs = ps.executeQuery();
                return rs.next();
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return false;
    }

    public boolean createCustomerProfile(int accountId, String fullName, String dob, String gender, String phone, String address) {
        requireConnection();
        String updateAccountSql = "UPDATE Account SET phone = ? WHERE account_id = ?";
        String insertCustomerSql = "INSERT INTO Customer (account_id, membership_tier_id, full_name, date_of_birth, gender, address, phone) VALUES (?, 1, ?, ?, ?, ?, ?)";

        try {
            if (conn != null) {
                conn.setAutoCommit(false);

                PreparedStatement psAccount = conn.prepareStatement(updateAccountSql);
                psAccount.setString(1, phone);
                psAccount.setInt(2, accountId);
                psAccount.executeUpdate();

                PreparedStatement psCustomer = conn.prepareStatement(insertCustomerSql);
                psCustomer.setInt(1, accountId);
                psCustomer.setString(2, fullName);
                psCustomer.setString(3, dob);
                psCustomer.setString(4, gender);
                psCustomer.setString(5, address);
                psCustomer.setString(6, phone);
                psCustomer.executeUpdate();

                conn.commit();
                return true;
            }
        } catch (Exception e) {
            try {
                if (conn != null) {
                    conn.rollback();
                }
            } catch (SQLException ex) {
                DataAccessException.rethrowIfDatabase(ex);
            }
            DataAccessException.rethrowIfDatabase(e);
        } finally {
            try {
                if (conn != null) {
                    conn.setAutoCommit(true);
                }
            } catch (SQLException ex) {
                DataAccessException.rethrowIfDatabase(ex);
            }
        }
        return false;
    }

    public boolean updateCustomerProfile(int accountId, String fullName, String dob, String gender, String phone, String address, String username, String email) {
        requireConnection();
        String updateAccountSql = "UPDATE Account SET phone = ?, username = ?, email = ? WHERE account_id = ?";
        String updateCustomerSql = "UPDATE Customer SET full_name = ?, date_of_birth = ?, gender = ?, address = ?, phone = ? WHERE account_id = ?";

        try {
            if (conn != null) {
                conn.setAutoCommit(false);

                PreparedStatement psAccount = conn.prepareStatement(updateAccountSql);
                psAccount.setString(1, phone);
                psAccount.setString(2, username);
                psAccount.setString(3, email);
                psAccount.setInt(4, accountId);
                psAccount.executeUpdate();

                PreparedStatement psCustomer = conn.prepareStatement(updateCustomerSql);
                psCustomer.setString(1, fullName);
                psCustomer.setString(2, dob);
                psCustomer.setString(3, gender);
                psCustomer.setString(4, address);
                psCustomer.setString(5, phone);
                psCustomer.setInt(6, accountId);
                psCustomer.executeUpdate();

                conn.commit();
                return true;
            }
        } catch (Exception e) {
            try {
                if (conn != null) {
                    conn.rollback();
                }
            } catch (SQLException ex) {
                DataAccessException.rethrowIfDatabase(ex);
            }
            DataAccessException.rethrowIfDatabase(e);
        } finally {
            try {
                if (conn != null) {
                    conn.setAutoCommit(true);
                }
            } catch (SQLException ex) {
                DataAccessException.rethrowIfDatabase(ex);
            }
        }
        return false;
    }

    public boolean updateStaffProfile(int accountId, String fullName, String phone, String username) {
        requireConnection();
        String updateAccountSql = "UPDATE Account SET phone = ?, username = ? WHERE account_id = ?";
        String updateStaffSql = "UPDATE Staff SET full_name = ?, phone = ? WHERE account_id = ?";

        try {
            if (conn != null) {
                conn.setAutoCommit(false);

                PreparedStatement psAccount = conn.prepareStatement(updateAccountSql);
                psAccount.setString(1, phone);
                psAccount.setString(2, username);
                psAccount.setInt(3, accountId);
                psAccount.executeUpdate();

                PreparedStatement psStaff = conn.prepareStatement(updateStaffSql);
                psStaff.setString(1, fullName);
                psStaff.setString(2, phone);
                psStaff.setInt(3, accountId);
                psStaff.executeUpdate();

                conn.commit();
                return true;
            }
        } catch (Exception e) {
            try {
                if (conn != null) {
                    conn.rollback();
                }
            } catch (SQLException ex) {
                DataAccessException.rethrowIfDatabase(ex);
            }
            DataAccessException.rethrowIfDatabase(e);
        } finally {
            try {
                if (conn != null) {
                    conn.setAutoCommit(true);
                }
            } catch (SQLException ex) {
                DataAccessException.rethrowIfDatabase(ex);
            }
        }
        return false;
    }
    
    public String checkDuplicate(String username, String email, String phone, Integer excludeAccountId) {
        requireConnection();
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
            DataAccessException.rethrowIfDatabase(e);
        }
        return null;
    }
}
