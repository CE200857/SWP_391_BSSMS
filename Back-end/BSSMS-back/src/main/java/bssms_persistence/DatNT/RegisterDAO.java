package bssms_persistence.DatNT;

import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.HashMap;
import java.util.Map;

public class RegisterDAO extends DBContext {

    public String checkDuplicate(String username, String email, String phone, Integer excludeAccountId) {
        if (username != null && username.trim().isEmpty()) username = null;
        if (email != null && email.trim().isEmpty()) email = null;
        if (phone != null && phone.trim().isEmpty()) phone = null;

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

    public Map<String, Object> authenticateUser(String emailOrPhone, String password) {
        Map<String, Object> userMap = null;
        String query = "SELECT a.account_id, a.email, a.status, a.role, "
                     + "c.full_name AS customer_name, "
                     + "s.full_name AS staff_name "
                     + "FROM Account a "
                     + "LEFT JOIN Customer c ON a.account_id = c.account_id "
                     + "LEFT JOIN Staff s ON a.account_id = s.account_id "
                     + "WHERE (a.email = ? OR a.phone = ?) AND a.password = ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setString(1, emailOrPhone);
                ps.setString(2, emailOrPhone);
                ps.setString(3, password);

                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    userMap = new HashMap<>();
                    userMap.put("accountId", rs.getInt("account_id"));
                    userMap.put("email", rs.getString("email"));
                    userMap.put("status", rs.getString("status"));

                    String role = rs.getString("role");
                    userMap.put("role", role);

                    if ("Customer".equals(role)) {
                        userMap.put("fullName", rs.getString("customer_name"));
                    } else {
                        userMap.put("fullName", rs.getString("staff_name"));
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return userMap;
    }

    public boolean createAccount(String username, String password, String email) {
        String sql = "INSERT INTO Account (username, password, email, status, role) VALUES (?, ?, ?, 'Active', 'Customer')";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setString(1, username);
                ps.setString(2, password);
                ps.setString(3, email);
                return ps.executeUpdate() > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean saveVerificationCode(String email, String otpCode) {
        String sql = "IF EXISTS (SELECT 1 FROM VerificationCode WHERE email = ?) "
                   + "UPDATE VerificationCode SET otp_code = ?, expiry_time = DATEADD(MINUTE, 5, GETDATE()), created_at = GETDATE() WHERE email = ? "
                   + "ELSE "
                   + "INSERT INTO VerificationCode (email, otp_code, expiry_time) VALUES (?, ?, DATEADD(MINUTE, 5, GETDATE()))";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setString(1, email);
                ps.setString(2, otpCode);
                ps.setString(3, email);
                ps.setString(4, email);
                ps.setString(5, otpCode);
                return ps.executeUpdate() > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean verifyCode(String email, String otpCode) {
        String sql = "SELECT otp_code FROM VerificationCode WHERE email = ? AND otp_code = ? AND expiry_time > GETDATE()";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setString(1, email);
                ps.setString(2, otpCode);
                ResultSet rs = ps.executeQuery();
                return rs.next();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public void deleteVerificationCode(String email) {
        String sql = "DELETE FROM VerificationCode WHERE email = ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setString(1, email);
                ps.executeUpdate();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public boolean isSameOldPasswordByEmail(String email, String newPasswordHashed) {
        String sql = "SELECT account_id FROM Account WHERE email = ? AND password = ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setString(1, email);
                ps.setString(2, newPasswordHashed);
                ResultSet rs = ps.executeQuery();
                return rs.next();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean changePassword(int accountId, String oldPasswordHashed, String newPasswordHashed) {
        String checkSql = "SELECT account_id FROM Account WHERE account_id = ? AND password = ?";
        String updateSql = "UPDATE Account SET password = ? WHERE account_id = ?";
        try {
            if (conn != null) {
                PreparedStatement psCheck = conn.prepareStatement(checkSql);
                psCheck.setInt(1, accountId);
                psCheck.setString(2, oldPasswordHashed);
                ResultSet rs = psCheck.executeQuery();

                if (rs.next()) {
                    PreparedStatement psUpdate = conn.prepareStatement(updateSql);
                    psUpdate.setString(1, newPasswordHashed);
                    psUpdate.setInt(2, accountId);
                    return psUpdate.executeUpdate() > 0;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean resetPasswordByEmail(String email, String newPasswordHashed) {
        String updateSql = "UPDATE Account SET password = ? WHERE email = ?";
        try {
            if (conn != null) {
                PreparedStatement psUpdate = conn.prepareStatement(updateSql);
                psUpdate.setString(1, newPasswordHashed);
                psUpdate.setString(2, email);
                return psUpdate.executeUpdate() > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }
}