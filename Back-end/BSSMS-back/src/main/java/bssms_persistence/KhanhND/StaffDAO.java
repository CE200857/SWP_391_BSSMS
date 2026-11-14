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

    public List<Staff> getAllStaffDetails() {
        requireConnection();

        List<Staff> list = new ArrayList<>();

        String query = "SELECT s.staff_id, s.account_id, "
                + "a.username, s.full_name, a.phone, "
                + "a.email, s.position, "
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
    private void requireNoFutureLines(bssms_persistence.common.Workflow w, int staffId, String message) throws java.sql.SQLException {
        if (!w.query("SELECT TOP 1 l.appointment_service_id FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id "
                + "WHERE l.technician_id=? AND a.appointment_date>=CAST(GETDATE() AS date) AND a.status IN ('Pending','Confirmed','Checked-in','In-progress') AND l.status<>'Done'", staffId).isEmpty())
            throw new bssms_persistence.common.WorkflowException(409, message);
    }
    private void requireNotLastManager(bssms_persistence.common.Workflow w, int staffId) throws java.sql.SQLException {
        if (!w.query("SELECT staff_id FROM Staff WHERE staff_id=? AND role='Manager'", staffId).isEmpty()
                && ((Number) w.one("SELECT COUNT(*) AS n FROM Staff WHERE role='Manager' AND status='Active' AND staff_id<>?", staffId).get("n")).intValue() == 0)
            throw new bssms_persistence.common.WorkflowException(409, "Phải còn ít nhất một quản lý đang hoạt động.");
    }

    public boolean deactivateStaff(int staffId) {
        return updateStaffStatus(bssms_common.LoginIdentity.staff(staffId), "Inactive");
    }

    public boolean updateStaffStatus(int accountId, String newStatus) {
        requireConnection();
        try {
            bssms_persistence.common.Workflow w = new bssms_persistence.common.Workflow(conn,0);
            int staffId = bssms_common.LoginIdentity.staffId(accountId);
            return w.transaction(() -> {
                if (!"Active".equals(newStatus)) {
                    requireNotLastManager(w, staffId);
                    requireNoFutureLines(w, staffId, "Kỹ thuật viên còn lịch hẹn sắp tới. Hãy điều phối lại các lịch này trước (UC-11.9).");
                    w.update("DELETE FROM StaffShift WHERE staff_id=? AND shift_date>CAST(GETDATE() AS date)", staffId);
                }
                return w.update("UPDATE Staff SET status=? WHERE staff_id=?", newStatus, staffId) == 1;
            });
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }

    public boolean deleteStaff(int staffId) {
        return deactivateStaff(staffId);
    }
    
    public boolean assignRole(int accountId, String newRole) {
        requireConnection();
        if (!java.util.Arrays.asList("Manager","Receptionist","Technician").contains(newRole)) throw new IllegalArgumentException("Vai trò không hợp lệ.");
        try {
            bssms_persistence.common.Workflow w = new bssms_persistence.common.Workflow(conn,0);
            int staffId = bssms_common.LoginIdentity.staffId(accountId);
            return w.transaction(() -> {
                if (!"Manager".equals(newRole)) requireNotLastManager(w, staffId);
                if (!"Technician".equals(newRole)) {
                    requireNoFutureLines(w, staffId, "Kỹ thuật viên còn lịch hẹn sắp tới, cần phân công lại trước khi đổi vai trò.");
                    w.update("DELETE FROM StaffService WHERE staff_id=?", staffId);
                }
                return w.update("UPDATE Staff SET role=? WHERE staff_id=?", newRole, staffId) == 1;
            });
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }

    public java.util.List<java.util.Map<String,Object>> getSkills(int staffId) {
        requireConnection();
        try {
            return new bssms_persistence.common.Workflow(conn,0).query("SELECT s.service_id,s.service_name FROM StaffService ss JOIN Service s ON s.service_id=ss.service_id WHERE ss.staff_id=? ORDER BY s.service_name", staffId);
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }
    public void saveSkills(int staffId, java.util.List<Integer> serviceIds) {
        requireConnection();
        try {
            bssms_persistence.common.Workflow w = new bssms_persistence.common.Workflow(conn,0);
            w.transaction(() -> {
                if (w.query("SELECT staff_id FROM Staff WHERE staff_id=? AND role='Technician'", staffId).isEmpty())
                    throw new IllegalArgumentException("Chỉ gán kỹ năng cho kỹ thuật viên.");
                w.update("DELETE FROM StaffService WHERE staff_id=?", staffId);
                for (Integer id : serviceIds) w.update("INSERT INTO StaffService(staff_id,service_id) VALUES(?,?)", staffId, id);
                return null;
            });
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
    
    public String createStaff(String baseUsername, String password, String email, String phone, String fullName, String role, String hireDate, java.util.List<Integer> serviceIds) {
        requireConnection();
        try {
            String username=getUniqueUsername(baseUsername);
            bssms_persistence.common.Workflow w=new bssms_persistence.common.Workflow(conn,0);
            int staffId=w.transaction(() -> {
                int id=w.insert(
                    "INSERT Staff(username,password,email,phone,full_name,role,hire_date,status,created_at,otp_attempts) VALUES(?,?,?,?,?,?,COALESCE(?,CAST(GETDATE() AS date)),'Active',GETDATE(),0)",
                    username,bssms_security.PasswordUtil.hashMD5(password),email,phone,fullName,role,(hireDate==null || hireDate.isBlank())?null:java.sql.Date.valueOf(hireDate));
                if ("Technician".equals(role) && serviceIds!=null)
                    for (Integer service : serviceIds) w.update("INSERT INTO StaffService(staff_id,service_id) VALUES(?,?)", id, service);
                return id;
            });
            return staffId>0?username:null;
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }
    
    public Staff getStaffById(int staffId) {
        requireConnection();
        Staff value = new Staff();
        
        String query = "SELECT s.staff_id, s.account_id, a.username, s.full_name, "
                     + "a.email, a.phone, a.status, a.role, s.hire_date "
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
    
    public boolean updateStaff(int accountId, String fullName, String phone, String email, String role, String hireDate, String username, String hashedPassword) {
        requireConnection();
        try {
            return new bssms_persistence.common.Workflow(conn,0).update("UPDATE Staff SET full_name=?,phone=?,email=?,hire_date=?,username=?,password=COALESCE(?,password) WHERE staff_id=?", fullName,phone,email,(hireDate==null || hireDate.isBlank())?null:java.sql.Date.valueOf(hireDate),username,(hashedPassword==null || hashedPassword.isEmpty())?null:hashedPassword,bssms_common.LoginIdentity.staffId(accountId)) == 1;
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }
}