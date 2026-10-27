package bssms_persistence.KhanhND;

import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import bssms_account.*;
import java.util.List;


public class StaffDAO extends DBContext implements AutoCloseable {

    private void requireConnection() {
        if (conn == null) throw new DataAccessException("Database connection unavailable");
        try { workflow().roles("Manager"); } catch(java.sql.SQLException e) { throw new DataAccessException(e); }
    }
    @Override public void close() throws java.sql.SQLException { if (conn != null) conn.close(); }

    // View Staff Account
    public List<Staff> getAllStaffDetails() {
        requireConnection();

        List<Staff> list = new ArrayList<>();

        String query = "SELECT s.staff_id, s.account_id, "
                + "a.username, s.full_name, a.phone, "
                + "a.email, s.position, s.salary, "
                + "s.hire_date, a.status "
                + "FROM " + bssms_persistence.common.SchemaSql.STAFF + " s "
                + "JOIN " + bssms_persistence.common.SchemaSql.ACCOUNTS + " a ON s.account_id = a.account_id";

        try {
            if (conn != null) {

                PreparedStatement ps = conn.prepareStatement(query);
                ResultSet rs = ps.executeQuery();

                while (rs.next()) {

                    Staff value = new Staff();

                    value.setStaffId(rs.getInt("staff_id"));
                    value.setAccountId(rs.getInt("account_id"));
                    value.setUsername(rs.getString("username"));
                    value.setFullName(rs.getString("full_name"));
                    value.setPhone(rs.getString("phone"));
                    value.setEmail(rs.getString("email"));
                    value.setPosition(rs.getString("position"));
                    value.setSalary(rs.getBigDecimal("salary"));
                    value.setHireDate(rs.getString("hire_date"));
                    value.setStatus(rs.getString("status"));

                    list.add(value);
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
        try {
            return new bssms_persistence.common.Workflow(conn,0).update("UPDATE Staff SET status='Inactive' WHERE staff_id=?", staffId) == 1;
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }

    // Change Staff Status
    public boolean updateStaffStatus(int accountId, String newStatus) {
        requireConnection();
        try {
            return new bssms_persistence.common.Workflow(conn,0).update("UPDATE Staff SET status=? WHERE staff_id=?", newStatus,bssms_common.LoginIdentity.staffId(accountId)) == 1;
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }

    //Delete Staff Account
    public boolean deleteStaff(int staffId) {
        return deactivateStaff(staffId);
    }
    
    public boolean assignRole(int accountId, String newRole) {
        requireConnection();
        try {
            return new bssms_persistence.common.Workflow(conn,0).update("UPDATE Staff SET role=? WHERE staff_id=?", newRole,bssms_common.LoginIdentity.staffId(accountId)) == 1;
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }
    
    private String getUniqueUsername(String baseUsername) {
        String username = baseUsername;
        int counter = 1;
        String checkSql = "SELECT account_id FROM " + bssms_persistence.common.SchemaSql.ACCOUNTS + " Account WHERE username = ?";
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
        try {
            String username=getUniqueUsername(baseUsername);
            int rows=new bssms_persistence.common.Workflow(conn,0).update(
                "INSERT Staff(username,password,email,phone,full_name,role,salary,hire_date) VALUES(?,?,?,?,?,?,?,CAST(GETDATE() AS date))",
                username,bssms_security.PasswordUtil.hashMD5(password),email,phone,fullName,role,salary);
            return rows==1?username:null;
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }
    
    public Staff getStaffById(int staffId) {
        requireConnection();
        Staff value = new Staff();
        
        String query = "SELECT s.staff_id, s.account_id, a.username, s.full_name, "
                     + "a.email, a.phone, a.status, a.role, s.salary, s.hire_date "
                     + "FROM " + bssms_persistence.common.SchemaSql.STAFF + " s "
                     + "JOIN " + bssms_persistence.common.SchemaSql.ACCOUNTS + " a ON s.account_id = a.account_id "
                     + "WHERE s.staff_id = ?";
                     
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setInt(1, staffId);
                ResultSet rs = ps.executeQuery();
                
                if (rs.next()) {
                    value.setStaffId(rs.getInt("staff_id"));
                    value.setAccountId(rs.getInt("account_id"));
                    value.setUsername(rs.getString("username"));
                    value.setFullName(rs.getString("full_name"));
                    value.setEmail(rs.getString("email"));
                    value.setPhone(rs.getString("phone"));
                    value.setStatus(rs.getString("status"));
                    value.setRole(rs.getString("role"));
                    value.setSalary(rs.getBigDecimal("salary"));
                    
                    java.sql.Date hireDate = rs.getDate("hire_date");
                    value.setHireDate(hireDate != null ? hireDate.toString() : "");
                }
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return value;
    }
    
    public String checkDuplicate(String username, String email, String phone, Integer excludeAccountId) {
        requireConnection();
        if (username != null && username.trim().isEmpty()) username = null;
        if (email != null && email.trim().isEmpty()) email = null;
        if (phone != null && phone.trim().isEmpty()) phone = null;
        
        if (email != null && email.equalsIgnoreCase(bssms_security.EmailUtil.FROM_EMAIL)) {
            return "Email (Trùng với email hệ thống)";
        }

        String sql = "SELECT username, email, phone FROM " + bssms_persistence.common.SchemaSql.ACCOUNTS + " Account WHERE (username = ? OR email = ? OR phone = ?)";
        
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
        try {
            return new bssms_persistence.common.Workflow(conn,0).update("UPDATE Staff SET full_name=?,phone=?,email=?,role=?,hire_date=?,salary=?,username=?,password=COALESCE(?,password) WHERE staff_id=?", fullName,phone,email,role,(hireDate==null || hireDate.isBlank())?null:java.sql.Date.valueOf(hireDate),salary,username,(hashedPassword==null || hashedPassword.isEmpty())?null:hashedPassword,bssms_common.LoginIdentity.staffId(accountId)) == 1;
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }
}