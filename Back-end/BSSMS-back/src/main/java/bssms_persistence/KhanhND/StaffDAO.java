package bssms_persistence.KhanhND;

import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class StaffDAO extends DBContext implements AutoCloseable {

    private void requireConnection() {
        if (conn == null) throw new DataAccessException("Database connection unavailable");
    }
    @Override public void close() throws java.sql.SQLException { if (conn != null) conn.close(); }

    // View Staff Account
    public List<Map<String, Object>> getAllStaffDetails() {
        requireConnection();

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
            DataAccessException.rethrowIfDatabase(e);
        }

        return list;
    }
    // Deactivate Staff Account
    public boolean deactivateStaff(int staffId) {
        requireConnection();

        String query = "UPDATE Account SET status = 'Inactive' "
                + "WHERE account_id = ("
                + "SELECT account_id FROM Staff WHERE staff_id = ?"
                + ")";

        try (PreparedStatement ps = conn.prepareStatement(query)) {
            ps.setInt(1, staffId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            return false;
        }
    }

    // Change Staff Status
    public boolean updateStaffStatus(int accountId, String newStatus) {
        requireConnection();

        String sql = "UPDATE Account SET status = ? WHERE account_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newStatus);
            ps.setInt(2, accountId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            return false;
        }
    }

    //Delete Staff Account
    public boolean deleteStaff(int staffId) {
        String getAccIdSql = "SELECT account_id FROM Staff WHERE staff_id = ?";
        String delStaffServiceSql = "DELETE FROM StaffService WHERE staff_id = ?";
        String delStaffShiftSql = "DELETE FROM StaffShift WHERE staff_id = ?";
        String delAppStaffSql = "DELETE FROM AppointmentStaff WHERE staff_id = ?";
        String delCommissionSql = "DELETE FROM Commission WHERE staff_id = ?";
        String delStaffSql = "DELETE FROM Staff WHERE staff_id = ?";
        String delAccountSql = "DELETE FROM Account WHERE account_id = ?";

        try {
            if (conn != null) {
                conn.setAutoCommit(false);

                int accountId = -1;
                try (PreparedStatement psGet = conn.prepareStatement(getAccIdSql)) {
                    psGet.setInt(1, staffId);
                    try (ResultSet rs = psGet.executeQuery()) {
                        if (rs.next()) {
                            accountId = rs.getInt("account_id");
                        }
                    }
                }

                if (accountId == -1) {
                    conn.rollback();
                    return false;
                }

                try (PreparedStatement ps1 = conn.prepareStatement(delStaffServiceSql)) {
                    ps1.setInt(1, staffId);
                    ps1.executeUpdate();
                }
                try (PreparedStatement ps2 = conn.prepareStatement(delStaffShiftSql)) {
                    ps2.setInt(1, staffId);
                    ps2.executeUpdate();
                }
                try (PreparedStatement ps3 = conn.prepareStatement(delAppStaffSql)) {
                    ps3.setInt(1, staffId);
                    ps3.executeUpdate();
                }
                try (PreparedStatement ps4 = conn.prepareStatement(delCommissionSql)) {
                    ps4.setInt(1, staffId);
                    ps4.executeUpdate();
                }

                try (PreparedStatement psStaff = conn.prepareStatement(delStaffSql)) {
                    psStaff.setInt(1, staffId);
                    psStaff.executeUpdate();
                }

                try (PreparedStatement psAcc = conn.prepareStatement(delAccountSql)) {
                    psAcc.setInt(1, accountId);
                    psAcc.executeUpdate();
                }

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
    
    public boolean assignRole(int accountId, String newRole) {
        requireConnection();
        String updateAccountSql = "UPDATE Account SET role = ? WHERE account_id = ?";
        String updateStaffSql = "UPDATE Staff SET position = ? WHERE account_id = ?";
        
        try {
            if (conn != null) {
                conn.setAutoCommit(false);

                PreparedStatement psAccount = conn.prepareStatement(updateAccountSql);
                psAccount.setString(1, newRole);
                psAccount.setInt(2, accountId);
                psAccount.executeUpdate();

                PreparedStatement psStaff = conn.prepareStatement(updateStaffSql);
                psStaff.setString(1, newRole);
                psStaff.setInt(2, accountId);
                psStaff.executeUpdate();

                conn.commit(); // Hoàn tất Transaction
                return true;
            }
        } catch (Exception e) {
            try {
                if (conn != null) conn.rollback();
            } catch (Exception ex) {
                DataAccessException.rethrowIfDatabase(ex);
            }
            DataAccessException.rethrowIfDatabase(e);
        } finally {
            try {
                if (conn != null) conn.setAutoCommit(true);
            } catch (Exception ex) {
                DataAccessException.rethrowIfDatabase(ex);
            }
        }
        return false;
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
            DataAccessException.rethrowIfDatabase(e);
        }
        return username;
    }
    
    public String createStaff(String baseUsername, String password, String email, String phone, String fullName, String role, double salary) {
        requireConnection();
        String insertAccount = "INSERT INTO Account (username, password, email, phone, status, role) VALUES (?, ?, ?, ?, 'Active', ?)";
        String insertStaff = "INSERT INTO Staff (account_id, full_name, phone, email, position, salary, hire_date) VALUES (?, ?, ?, ?, ?, ?, GETDATE())";

        try {
            if (conn != null) {
                conn.setAutoCommit(false);
                
                String finalUsername = getUniqueUsername(baseUsername);

                PreparedStatement psAcc = conn.prepareStatement(insertAccount, java.sql.Statement.RETURN_GENERATED_KEYS);
                psAcc.setString(1, finalUsername);
                psAcc.setString(2, bssms_security.PasswordUtil.hashMD5(password));
                psAcc.setString(3, email);
                psAcc.setString(4, phone);
                psAcc.setString(5, role);
                psAcc.executeUpdate();

                ResultSet rs = psAcc.getGeneratedKeys();
                int accountId = -1;
                if (rs.next()) {
                    accountId = rs.getInt(1);
                }

                if (accountId != -1) {
                    PreparedStatement psStaff = conn.prepareStatement(insertStaff);
                    psStaff.setInt(1, accountId);
                    psStaff.setString(2, fullName);
                    psStaff.setString(3, phone);
                    psStaff.setString(4, email);
                    psStaff.setString(5, role);
                    psStaff.setDouble(6, salary);
                    psStaff.executeUpdate();
                }

                conn.commit();
                return finalUsername;
            }
        } catch (Exception e) {
            try { if (conn != null) conn.rollback(); } catch (Exception ex) { DataAccessException.rethrowIfDatabase(ex); }
            DataAccessException.rethrowIfDatabase(e);
        } finally {
            try { if (conn != null) conn.setAutoCommit(true); } catch (Exception ex) { DataAccessException.rethrowIfDatabase(ex); }
        }
        return null;
    }
    
    public Map<String, Object> getStaffById(int staffId) {
        requireConnection();
        Map<String, Object> map = new HashMap<>();
        
        String query = "SELECT s.staff_id, s.account_id, a.username, a.password, s.full_name, "
                     + "a.email, a.phone, a.status, a.role, s.salary, s.hire_date "
                     + "FROM Staff s "
                     + "JOIN Account a ON s.account_id = a.account_id "
                     + "WHERE s.staff_id = ?";
                     
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setInt(1, staffId);
                ResultSet rs = ps.executeQuery();
                
                if (rs.next()) {
                    map.put("staffId", rs.getInt("staff_id"));
                    map.put("accountId", rs.getInt("account_id"));
                    map.put("username", rs.getString("username"));
                    map.put("password", rs.getString("password"));
                    map.put("fullName", rs.getString("full_name"));
                    map.put("email", rs.getString("email"));
                    map.put("phone", rs.getString("phone"));
                    map.put("status", rs.getString("status"));
                    map.put("role", rs.getString("role"));
                    map.put("salary", rs.getDouble("salary"));
                    
                    java.sql.Date hireDate = rs.getDate("hire_date");
                    map.put("hireDate", hireDate != null ? hireDate.toString() : "");
                }
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return map;
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
    
    public boolean updateStaff(int accountId, String fullName, String phone, String email, String role, String hireDate, double salary, String username, String hashedPassword) {
        requireConnection();
        String updateAccountSql = hashedPassword != null && !hashedPassword.isEmpty() 
                ? "UPDATE Account SET phone = ?, email = ?, role = ?, username = ?, password = ? WHERE account_id = ?"
                : "UPDATE Account SET phone = ?, email = ?, role = ?, username = ? WHERE account_id = ?";
                
        String updateStaffSql = "UPDATE Staff SET full_name = ?, phone = ?, email = ?, position = ?, hire_date = ?, salary = ? WHERE account_id = ?";

        try {
            if (conn != null) {
                conn.setAutoCommit(false);
                
                PreparedStatement psAccount = conn.prepareStatement(updateAccountSql);
                psAccount.setString(1, phone);
                psAccount.setString(2, email);
                psAccount.setString(3, role);
                psAccount.setString(4, username);
                
                if (hashedPassword != null && !hashedPassword.isEmpty()) {
                    psAccount.setString(5, hashedPassword);
                    psAccount.setInt(6, accountId);
                } else {
                    psAccount.setInt(5, accountId);
                }
                psAccount.executeUpdate();

                PreparedStatement psStaff = conn.prepareStatement(updateStaffSql);
                psStaff.setString(1, fullName);
                psStaff.setString(2, phone);
                psStaff.setString(3, email);
                psStaff.setString(4, role);
                
                if (hireDate != null && !hireDate.trim().isEmpty()) {
                    psStaff.setDate(5, java.sql.Date.valueOf(hireDate.trim()));
                } else {
                    psStaff.setNull(5, java.sql.Types.DATE);
                }
                
                psStaff.setDouble(6, salary);
                psStaff.setInt(7, accountId);
                psStaff.executeUpdate();

                conn.commit();
                return true;
            }
        } catch (Exception e) {
            try { if (conn != null) conn.rollback(); } catch (Exception ex) { DataAccessException.rethrowIfDatabase(ex); }
            DataAccessException.rethrowIfDatabase(e);
        } finally {
            try { if (conn != null) conn.setAutoCommit(true); } catch (Exception ex) { DataAccessException.rethrowIfDatabase(ex); }
        }
        return false;
    }
}