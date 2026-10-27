package bssms_persistence.DatNT;

import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import bssms_account.*;
import java.util.List;


public class CustomerDAO extends DBContext implements AutoCloseable {

    private void requireConnection() {
        if (conn == null) throw new DataAccessException("Database connection unavailable");
    }
    @Override public void close() throws java.sql.SQLException { if (conn != null) conn.close(); }

    public List<Customer> getAllCustomerDetails() {
        try { workflow().roles("Manager", "Receptionist", "Technician"); }
        catch (java.sql.SQLException e) { throw new DataAccessException(e); }
        requireConnection();
        List<Customer> list = new ArrayList<>();

        String query = "SELECT c.customer_id, c.full_name, "
                + "c.membership_tier_id AS customer_membership_tier_id, "
                + "a.phone, a.email, a.status, "
                + "mt.membership_tier_id AS tier_id, "
                + "mt.tier_name, mt.description AS tier_description, "
                + "mt.discount_percent, mt.min_spending "
                + "FROM " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c "
                + "JOIN " + bssms_persistence.common.SchemaSql.ACCOUNTS + " a ON c.account_id = a.account_id "
                + "LEFT JOIN MembershipTier mt "
                + "ON c.membership_tier_id = mt.membership_tier_id "
                + "WHERE EXISTS(SELECT 1 FROM " + bssms_persistence.common.SchemaSql.ACCOUNTS + " actor WHERE actor.account_id=? AND actor.status='Active' AND (actor.role IN ('Manager','Receptionist') OR (actor.role='Technician' AND EXISTS(SELECT 1 FROM Appointment ap JOIN AppointmentStaff ast ON ast.appointment_id=ap.appointment_id JOIN " + bssms_persistence.common.SchemaSql.STAFF + " st ON st.staff_id=ast.staff_id WHERE ap.customer_id=c.customer_id AND st.account_id=actor.account_id)))) ORDER BY c.full_name";

        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setInt(1, requireActorAccountId());
                ResultSet rs = ps.executeQuery();

                while (rs.next()) {
                    Customer value = new Customer();

                    value.setCustomerId(rs.getInt("customer_id"));
                    value.setFullName(rs.getString("full_name"));
                    value.setPhone(rs.getString("phone"));
                    value.setEmail(rs.getString("email"));
                    value.setStatus(rs.getString("status"));

                    addMembership(value, rs);

                    list.add(value);
                }
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }

        return list;
    }

    public boolean deactivateCustomer(int customerId) {
        requireConnection();
        try {
            workflow().roles("Manager","Receptionist");
            return new bssms_persistence.common.Workflow(conn,0).update("UPDATE Customer SET status='Inactive' WHERE customer_id=?", customerId) == 1;
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }

    public boolean createWalkInCustomer(String username, String password, String email, String phone, String fullName, String dob, String gender) {
        requireConnection();
        try {
            workflow().roles("Manager","Receptionist");
            return new bssms_persistence.common.Workflow(conn,0).update("INSERT Customer(username,password,email,phone,full_name,date_of_birth,gender,membership_tier_id) VALUES(?,?,?,?,?,?,?,1)", getUniqueUsername(username),bssms_security.PasswordUtil.hashMD5(password),email,phone,fullName,dob,gender) == 1;
        } catch (java.sql.SQLException e) { throw new DataAccessException(e); }
    }

    public Customer getCustomerById(int customerId) {
        try { workflow().customerAccess(customerId); }
        catch (java.sql.SQLException e) { throw new DataAccessException(e); }
        requireConnection();
        Customer value = new Customer();

        String query = "SELECT c.customer_id, c.account_id, "
                + "c.full_name, c.gender, c.date_of_birth, c.address, "
                + "c.membership_tier_id AS customer_membership_tier_id, "
                + "a.phone, a.email, a.status, a.username, "
                + "mt.membership_tier_id AS tier_id, "
                + "mt.tier_name, mt.description AS tier_description, "
                + "mt.discount_percent, mt.min_spending "
                + "FROM " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c "
                + "JOIN " + bssms_persistence.common.SchemaSql.ACCOUNTS + " a ON c.account_id = a.account_id "
                + "LEFT JOIN MembershipTier mt "
                + "ON c.membership_tier_id = mt.membership_tier_id "
                + "WHERE c.customer_id = ?";

        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setInt(1, customerId);

                ResultSet rs = ps.executeQuery();

                if (rs.next()) {
                    value.setCustomerId(rs.getInt("customer_id"));
                    value.setAccountId(rs.getInt("account_id"));
                    value.setFullName(rs.getString("full_name"));
                    value.setPhone(rs.getString("phone"));
                    value.setEmail(rs.getString("email"));
                    value.setStatus(rs.getString("status"));
                    value.setGender(rs.getString("gender"));
                    value.setAddress(rs.getString("address"));
                    value.setUsername(rs.getString("username"));

                    java.sql.Date dob = rs.getDate("date_of_birth");
                    value.setDob(dob != null ? dob.toString() : "");

                    addMembership(value, rs);
                }
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }

        return value;
    }

    private void addMembership(
            Customer value,
            ResultSet rs
    ) throws java.sql.SQLException {

        value.setMembershipTierId(rs.getObject("customer_membership_tier_id", Integer.class)
        );

        MembershipTier membership = null;

        if (rs.getObject("tier_id") != null) {
            membership = new MembershipTier();

            membership.setMembershipTierId(rs.getInt("tier_id")
            );
            membership.setTierName(rs.getString("tier_name")
            );
            membership.setDescription(rs.getString("tier_description")
            );
            membership.setDiscountPercent(rs.getBigDecimal("discount_percent")
            );
            membership.setMinSpending(rs.getBigDecimal("min_spending")
            );
        }

        value.setMembership(membership);
    }

    public boolean updateCustomer(int accountId, String fullName, String phone, String email, String gender, String dob, String address, String status) {
        requireConnection();
        try {
            workflow().roles("Manager","Receptionist");
            return new bssms_persistence.common.Workflow(conn,0).update("UPDATE Customer SET full_name=?,phone=?,email=?,gender=?,date_of_birth=?,address=?,status=? WHERE customer_id=?", fullName,phone,email,gender,(dob==null || dob.isBlank() || "null".equals(dob))?null:java.sql.Date.valueOf(dob),address,status,bssms_common.LoginIdentity.customerId(accountId)) == 1;
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
}
