package bssms_persistence.DatNT;

import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import bssms_account.*;

public class RegisterDAO extends DBContext implements AutoCloseable {

    private void requireConnection() {
        if (conn == null) {
            throw new DataAccessException("Database connection unavailable");
        }
    }

    @Override
    public void close() throws java.sql.SQLException {
        if (conn != null) {
            conn.close();
        }
    }

    public String checkDuplicate(String username, String email, String phone, Integer excludeAccountId) {
        requireConnection();
        if (username != null && username.trim().isEmpty()) {
            username = null;
        }
        if (email != null && email.trim().isEmpty()) {
            email = null;
        }
        if (phone != null && phone.trim().isEmpty()) {
            phone = null;
        }

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

    public Account authenticateUser(String emailOrPhone, String password) {
        requireConnection();
        try {
            return new bssms_persistence.common.Workflow(conn, 0).query(rs -> {
                Account a = new Account();
                a.setAccountId(rs.getInt("account_id"));
                a.setIdentityVersion(2);
                a.setStaffId(rs.getObject("staff_id", Integer.class));
                a.setCustomerId(rs.getObject("customer_id", Integer.class));
                a.setUsername(rs.getString("username"));
                a.setFullName(rs.getString("full_name"));
                a.setEmail(rs.getString("email"));
                a.setPhone(rs.getString("phone"));
                a.setRole(rs.getString("role"));
                a.setStatus(rs.getString("status"));
                return a;
            }, "SELECT * FROM " + bssms_persistence.common.SchemaSql.ACCOUNTS + " Account WHERE (email=? OR phone=?) AND password=?", emailOrPhone, emailOrPhone, password)
                    .stream().findFirst().orElse(null);
        } catch (java.sql.SQLException e) {
            throw new DataAccessException(e);
        }
    }

    private static final int OTP_MINUTES = 5;
    private static final int OTP_MAX_ATTEMPTS = 5;
    private static final int OTP_RESEND_SECONDS = 60;
    private static final String CLEAR_OTP = "otp_code=NULL,otp_purpose=NULL,otp_attempts=0,otp_expiry_time=NULL,otp_created_at=NULL,otp_consumed_at=NULL";

    private static Integer first(java.util.List<Integer> ids) {
        return ids.isEmpty() ? null : ids.get(0);
    }

    private static void requireResendAllowed(bssms_persistence.common.Workflow w, String table, String keyCol, Object key) throws java.sql.SQLException {
        if (!w.query(rs -> rs.getInt(1), "SELECT 1 FROM " + table + " WHERE " + keyCol + "=? AND otp_created_at>DATEADD(second,-" + OTP_RESEND_SECONDS + ",GETDATE())", key).isEmpty()) {
            throw new bssms_persistence.common.WorkflowException(429, "Vui lòng chờ 60 giây trước khi gửi lại OTP.");
        }
    }

    private boolean verifyOtp(bssms_persistence.common.Workflow w, String table, String keyCol, Object key,
            String purpose, String extra, Object[] extraArgs, String otp) throws java.sql.SQLException {
        String where = keyCol + "=? AND otp_purpose=? AND otp_consumed_at IS NULL AND otp_expiry_time>GETDATE()" + extra;
        java.util.List<Object> args = new java.util.ArrayList<>();
        args.add(key);
        args.add(purpose);
        args.addAll(java.util.Arrays.asList(extraArgs));
        if (w.update("UPDATE " + table + " SET otp_attempts=otp_attempts+1 WHERE " + where + " AND otp_attempts<" + OTP_MAX_ATTEMPTS, args.toArray()) == 0) {
            return false;
        }
        args.add(otp);
        return w.update("UPDATE " + table + " SET otp_consumed_at=GETDATE() WHERE " + where + " AND otp_code=? AND otp_attempts<=" + OTP_MAX_ATTEMPTS, args.toArray()) == 1;
    }

    public boolean saveRegistrationCode(String email, String otp) {
        return saveRegistrationCode(email, otp, null, null, null, null, null);
    }
    public boolean saveRegistrationCode(String email, String otp, String fullName, String phone, String dateOfBirth) {
        return saveRegistrationCode(email, otp, fullName, phone, dateOfBirth, null, null);
    }

    public boolean saveRegistrationCode(String email, String otp, String fullName, String phone, String dateOfBirth, String gender, String address) {
        requireConnection();
        try {
            bssms_persistence.common.Workflow w = new bssms_persistence.common.Workflow(conn, 0);
            return w.transaction(() -> {
                w.update("DELETE FROM Customer WHERE status='Pending' AND email<>? AND (otp_expiry_time IS NULL OR otp_expiry_time<DATEADD(minute,-" + OTP_MINUTES + ",GETDATE()))", email);
                if (phone != null && !phone.isBlank())
                    w.update("DELETE FROM Customer WHERE status='Pending' AND email<>? AND phone=?", email, phone.trim());
                java.util.List<Object[]> found = w.query(rs -> new Object[]{rs.getInt("customer_id"), rs.getString("status")},
                        "SELECT customer_id,status FROM Customer WHERE email=?", email);
                String name = fullName == null || fullName.isBlank() ? email.substring(0, email.indexOf('@')) : fullName.trim();
                java.sql.Date dob = dateOfBirth == null || dateOfBirth.isBlank() ? null : java.sql.Date.valueOf(dateOfBirth);
                String sex = gender == null || gender.isBlank() ? null : gender.trim();
                String addr = address == null || address.isBlank() ? null : address.trim();
                if (found.isEmpty()) {
                    if (phone == null || phone.isBlank()) throw new IllegalArgumentException("Số điện thoại là bắt buộc.");
                    return w.update("INSERT Customer(email,full_name,phone,date_of_birth,gender,address,membership_tier_id,lifetime_spending,status,created_at,otp_code,otp_purpose,otp_attempts,otp_expiry_time,otp_created_at) "
                            + "VALUES(?,?,?,?,?,?,1,0,'Pending',GETDATE(),?,'Registration',0,DATEADD(minute," + OTP_MINUTES + ",GETDATE()),GETDATE())", email, name, phone.trim(), dob, sex, addr, otp) == 1;
                }
                int id = (Integer) found.get(0)[0];
                if (!"Pending".equals(found.get(0)[1])) {
                    return false;
                }
                requireResendAllowed(w, "Customer", "customer_id", id);
                return w.update("UPDATE Customer SET full_name=COALESCE(?,full_name),phone=COALESCE(?,phone),date_of_birth=COALESCE(?,date_of_birth),gender=COALESCE(?,gender),address=COALESCE(?,address),"
                        + "otp_code=?,otp_purpose='Registration',otp_email=NULL,otp_attempts=0,"
                        + "otp_expiry_time=DATEADD(minute," + OTP_MINUTES + ",GETDATE()),otp_created_at=GETDATE(),otp_consumed_at=NULL "
                        + "WHERE customer_id=? AND status='Pending'", fullName == null || fullName.isBlank() ? null : name, phone == null || phone.isBlank() ? null : phone.trim(), dob, sex, addr, otp, id) == 1;
            });
        } catch (java.sql.SQLException e) {
            throw new DataAccessException(e);
        }
    }

    public boolean verifyRegistrationCode(String email, String otp) {
        requireConnection();
        try {
            bssms_persistence.common.Workflow w = new bssms_persistence.common.Workflow(conn, 0);
            return w.transaction(() -> verifyOtp(w, "Customer", "email", email, "Registration", " AND status='Pending'", new Object[0], otp));
        } catch (java.sql.SQLException e) {
            throw new DataAccessException(e);
        }
    }

    public boolean completeRegistration(String username, String hashedPassword, String email) {
        requireConnection();
        try {
            bssms_persistence.common.Workflow w = new bssms_persistence.common.Workflow(conn, 0);
            return w.transaction(() -> w.update("UPDATE Customer SET username=?,password=?,status='Active',otp_email=NULL," + CLEAR_OTP + " "
                    + "WHERE email=? AND status='Pending' AND otp_purpose='Registration' "
                    + "AND otp_consumed_at IS NOT NULL AND otp_consumed_at>DATEADD(minute,-10,GETDATE())",
                    username, hashedPassword, email) == 1);
        } catch (java.sql.SQLException e) {
            throw new DataAccessException(e);
        }
    }

    public boolean savePasswordResetCode(String email, String otp) {
        requireConnection();
        try {
            bssms_persistence.common.Workflow w = new bssms_persistence.common.Workflow(conn, 0);
            return w.transaction(() -> {
                Integer customer = first(w.query(rs -> rs.getInt(1),
                        "SELECT customer_id FROM Customer WHERE email=? AND status<>'Pending' AND username IS NOT NULL", email));
                if (customer != null) {
                    requireResendAllowed(w, "Customer", "customer_id", customer);
                    return w.update("UPDATE Customer SET otp_code=?,otp_purpose='PasswordReset',otp_email=NULL,otp_attempts=0,"
                            + "otp_expiry_time=DATEADD(minute," + OTP_MINUTES + ",GETDATE()),otp_created_at=GETDATE(),otp_consumed_at=NULL "
                            + "WHERE customer_id=?", otp, customer) == 1;
                }
                Integer staff = first(w.query(rs -> rs.getInt(1),
                        "SELECT staff_id FROM Staff WHERE email=? AND username IS NOT NULL", email));
                if (staff == null) {
                    return false;
                }
                requireResendAllowed(w, "Staff", "staff_id", staff);
                return w.update("UPDATE Staff SET otp_code=?,otp_purpose='PasswordReset',otp_attempts=0,"
                        + "otp_expiry_time=DATEADD(minute," + OTP_MINUTES + ",GETDATE()),otp_created_at=GETDATE(),otp_consumed_at=NULL "
                        + "WHERE staff_id=?", otp, staff) == 1;
            });
        } catch (java.sql.SQLException e) {
            throw new DataAccessException(e);
        }
    }

    public boolean verifyPasswordResetCode(String email, String otp) {
        requireConnection();
        try {
            bssms_persistence.common.Workflow w = new bssms_persistence.common.Workflow(conn, 0);
            return w.transaction(() -> {
                if (!w.query(rs -> rs.getInt(1), "SELECT 1 FROM Customer WHERE email=? AND otp_purpose='PasswordReset' AND status<>'Pending'", email).isEmpty()) {
                    return verifyOtp(w, "Customer", "email", email, "PasswordReset", " AND status<>'Pending'", new Object[0], otp);
                }
                return verifyOtp(w, "Staff", "email", email, "PasswordReset", "", new Object[0], otp);
            });
        } catch (java.sql.SQLException e) {
            throw new DataAccessException(e);
        }
    }

    public void clearPasswordResetCode(String email) {
        requireConnection();
        try {
            bssms_persistence.common.Workflow w = new bssms_persistence.common.Workflow(conn, 0);
            w.transaction(() -> {
                w.update("UPDATE Customer SET otp_email=NULL," + CLEAR_OTP + " WHERE email=? AND otp_purpose='PasswordReset'", email);
                w.update("UPDATE Staff SET " + CLEAR_OTP + " WHERE email=? AND otp_purpose='PasswordReset'", email);
                return true;
            });
        } catch (java.sql.SQLException e) {
            throw new DataAccessException(e);
        }
    }

    public boolean saveEmailChangeCode(int customerId, String newEmail, String otp) {
        requireConnection();
        try {
            bssms_persistence.common.Workflow w = new bssms_persistence.common.Workflow(conn, 0);
            return w.transaction(() -> {
                requireResendAllowed(w, "Customer", "customer_id", customerId);
                return w.update("UPDATE Customer SET otp_code=?,otp_purpose='EmailChange',otp_email=?,otp_attempts=0,"
                        + "otp_expiry_time=DATEADD(minute," + OTP_MINUTES + ",GETDATE()),otp_created_at=GETDATE(),otp_consumed_at=NULL "
                        + "WHERE customer_id=? AND status<>'Pending'", otp, newEmail, customerId) == 1;
            });
        } catch (java.sql.SQLException e) {
            throw new DataAccessException(e);
        }
    }

    public boolean verifyEmailChangeCode(int customerId, String newEmail, String otp) {
        requireConnection();
        try {
            bssms_persistence.common.Workflow w = new bssms_persistence.common.Workflow(conn, 0);
            return w.transaction(() -> {
                boolean ok = verifyOtp(w, "Customer", "customer_id", customerId, "EmailChange",
                        " AND otp_email=? AND status<>'Pending'", new Object[]{newEmail}, otp);
                if (ok) {
                    w.update("DELETE FROM Customer WHERE status='Pending' AND email=?", newEmail);
                }
                return ok;
            });
        } catch (java.sql.SQLException e) {
            throw new DataAccessException(e);
        }
    }

    public void clearEmailChangeCode(int customerId) {
        requireConnection();
        try {
            new bssms_persistence.common.Workflow(conn, 0).update(
                    "UPDATE Customer SET otp_email=NULL," + CLEAR_OTP + " WHERE customer_id=? AND otp_purpose='EmailChange'", customerId);
        } catch (java.sql.SQLException e) {
            throw new DataAccessException(e);
        }
    }

    public boolean isSameOldPasswordByEmail(String email, String newPasswordHashed) {
        requireConnection();
        String sql = "SELECT account_id FROM " + bssms_persistence.common.SchemaSql.ACCOUNTS + " Account WHERE email = ? AND password = ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setString(1, email);
                ps.setString(2, newPasswordHashed);
                ResultSet rs = ps.executeQuery();
                return rs.next();
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return false;
    }

    public boolean changePassword(int accountId, String oldPasswordHashed, String newPasswordHashed) {
        requireConnection();
        try {
            boolean customer = accountId % 2 == 1;
            int id = customer ? bssms_common.LoginIdentity.customerId(accountId) : bssms_common.LoginIdentity.staffId(accountId);
            String sql = customer ? "UPDATE Customer SET password=? WHERE customer_id=? AND password=?" : "UPDATE Staff SET password=? WHERE staff_id=? AND password=?";
            return new bssms_persistence.common.Workflow(conn, 0).update(sql, newPasswordHashed, id, oldPasswordHashed) == 1;
        } catch (java.sql.SQLException e) {
            throw new DataAccessException(e);
        }
    }

    public boolean resetPasswordByEmail(String email, String newPasswordHashed) {
        requireConnection();
        try {
            bssms_persistence.common.Workflow w = new bssms_persistence.common.Workflow(conn, 0);
            return w.transaction(() -> {
                int count = w.update("UPDATE Staff SET password=? WHERE email=? AND username IS NOT NULL", newPasswordHashed, email);
                count += w.update("UPDATE Customer SET password=? WHERE email=? AND username IS NOT NULL", newPasswordHashed, email);
                return count == 1;
            });
        } catch (java.sql.SQLException e) {
            throw new DataAccessException(e);
        }
    }
}
