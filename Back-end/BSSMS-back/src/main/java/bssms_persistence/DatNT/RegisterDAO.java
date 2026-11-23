package bssms_persistence.DatNT;

import bssms_account.Account;
import bssms_common.LoginIdentity;
import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import bssms_persistence.common.SchemaSql;
import bssms_persistence.common.Workflow;
import bssms_persistence.common.WorkflowException;
import bssms_security.EmailUtil;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

public class RegisterDAO extends DBContext implements AutoCloseable {

    private final Workflow workflow = new Workflow(conn, 0);

    private static final int OTP_MINUTES = 5;           // OTP expired after 5m
    private static final int OTP_MAX_ATTEMPTS = 5;      // 5 wrong attempt only
    private static final int OTP_RESEND_SECONDS = 60;   // wait 60s to resend code

    // Delete all OTP in sql
    private static final String CLEAR_OTP = "otp_code=NULL, otp_purpose=NULL, otp_attempts=0, "
            + "otp_expiry_time=NULL, otp_created_at=NULL, otp_consumed_at=NULL";

    // Save new OTP to sql
    private static final String NEW_OTP_TIME = "otp_attempts=0, "
            + "otp_expiry_time=DATEADD(minute," + OTP_MINUTES + ",GETDATE()), "
            + "otp_created_at=GETDATE(), otp_consumed_at=NULL";

    @Override
    public void close() throws SQLException {
        conn.close();
    }

    // Check for existed username / email / phone
    // Return duplicate if existed, null if not
    public String checkDuplicate(String username, String email, String phone, Integer excludeAccountId) {
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

    // Login: Search account by email or phone + hashed password
    public Account authenticateUser(String emailOrPhone, String hashedPassword) {
        String sql = "SELECT * FROM " + SchemaSql.ACCOUNTS + " Account "
                + "WHERE (email = ? OR phone = ?) AND password = ?";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, emailOrPhone);
            ps.setString(2, emailOrPhone);
            ps.setString(3, hashedPassword);
            ResultSet rs = ps.executeQuery();
            if (!rs.next()) {
                return null;
            }

            Account account = new Account();
            account.setAccountId(rs.getInt("account_id"));
            account.setIdentityVersion(2);
            account.setStaffId(rs.getObject("staff_id", Integer.class));
            account.setCustomerId(rs.getObject("customer_id", Integer.class));
            account.setUsername(rs.getString("username"));
            account.setFullName(rs.getString("full_name"));
            account.setEmail(rs.getString("email"));
            account.setPhone(rs.getString("phone"));
            account.setRole(rs.getString("role"));
            account.setStatus(rs.getString("status"));
            return account;
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Prevent resend OTP if previous code was sent less than 60s ago
    private void requireResendAllowed(String table, String keyColumn, Object key) throws SQLException {
        String sql = "SELECT 1 AS found FROM " + table + " WHERE " + keyColumn + " = ? "
                + "AND otp_created_at > DATEADD(second,-" + OTP_RESEND_SECONDS + ",GETDATE())";
        List<Map<String, Object>> rows = workflow.query(sql, key);
        if (!rows.isEmpty()) {
            throw new WorkflowException(429, "Please wait 60 seconds before resending the OTP.");
        }
    }

    // Check user input OTP
    // Step 1: Increase attempt (decline if over 5 attempt)
    // Step 2: Check usage if code is correct
    private boolean verifyOtp(String table, String keyColumn, Object key, String purpose,
            String extraCondition, String extraValue, String otp) throws SQLException {
        String where = keyColumn + " = ? AND otp_purpose = ? AND otp_consumed_at IS NULL "
                + "AND otp_expiry_time > GETDATE()" + extraCondition;
        
        String countAttemptSql = "UPDATE " + table + " SET otp_attempts = otp_attempts + 1 " // Increase attempt by 1
                + "WHERE " + where + " AND otp_attempts < " + OTP_MAX_ATTEMPTS;
        int counted;
        if (extraValue == null) {
            counted = workflow.update(countAttemptSql, key, purpose);
        } else {
            counted = workflow.update(countAttemptSql, key, purpose, extraValue);
        }
        if (counted == 0) { // Return false if cannot increase attempt, mean code is expired, used or attempt over 5
            return false;
        }

        String useCodeSql = "UPDATE " + table + " SET otp_consumed_at = GETDATE() " // Check if otp is correct
                + "WHERE " + where + " AND otp_code = ? AND otp_attempts <= " + OTP_MAX_ATTEMPTS;
        int used;
        if (extraValue == null) {
            used = workflow.update(useCodeSql, key, purpose, otp);
        } else {
            used = workflow.update(useCodeSql, key, purpose, extraValue, otp);
        }
        return used == 1; // Return true if OTP is correct and update otp_consumed_at
    }

    // Register step 1: Save register OTP for pending customer
    public boolean saveRegistrationCode(String email, String otp) {
        try {
            return workflow.transaction(() -> {
                // Delete other pending email with otp is null or expired
                workflow.update("DELETE FROM Customer WHERE status = 'Pending' AND email <> ? "
                        + "AND (otp_expiry_time IS NULL OR otp_expiry_time < DATEADD(minute,-" + OTP_MINUTES + ",GETDATE()))",
                        email);

                List<Map<String, Object>> found = workflow.query( // Search for existed email in database
                        "SELECT customer_id, status FROM Customer WHERE email = ?", email);

                if (found.isEmpty()) { // If there is no existed email: create new pending row.
                    String name = email.substring(0, email.indexOf('@')); // Create temp name
                    String pendingPhone = "PENDING-" // Create temp phone
                            + Long.toString(System.nanoTime() % 1_000_000_000_000L, 36).toUpperCase();
                    /*
                    There are temp name and phone because name and phone must not null when create a record due to database
                    */
                    String insertSql = "INSERT Customer(email, full_name, phone, date_of_birth, gender, address, "
                            + "membership_tier_id, lifetime_spending, status, created_at, "
                            + "otp_code, otp_purpose, otp_attempts, otp_expiry_time, otp_created_at) "
                            + "VALUES(?, ?, ?, NULL, NULL, NULL, 1, 0, 'Pending', GETDATE(), "
                            + "?, 'Registration', 0, DATEADD(minute," + OTP_MINUTES + ",GETDATE()), GETDATE())";
                    int rows = workflow.update(insertSql, email, name, pendingPhone, otp); // Return number of affected row. 1 is true and 0 is false
                    return rows == 1;
                }

                // If email exist and active
                Map<String, Object> row = found.get(0);
                if (!"Pending".equals(row.get("status"))) {
                    return false;
                }

                // If email exist and Pending: update new OTP
                int customerId = Workflow.id(row.get("customerId"));
                requireResendAllowed("Customer", "customer_id", customerId);
                String updateSql = "UPDATE Customer SET otp_code = ?, otp_purpose = 'Registration', otp_email = NULL, "
                        + NEW_OTP_TIME + " WHERE customer_id = ? AND status = 'Pending'";
                int rows = workflow.update(updateSql, otp, customerId);
                return rows == 1;
            });
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Register step 2: Verify register OTP
    public boolean verifyRegistrationCode(String email, String otp) {
        try {
            return workflow.transaction(() -> {
                return verifyOtp("Customer", "email", email, "Registration",
                        " AND status = 'Pending'", null, otp);
            });
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Register step 3: active account that verify email in the last 30m and save profile
    public boolean completeRegistration(String username, String hashedPassword, String email,
            String fullName, String phone, String dateOfBirth, String gender, String address) {
        String sql = "UPDATE Customer SET username = ?, password = ?, status = 'Active', "
                + "full_name = ?, phone = ?, date_of_birth = ?, gender = ?, address = ?, "
                + "otp_email = NULL, " + CLEAR_OTP + " "
                + "WHERE email = ? AND status = 'Pending' AND otp_purpose = 'Registration' "
                + "AND otp_consumed_at IS NOT NULL AND otp_consumed_at > DATEADD(minute,-30,GETDATE())";
        try {
            int rows = workflow.update(sql, username, hashedPassword, fullName, phone, toDate(dateOfBirth),
                    emptyToNull(gender), address, email); // Update all information into the current record to complete the registration
            return rows == 1;
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Forgot password: save forgot password OTP (check Customer first, Staff later)
    public boolean savePasswordResetCode(String email, String otp) {
        try {
            return workflow.transaction(() -> {
                List<Map<String, Object>> customers = workflow.query( // Check customer table
                        "SELECT customer_id FROM Customer WHERE email = ? AND status <> 'Pending' AND username IS NOT NULL",
                        email);
                if (!customers.isEmpty()) {
                    int customerId = Workflow.id(customers.get(0).get("customerId"));
                    requireResendAllowed("Customer", "customer_id", customerId);
                    String sql = "UPDATE Customer SET otp_code = ?, otp_purpose = 'PasswordReset', otp_email = NULL, "
                            + NEW_OTP_TIME + " WHERE customer_id = ?";
                    int rows = workflow.update(sql, otp, customerId); // Save OTP to record if found
                    return rows == 1;
                }

                List<Map<String, Object>> staffs = workflow.query( // Check Staff table if not found in Cust
                        "SELECT staff_id FROM Staff WHERE email = ? AND username IS NOT NULL", email);
                if (staffs.isEmpty()) {
                    return false;
                }
                int staffId = Workflow.id(staffs.get(0).get("staffId"));
                requireResendAllowed("Staff", "staff_id", staffId);
                String sql = "UPDATE Staff SET otp_code = ?, otp_purpose = 'PasswordReset', "
                        + NEW_OTP_TIME + " WHERE staff_id = ?";
                int rows = workflow.update(sql, otp, staffId);
                return rows == 1;
            });
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Forgot Password: Verify forgotPassword OTP
    public boolean verifyPasswordResetCode(String email, String otp) {
        try {
            return workflow.transaction(() -> {
                List<Map<String, Object>> customers = workflow.query(
                        "SELECT 1 AS found FROM Customer WHERE email = ? AND otp_purpose = 'PasswordReset' AND status <> 'Pending'",
                        email);
                if (!customers.isEmpty()) {
                    return verifyOtp("Customer", "email", email, "PasswordReset",
                            " AND status <> 'Pending'", null, otp);
                }
                return verifyOtp("Staff", "email", email, "PasswordReset", "", null, otp); // Check for staff if not found in Cust
            });
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Forgot Password: Delete Forgot Password OTP after verify
    public void clearPasswordResetCode(String email) {
        try {
            workflow.transaction(() -> {
                workflow.update("UPDATE Customer SET otp_email = NULL, " + CLEAR_OTP
                        + " WHERE email = ? AND otp_purpose = 'PasswordReset'", email);
                workflow.update("UPDATE Staff SET " + CLEAR_OTP
                        + " WHERE email = ? AND otp_purpose = 'PasswordReset'", email);
                return true;
            });
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Change email: save OTP when customer changes email
    public boolean saveEmailChangeCode(int customerId, String newEmail, String otp) {
        try {
            return workflow.transaction(() -> {
                requireResendAllowed("Customer", "customer_id", customerId);
                String sql = "UPDATE Customer SET otp_code = ?, otp_purpose = 'EmailChange', otp_email = ?, "
                        + NEW_OTP_TIME + " WHERE customer_id = ? AND status <> 'Pending'";
                int rows = workflow.update(sql, otp, newEmail, customerId);
                return rows == 1;
            });
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Change email: verify change email OTP
    public boolean verifyEmailChangeCode(int customerId, String newEmail, String otp) {
        try {
            return workflow.transaction(() -> {
                boolean ok = verifyOtp("Customer", "customer_id", customerId, "EmailChange",
                        " AND otp_email = ? AND status <> 'Pending'", newEmail, otp);
                if (ok) {
                    // Delete unfinished registration (if any) using this new email
                    workflow.update("DELETE FROM Customer WHERE status = 'Pending' AND email = ?", newEmail);
                }
                return ok;
            });
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Change email: delete change email OTP after done
    public void clearEmailChangeCode(int customerId) {
        try {
            workflow.update("UPDATE Customer SET otp_email = NULL, " + CLEAR_OTP
                    + " WHERE customer_id = ? AND otp_purpose = 'EmailChange'", customerId);
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Forgot Password: Check if new password is the same with old password
    public boolean isSameOldPasswordByEmail(String email, String newPasswordHashed) {
        String sql = "SELECT account_id FROM " + SchemaSql.ACCOUNTS + " Account WHERE email = ? AND password = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            ps.setString(2, newPasswordHashed);
            ResultSet rs = ps.executeQuery();
            return rs.next();
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Change Password
    // Odd account_id is customer, even is staff
    public boolean changePassword(int accountId, String oldPasswordHashed, String newPasswordHashed) {
        String sql;
        int id;
        if (accountId % 2 == 1) {
            id = LoginIdentity.customerId(accountId);
            sql = "UPDATE Customer SET password = ? WHERE customer_id = ? AND password = ?";
        } else {
            id = LoginIdentity.staffId(accountId);
            sql = "UPDATE Staff SET password = ? WHERE staff_id = ? AND password = ?";
        }

        try {
            int rows = workflow.update(sql, newPasswordHashed, id, oldPasswordHashed);
            return rows == 1;
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Forgot Password: Update new password by email
    public boolean resetPasswordByEmail(String email, String newPasswordHashed) {
        try {
            return workflow.transaction(() -> {
                int count = workflow.update("UPDATE Staff SET password = ? WHERE email = ? AND username IS NOT NULL",
                        newPasswordHashed, email);
                count = count + workflow.update("UPDATE Customer SET password = ? WHERE email = ? AND username IS NOT NULL",
                        newPasswordHashed, email);
                return count == 1;
            });
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Empty text is saved as NULL (database does not accept "" for gender)
    private String emptyToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    // Convert "yyyy-MM-dd" text to SQL date, empty text becomes NULL
    private Date toDate(String value) {
        if (value == null || value.isBlank() || value.equals("null")) {
            return null;
        }
        return Date.valueOf(value.trim());
    }
}
