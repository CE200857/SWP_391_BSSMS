package bssms_persistence.DatNT;

import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import bssms_account.*;


public class ProfileDAO extends DBContext implements AutoCloseable {

    private void requireConnection() {
        if (conn == null) throw new DataAccessException("Database connection unavailable");
    }
    @Override public void close() throws java.sql.SQLException { if (conn != null) conn.close(); }

    public Profile getProfileByAccountId(int accountId, String role) {
        requireConnection();
        Profile value = new Profile();
        String query;

        if ("Customer".equals(role)) {
            query = "SELECT c.customer_id, a.username, a.email, a.phone, a.status, "
                    + "c.full_name, c.date_of_birth, c.gender, c.address, "
                    + "c.membership_tier_id AS customer_membership_tier_id, "
                    + "mt.membership_tier_id AS tier_id, "
                    + "mt.tier_name, mt.description, "
                    + "mt.discount_percent, mt.min_spending "
                    + "FROM " + bssms_persistence.common.SchemaSql.ACCOUNTS + " a "
                    + "JOIN " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c ON a.account_id = c.account_id "
                    + "LEFT JOIN MembershipTier mt "
                    + "ON c.membership_tier_id = mt.membership_tier_id "
                    + "WHERE a.account_id = ?";
        } else {
            query = "SELECT a.username, a.email, a.status, "
                    + "s.full_name, s.phone, s.position AS role "
                    + "FROM " + bssms_persistence.common.SchemaSql.ACCOUNTS + " a "
                    + "JOIN " + bssms_persistence.common.SchemaSql.STAFF + " s ON a.account_id = s.account_id "
                    + "WHERE a.account_id = ?";
        }

        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setInt(1, accountId);

                ResultSet rs = ps.executeQuery();

                if (rs.next()) {
                    value.setUsername(rs.getString("username"));
                    value.setEmail(rs.getString("email"));
                    value.setPhone(rs.getString("phone"));
                    value.setStatus(rs.getString("status"));
                    value.setFullName(rs.getString("full_name"));

                    if ("Customer".equals(role)) {
                        value.setCustomerId(rs.getInt("customer_id"));
                        value.setDob(rs.getDate("date_of_birth"));
                        value.setGender(rs.getString("gender"));
                        value.setAddress(rs.getString("address"));
                        value.setRole("Customer");

                        Integer customerTierId
                                = rs.getObject("customer_membership_tier_id", Integer.class);

                        value.setMembershipTierId(customerTierId);

                        MembershipTier membership = null;

                        if (rs.getObject("tier_id") != null) {
                            membership = new MembershipTier();

                            membership.setMembershipTierId(rs.getInt("tier_id")
                            );
                            membership.setTierName(rs.getString("tier_name")
                            );
                            membership.setDescription(rs.getString("description")
                            );
                            membership.setDiscountPercent(rs.getBigDecimal("discount_percent")
                            );
                            membership.setMinSpending(rs.getBigDecimal("min_spending")
                            );
                        }

                        value.setMembership(membership);
                    } else {
                        value.setRole(rs.getString("role"));
                    }
                }
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }

        return value;
    }

    public boolean isUsernameTaken(String username, int currentAccountId) {
        requireConnection();
        String sql = "SELECT account_id FROM " + bssms_persistence.common.SchemaSql.ACCOUNTS + " Account WHERE username = ? AND account_id != ?";
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
        try {
            return new bssms_persistence.common.Workflow(conn,0).update("UPDATE Customer SET full_name=?,date_of_birth=?,gender=?,phone=?,address=? WHERE customer_id=?", fullName,dob,gender,phone,address,bssms_common.LoginIdentity.customerId(accountId)) == 1;
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }

    public boolean updateCustomerProfile(int accountId, String fullName, String dob, String gender, String phone, String address, String username, String email) {
        requireConnection();
        try {
            return new bssms_persistence.common.Workflow(conn,0).update("UPDATE Customer SET full_name=?,date_of_birth=?,gender=?,phone=?,address=?,username=?,email=? WHERE customer_id=?", fullName,dob,gender,phone,address,username,email,bssms_common.LoginIdentity.customerId(accountId)) == 1;
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }

    public boolean updateStaffProfile(int accountId, String fullName, String phone, String username) {
        requireConnection();
        try {
            return new bssms_persistence.common.Workflow(conn,0).update("UPDATE Staff SET full_name=?,phone=?,username=? WHERE staff_id=?", fullName,phone,username,bssms_common.LoginIdentity.staffId(accountId)) == 1;
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
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
}
