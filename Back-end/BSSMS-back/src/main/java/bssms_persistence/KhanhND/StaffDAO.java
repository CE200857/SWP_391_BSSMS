package bssms_persistence.KhanhND;

import bssms_account.Staff;
import bssms_common.LoginIdentity;
import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import bssms_persistence.common.SchemaSql;
import bssms_persistence.common.Workflow;
import bssms_persistence.common.WorkflowException;
import bssms_security.EmailUtil;
import bssms_security.PasswordUtil;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class StaffDAO extends DBContext implements AutoCloseable {

    private final Workflow workflow = new Workflow(conn, 0);

    @Override
    public void close() throws SQLException {
        conn.close();
    }

    // Check if logged in user has one of the allowed roles (only Manager can manage staff)
    private void checkRole(String... roles) {
        try {
            workflow().roles(roles);
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // View staff list (skip deleted staff)
    public List<Staff> getAllStaffDetails() {
        checkRole("Manager");

        String sql = "SELECT s.staff_id, s.account_id, a.username, s.full_name, a.phone, "
                + "a.email, s.position, s.hire_date, a.status "
                + "FROM " + SchemaSql.STAFF + " s "
                + "JOIN " + SchemaSql.ACCOUNTS + " a ON s.account_id = a.account_id "
                + "WHERE NOT EXISTS(SELECT 1 FROM Staff d WHERE d.staff_id = s.staff_id AND d.deleted_at IS NOT NULL)";

        List<Staff> list = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Staff staff = new Staff();
                staff.setStaffId(rs.getInt("staff_id"));
                staff.setAccountId(rs.getInt("account_id"));
                staff.setUsername(rs.getString("username"));
                staff.setFullName(rs.getString("full_name"));
                staff.setPhone(rs.getString("phone"));
                staff.setEmail(rs.getString("email"));
                staff.setPosition(rs.getString("position"));
                staff.setHireDate(rs.getString("hire_date"));
                staff.setStatus(rs.getString("status"));
                list.add(staff);
            }
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
        return list;
    }

    // View one staff
    public Staff getStaffById(int staffId) {
        checkRole("Manager");

        String sql = "SELECT s.staff_id, s.account_id, a.username, s.full_name, "
                + "a.email, a.phone, a.status, a.role, s.hire_date "
                + "FROM " + SchemaSql.STAFF + " s "
                + "JOIN " + SchemaSql.ACCOUNTS + " a ON s.account_id = a.account_id "
                + "WHERE s.staff_id = ?";

        Staff staff = new Staff();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, staffId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                staff.setStaffId(rs.getInt("staff_id"));
                staff.setAccountId(rs.getInt("account_id"));
                staff.setUsername(rs.getString("username"));
                staff.setFullName(rs.getString("full_name"));
                staff.setEmail(rs.getString("email"));
                staff.setPhone(rs.getString("phone"));
                staff.setStatus(rs.getString("status"));
                staff.setRole(rs.getString("role"));

                Date hireDate = rs.getDate("hire_date");
                if (hireDate != null) {
                    staff.setHireDate(hireDate.toString());
                } else {
                    staff.setHireDate("");
                }
            }
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
        return staff;
    }

    // Error if technician still has upcoming unfinished appointments
    private void requireNoFutureAppointments(int staffId, String message) throws SQLException {
        String sql = "SELECT TOP 1 l.appointment_service_id FROM AppointmentService l "
                + "JOIN Appointment a ON a.appointment_id = l.appointment_id "
                + "WHERE l.technician_id = ? AND a.appointment_date >= CAST(GETDATE() AS date) "
                + "AND a.status IN ('Pending','Confirmed','Checked-in','In-progress') AND l.status <> 'Done'";
        List<Map<String, Object>> rows = workflow.query(sql, staffId);
        if (!rows.isEmpty()) {
            throw new WorkflowException(409, message);
        }
    }

    // Error if this is the last active Manager (system needs at least 1 Manager)
    private void requireNotLastManager(int staffId) throws SQLException {
        List<Map<String, Object>> managers = workflow.query(
                "SELECT staff_id FROM Staff WHERE staff_id = ? AND role = 'Manager'", staffId);
        if (managers.isEmpty()) {
            return; // not a Manager so no need to check
        }

        Map<String, Object> row = workflow.one(
                "SELECT COUNT(*) AS n FROM Staff WHERE role = 'Manager' AND status = 'Active' AND staff_id <> ?", staffId);
        int otherManagers = Workflow.id(row.get("n"));
        if (otherManagers == 0) {
            throw new WorkflowException(409, "There must be at least one active manager.");
        }
    }

    // Change staff status. When Inactive, delete future shifts
    // Deleted staff cannot be turned Active again
    public boolean updateStaffStatus(int accountId, String newStatus) {
        checkRole("Manager");
        try {
            int staffId = LoginIdentity.staffId(accountId);
            return workflow.transaction(() -> {
                if (!"Active".equals(newStatus)) {
                    requireNotLastManager(staffId);
                    requireNoFutureAppointments(staffId,
                            "The technician still has upcoming appointments. Reassign them first.");
                    workflow.update("DELETE FROM StaffShift WHERE staff_id = ? AND shift_date > CAST(GETDATE() AS date)", staffId);
                }
                int rows = workflow.update("UPDATE Staff SET status = ? WHERE staff_id = ? AND deleted_at IS NULL",
                        newStatus, staffId);
                return rows == 1;
            });
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Delete staff: soft delete, set Inactive then save deleted_at
    public boolean deleteStaff(int staffId) {
        int accountId = LoginIdentity.staff(staffId);
        if (!updateStaffStatus(accountId, "Inactive")) {
            return false;
        }

        try {
            int rows = workflow.update("UPDATE Staff SET deleted_at = SYSDATETIME() WHERE staff_id = ? AND deleted_at IS NULL", staffId);
            return rows == 1;
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Assign role to staff
    public boolean assignRole(int accountId, String newRole) {
        checkRole("Manager");
        if (!newRole.equals("Manager") && !newRole.equals("Receptionist") && !newRole.equals("Technician")) {
            throw new IllegalArgumentException("Invalid role.");
        }

        try {
            int staffId = LoginIdentity.staffId(accountId);
            return workflow.transaction(() -> {
                if (!"Manager".equals(newRole)) {
                    requireNotLastManager(staffId);
                }
                // No longer technician then delete assigned services
                if (!"Technician".equals(newRole)) {
                    requireNoFutureAppointments(staffId,
                            "The technician still has upcoming appointments; reassign them before changing the role.");
                    workflow.update("DELETE FROM StaffService WHERE staff_id = ?", staffId);
                }
                int rows = workflow.update("UPDATE Staff SET role = ? WHERE staff_id = ?", newRole, staffId);
                return rows == 1;
            });
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Get services the technician can do
    public List<Map<String, Object>> getSkills(int staffId) {
        checkRole("Manager");
        try {
            return workflow.query("SELECT s.service_id, s.service_name FROM StaffService ss "
                    + "JOIN Service s ON s.service_id = ss.service_id "
                    + "WHERE ss.staff_id = ? ORDER BY s.service_name", staffId);
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Save technician services (delete all then insert again)
    public void saveSkills(int staffId, List<Integer> serviceIds) {
        checkRole("Manager");
        try {
            workflow.transaction(() -> {
                List<Map<String, Object>> technicians = workflow.query(
                        "SELECT staff_id FROM Staff WHERE staff_id = ? AND role = 'Technician'", staffId);
                if (technicians.isEmpty()) {
                    throw new IllegalArgumentException("Skills can only be assigned to technicians.");
                }

                workflow.update("DELETE FROM StaffService WHERE staff_id = ?", staffId);
                for (Integer serviceId : serviceIds) {
                    workflow.update("INSERT INTO StaffService(staff_id, service_id) VALUES(?, ?)", staffId, serviceId);
                }
                return null;
            });
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Create staff account, return final username (a number may be added if duplicate)
    public String createStaff(String baseUsername, String password, String email, String phone, String fullName,
            String role, String hireDate, List<Integer> serviceIds) {
        checkRole("Manager");

        String username = getUniqueUsername(baseUsername);
        String hashedPassword = PasswordUtil.hashMD5(password);

        Date hireDateValue = toDate(hireDate);

        try {
            workflow.transaction(() -> {
                // empty hire_date means today
                String sql = "INSERT Staff(username, password, email, phone, full_name, role, hire_date, "
                        + "status, created_at, otp_attempts) "
                        + "VALUES(?, ?, ?, ?, ?, ?, COALESCE(?, CAST(GETDATE() AS date)), 'Active', GETDATE(), 0)";
                int newId = workflow.insert(sql, username, hashedPassword, email, phone, fullName, role, hireDateValue);

                // Technician: also save selected services
                if ("Technician".equals(role) && serviceIds != null) {
                    for (Integer serviceId : serviceIds) {
                        workflow.update("INSERT INTO StaffService(staff_id, service_id) VALUES(?, ?)", newId, serviceId);
                    }
                }
                return newId;
            });
            return username;
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Update staff (hashedPassword = null means keep old password)
    public boolean updateStaff(int accountId, String fullName, String phone, String email,
            String hireDate, String username, String hashedPassword) {
        checkRole("Manager");

        int staffId = LoginIdentity.staffId(accountId);
        String sql = "UPDATE Staff SET full_name = ?, phone = ?, email = ?, hire_date = ?, username = ?, "
                + "password = COALESCE(?, password) WHERE staff_id = ?";
        try {
            int rows = workflow.update(sql, fullName, phone, email, toDate(hireDate), username, hashedPassword, staffId);
            return rows == 1;
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Check for existed username / email / phone
    // Return duplicate if existed, null if not
    public String checkDuplicate(String username, String email, String phone, Integer excludeAccountId) {
        checkRole("Manager");

        if (username != null && username.trim().isEmpty()) {
            username = null;
        }
        if (email != null && email.trim().isEmpty()) {
            email = null;
        }
        if (phone != null && phone.trim().isEmpty()) {
            phone = null;
        }
        if (email != null && email.equalsIgnoreCase(EmailUtil.FROM_EMAIL)) {
            return "Email (same as the system email)";
        }

        String sql = "SELECT username, email, phone FROM " + SchemaSql.ACCOUNTS + " Account "
                + "WHERE (username = ? OR email = ? OR phone = ?)";
        if (excludeAccountId != null) {
            sql = sql + " AND account_id != ?";
        }

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            ps.setString(2, email);
            ps.setString(3, phone);
            if (excludeAccountId != null) {
                ps.setInt(4, excludeAccountId);
            }

            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                if (username != null && username.equalsIgnoreCase(rs.getString("username"))) { // Check username
                    return "Username";
                }
                if (phone != null && phone.equals(rs.getString("phone"))) { // Check phone
                    return "Phone number";
                }
                if (email != null && email.equalsIgnoreCase(rs.getString("email"))) { // Check email
                    return "Email";
                }
            }
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
        return null;
    }

    // If username exists then add a number: an -> an1 -> an2 ...
    private String getUniqueUsername(String baseUsername) {
        String sql = "SELECT account_id FROM " + SchemaSql.ACCOUNTS + " Account WHERE username = ?";
        String username = baseUsername;
        int counter = 1;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            while (true) {
                ps.setString(1, username);
                ResultSet rs = ps.executeQuery();
                boolean exists = rs.next();
                rs.close();
                if (!exists) {
                    break;
                }
                username = baseUsername + counter;
                counter++;
            }
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
        return username;
    }

    // Convert "yyyy-MM-dd" text to SQL date, empty text becomes NULL
    private Date toDate(String value) {
        if (value == null || value.isBlank() || value.equals("null")) {
            return null;
        }
        return Date.valueOf(value.trim());
    }
}
