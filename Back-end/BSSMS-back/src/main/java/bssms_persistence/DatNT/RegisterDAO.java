package bssms_persistence.DatNT;

import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import bssms_account.*;


public class RegisterDAO extends DBContext implements AutoCloseable {

    private void requireConnection() {
        if (conn == null) throw new DataAccessException("Database connection unavailable");
    }
    @Override public void close() throws java.sql.SQLException { if (conn != null) conn.close(); }

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

    public Account authenticateUser(String emailOrPhone, String password) {
        requireConnection();
        try {
            return new bssms_persistence.common.Workflow(conn,0).query(rs -> {
                Account a=new Account();
                a.setAccountId(rs.getInt("account_id")); a.setIdentityVersion(2);
                a.setStaffId(rs.getObject("staff_id",Integer.class));
                a.setCustomerId(rs.getObject("customer_id",Integer.class));
                a.setUsername(rs.getString("username")); a.setFullName(rs.getString("full_name"));
                a.setEmail(rs.getString("email")); a.setPhone(rs.getString("phone"));
                a.setRole(rs.getString("role")); a.setStatus(rs.getString("status")); return a;
            }, "SELECT * FROM " + bssms_persistence.common.SchemaSql.ACCOUNTS + " Account WHERE (email=? OR phone=?) AND password=?",emailOrPhone,emailOrPhone,password)
                .stream().findFirst().orElse(null);
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }

    public boolean createAccount(String username, String password, String email) {
        requireConnection();
        try {
            return new bssms_persistence.common.Workflow(conn,0).update("INSERT Customer(username,password,email,full_name,membership_tier_id) VALUES(?,?,?,?,1)", username,password,email,username) == 1;
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }

    public boolean saveVerificationCode(String email,String otp) { return saveVerificationCode(email,otp,"Registration"); }
    public boolean saveVerificationCode(String email,String otp,String purpose) {
        requireConnection();
        try {
            bssms_persistence.common.Workflow w=new bssms_persistence.common.Workflow(conn,0);
            return w.transaction(()->{
                if(!w.query("SELECT email FROM VerificationCode WHERE email=? AND created_at>DATEADD(second,-60,GETDATE())",email).isEmpty())
                    throw new bssms_persistence.common.WorkflowException(429,"Vui lòng chờ 60 giây trước khi gửi lại OTP.");
                w.update("DELETE FROM VerificationCode WHERE email=?",email);
                return w.update("INSERT VerificationCode(email,otp_code,purpose,expiry_time,customer_id,staff_id) SELECT ?,?,?,DATEADD(minute,5,GETDATE()),(SELECT customer_id FROM Customer WHERE email=?),(SELECT staff_id FROM Staff WHERE email=?)",email,otp,purpose,email,email)==1;
            });
        } catch(java.sql.SQLException e) { throw new DataAccessException(e); }
    }
    public boolean verifyCode(String email,String otp) { return verifyCode(email,otp,"Registration"); }
    public boolean verifyCode(String email,String otp,String purpose) {
        requireConnection();
        try {
            bssms_persistence.common.Workflow w=new bssms_persistence.common.Workflow(conn,0);
            return w.transaction(()->{
                int changed=w.update("UPDATE VerificationCode SET attempts=attempts+1 WHERE email=? AND purpose=? AND consumed_at IS NULL AND attempts<5 AND expiry_time>GETDATE()",email,purpose);
                if(changed==0)return false;
                return w.update("UPDATE VerificationCode SET consumed_at=GETDATE() WHERE email=? AND purpose=? AND otp_code=? AND consumed_at IS NULL AND expiry_time>GETDATE() AND attempts<=5",email,purpose,otp)==1;
            });
        } catch(java.sql.SQLException e) { throw new DataAccessException(e); }
    }

    public void deleteVerificationCode(String email) {
        requireConnection();
        String sql = "DELETE FROM VerificationCode WHERE email = ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setString(1, email);
                ps.executeUpdate();
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
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
            boolean customer=accountId%2==1;
            int id=customer?bssms_common.LoginIdentity.customerId(accountId):bssms_common.LoginIdentity.staffId(accountId);
            String sql=customer?"UPDATE Customer SET password=? WHERE customer_id=? AND password=?":"UPDATE Staff SET password=? WHERE staff_id=? AND password=?";
            return new bssms_persistence.common.Workflow(conn,0).update(sql,newPasswordHashed,id,oldPasswordHashed)==1;
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }

    public boolean resetPasswordByEmail(String email, String newPasswordHashed) {
        requireConnection();
        try {
            bssms_persistence.common.Workflow w=new bssms_persistence.common.Workflow(conn,0);
            return w.transaction(() -> {
                int count=w.update("UPDATE Staff SET password=? WHERE email=? AND username IS NOT NULL",newPasswordHashed,email);
                count+=w.update("UPDATE Customer SET password=? WHERE email=? AND username IS NOT NULL",newPasswordHashed,email);
                return count==1;
            });
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }
}