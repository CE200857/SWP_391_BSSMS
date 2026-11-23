package bssms_persistence.DatNT;

import bssms_account.MembershipTier;
import bssms_account.Profile;
import bssms_common.LoginIdentity;
import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import bssms_persistence.common.SchemaSql;
import bssms_persistence.common.Workflow;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class ProfileDAO extends DBContext implements AutoCloseable {

    private final Workflow workflow = new Workflow(conn, 0);

    @Override
    public void close() throws SQLException {
        conn.close();
    }

    // Get current account status in database (Active / Inactive / Locked), null if not found
    public String getStatus(int accountId) {
        String sql = "SELECT status FROM " + SchemaSql.ACCOUNTS + " Account WHERE account_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, accountId);
            ResultSet rs = ps.executeQuery();
            if (!rs.next()) {
                return null;
            }
            return rs.getString("status");
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // View profile by account (customer and staff are in 2 different tables)
    public Profile getProfileByAccountId(int accountId, String role) {
        boolean isCustomer = "Customer".equals(role);

        String sql;
        if (isCustomer) {
            sql = "SELECT c.customer_id, a.username, a.email, a.phone, a.status, "
                    + "c.full_name, c.date_of_birth, c.gender, c.address, "
                    + "c.membership_tier_id AS customer_membership_tier_id, "
                    + "mt.membership_tier_id AS tier_id, "
                    + "mt.tier_name, mt.description, "
                    + "mt.discount_percent, mt.min_spending "
                    + "FROM " + SchemaSql.ACCOUNTS + " a "
                    + "JOIN " + SchemaSql.CUSTOMERS + " c ON a.account_id = c.account_id "
                    + "LEFT JOIN MembershipTier mt ON c.membership_tier_id = mt.membership_tier_id "
                    + "WHERE a.account_id = ?";
        } else {
            sql = "SELECT a.username, a.email, a.status, "
                    + "s.full_name, s.phone, s.position AS role "
                    + "FROM " + SchemaSql.ACCOUNTS + " a "
                    + "JOIN " + SchemaSql.STAFF + " s ON a.account_id = s.account_id "
                    + "WHERE a.account_id = ?";
        }

        Profile profile = new Profile();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, accountId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                profile.setUsername(rs.getString("username"));
                profile.setEmail(rs.getString("email"));
                profile.setPhone(rs.getString("phone"));
                profile.setStatus(rs.getString("status"));
                profile.setFullName(rs.getString("full_name"));

                if (isCustomer) {
                    profile.setCustomerId(rs.getInt("customer_id"));
                    profile.setDob(rs.getDate("date_of_birth"));
                    profile.setGender(rs.getString("gender"));
                    profile.setAddress(rs.getString("address"));
                    profile.setRole("Customer");
                    profile.setMembershipTierId(rs.getObject("customer_membership_tier_id", Integer.class));

                    MembershipTier membership = null;
                    if (rs.getObject("tier_id") != null) {
                        membership = new MembershipTier();
                        membership.setMembershipTierId(rs.getInt("tier_id"));
                        membership.setTierName(rs.getString("tier_name"));
                        membership.setDescription(rs.getString("description"));
                        membership.setDiscountPercent(rs.getBigDecimal("discount_percent"));
                        membership.setMinSpending(rs.getBigDecimal("min_spending"));
                    }
                    profile.setMembership(membership);
                } else {
                    profile.setRole(rs.getString("role"));
                }
            }
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
        return profile;
    }

    // Create profile: customer fills profile for the first time
    public boolean createCustomerProfile(int accountId, String fullName, String dob, String gender,
            String phone, String address) {
        try {
            int customerId = LoginIdentity.customerId(accountId);
            String sql = "UPDATE Customer SET full_name = ?, date_of_birth = ?, gender = ?, phone = ?, address = ? "
                    + "WHERE customer_id = ?";
            int rows = workflow.update(sql, fullName, toDate(dob), emptyToNull(gender), phone, address, customerId);
            return rows == 1;
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Update profile: customer
    public boolean updateCustomerProfile(int accountId, String fullName, String dob, String gender,
            String phone, String address, String username, String email) {
        try {
            int customerId = LoginIdentity.customerId(accountId);
            String sql = "UPDATE Customer SET full_name = ?, date_of_birth = ?, gender = ?, phone = ?, "
                    + "address = ?, username = ?, email = ? WHERE customer_id = ?";
            int rows = workflow.update(sql, fullName, toDate(dob), emptyToNull(gender), phone, address,
                    username, emptyToNull(email), customerId);
            return rows == 1;
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Update profile: staff
    public boolean updateStaffProfile(int accountId, String fullName, String phone, String username) {
        try {
            int staffId = LoginIdentity.staffId(accountId);
            String sql = "UPDATE Staff SET full_name = ?, phone = ?, username = ? WHERE staff_id = ?";
            int rows = workflow.update(sql, fullName, phone, username, staffId);
            return rows == 1;
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Empty text is saved as NULL (database does not accept "" for email and gender)
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
