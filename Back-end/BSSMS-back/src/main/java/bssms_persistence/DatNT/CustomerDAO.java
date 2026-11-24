package bssms_persistence.DatNT;

import bssms_account.Customer;
import bssms_account.MembershipTier;
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

public class CustomerDAO extends DBContext implements AutoCloseable {

    private final Workflow workflow = new Workflow(conn, 0);

    @Override
    public void close() throws SQLException {
        conn.close();
    }

    // Check if logged in user has one of the allowed roles
    private void checkRole(String... roles) {
        try {
            workflow().roles(roles);
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Check if logged in user can view this customer
    private void checkCustomerAccess(int customerId) {
        try {
            workflow().customerAccess(customerId);
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // View customer list
    // Manager, Receptionist see all; Technician only sees customers they served
    public List<Customer> getAllCustomerDetails() {
        checkRole("Manager", "Receptionist", "Technician");

        String sql = "SELECT c.customer_id, c.full_name, "
                + "c.membership_tier_id AS customer_membership_tier_id, "
                + "a.phone, a.email, a.status, "
                + "mt.membership_tier_id AS tier_id, "
                + "mt.tier_name, mt.description AS tier_description, "
                + "mt.discount_percent, mt.min_spending "
                + "FROM " + SchemaSql.CUSTOMERS + " c "
                + "JOIN " + SchemaSql.ACCOUNTS + " a ON c.account_id = a.account_id "
                + "LEFT JOIN MembershipTier mt ON c.membership_tier_id = mt.membership_tier_id "
                + "WHERE NOT EXISTS(SELECT 1 FROM Customer d WHERE d.customer_id = c.customer_id AND d.deleted_at IS NOT NULL) "
                + "AND EXISTS(SELECT 1 FROM " + SchemaSql.ACCOUNTS + " actor "
                + "  WHERE actor.account_id = ? AND actor.status = 'Active' "
                + "  AND (actor.role IN ('Manager','Receptionist') "
                + "       OR (actor.role = 'Technician' AND EXISTS(SELECT 1 FROM Appointment ap "
                + "           JOIN AppointmentService l ON l.appointment_id = ap.appointment_id "
                + "           WHERE ap.customer_id = c.customer_id AND l.technician_id = actor.staff_id)))) "
                + "ORDER BY c.full_name";

        List<Customer> list = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, requireActorAccountId());
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Customer customer = new Customer();
                customer.setCustomerId(rs.getInt("customer_id"));
                customer.setFullName(rs.getString("full_name"));
                customer.setPhone(rs.getString("phone"));
                customer.setEmail(rs.getString("email"));
                customer.setStatus(rs.getString("status"));
                addMembership(customer, rs);
                list.add(customer);
            }
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
        return list;
    }

    // Delete customer: soft delete (keep customer and history)
    // Cannot delete if customer has upcoming appointments or unpaid invoices
    public void deleteCustomer(int customerId) {
        checkRole("Manager");
        try {
            workflow.transaction(() -> {
                String countSql = "SELECT "
                        + "(SELECT COUNT(*) FROM Appointment WHERE customer_id = ? "
                        + "   AND status IN ('Pending','Confirmed','Checked-in','In-progress')) AS appointments, "
                        + "(SELECT COUNT(*) FROM Invoice WHERE customer_id = ? AND status = 'Unpaid') AS invoices";
                Map<String, Object> row = workflow.one(countSql, customerId, customerId);
                int openAppointments = Workflow.id(row.get("appointments"));
                int unpaidInvoices = Workflow.id(row.get("invoices"));
                if (openAppointments > 0 || unpaidInvoices > 0) {
                    throw new WorkflowException(409,
                            "The customer still has upcoming appointments or unpaid invoices. Cancel or finish them before deleting.");
                }

                int rows = workflow.update("UPDATE Customer SET status = 'Inactive', deleted_at = SYSDATETIME() "
                        + "WHERE customer_id = ? AND deleted_at IS NULL", customerId);
                if (rows != 1) {
                    throw new WorkflowException(404, "Customer not found.");
                }
                return true;
            });
        } catch (SQLException e) {
            // 547 = SQL Server foreign key error
            if (e.getErrorCode() == 547) {
                throw new WorkflowException(409,
                        "The customer has related data and cannot be deleted. Change the status to \"Inactive\" instead.");
            }
            throw new DataAccessException(e);
        }
    }

    // Create customer account (by receptionist / manager)
    public boolean createWalkInCustomer(String username, String password, String email, String phone,
            String fullName, String dob, String gender) {
        checkRole("Manager", "Receptionist");

        String finalUsername = getUniqueUsername(username);
        String hashedPassword = PasswordUtil.hashMD5(password);
        String sql = "INSERT Customer(username, password, email, phone, full_name, date_of_birth, gender, membership_tier_id) "
                + "VALUES(?, ?, ?, ?, ?, ?, ?, 1)";
        try {
            int rows = workflow.update(sql, finalUsername, hashedPassword, emptyToNull(email), phone, fullName,
                    toDate(dob), emptyToNull(gender));
            return rows == 1;
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Create walk-in profile (no username / password), return new customer_id
    public int createWalkInProfile(String fullName, String phone, String gender) {
        checkRole("Manager", "Receptionist");
        try {
            return workflow.transaction(() -> {
                String duplicateField = checkDuplicate(null, null, phone, null);
                if (duplicateField != null) {
                    throw new WorkflowException(409, duplicateField + " already exists in the system.");
                }

                String sql = "INSERT Customer(username, password, email, phone, full_name, gender, membership_tier_id, status) "
                        + "OUTPUT inserted.customer_id "
                        + "VALUES(NULL, NULL, NULL, ?, ?, ?, 1, 'Active')";
                Map<String, Object> row = workflow.one(sql, phone, fullName, gender);
                return Workflow.id(row.get("customerId"));
            });
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // View one customer
    public Customer getCustomerById(int customerId) {
        checkCustomerAccess(customerId);

        String sql = "SELECT c.customer_id, c.account_id, "
                + "c.full_name, c.gender, c.date_of_birth, c.address, "
                + "c.membership_tier_id AS customer_membership_tier_id, "
                + "a.phone, a.email, a.status, a.username, "
                + "mt.membership_tier_id AS tier_id, "
                + "mt.tier_name, mt.description AS tier_description, "
                + "mt.discount_percent, mt.min_spending "
                + "FROM " + SchemaSql.CUSTOMERS + " c "
                + "JOIN " + SchemaSql.ACCOUNTS + " a ON c.account_id = a.account_id "
                + "LEFT JOIN MembershipTier mt ON c.membership_tier_id = mt.membership_tier_id "
                + "WHERE c.customer_id = ?";

        Customer customer = new Customer();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, customerId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                customer.setCustomerId(rs.getInt("customer_id"));
                customer.setAccountId(rs.getInt("account_id"));
                customer.setFullName(rs.getString("full_name"));
                customer.setPhone(rs.getString("phone"));
                customer.setEmail(rs.getString("email"));
                customer.setStatus(rs.getString("status"));
                customer.setGender(rs.getString("gender"));
                customer.setAddress(rs.getString("address"));
                customer.setUsername(rs.getString("username"));

                Date dob = rs.getDate("date_of_birth");
                if (dob != null) {
                    customer.setDob(dob.toString());
                } else {
                    customer.setDob("");
                }

                addMembership(customer, rs);
            }
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
        return customer;
    }

    // Read membership tier from result and attach to customer
    private void addMembership(Customer customer, ResultSet rs) throws SQLException {
        customer.setMembershipTierId(rs.getObject("customer_membership_tier_id", Integer.class));

        MembershipTier membership = null;
        if (rs.getObject("tier_id") != null) {
            membership = new MembershipTier();
            membership.setMembershipTierId(rs.getInt("tier_id"));
            membership.setTierName(rs.getString("tier_name"));
            membership.setDescription(rs.getString("tier_description"));
            membership.setDiscountPercent(rs.getBigDecimal("discount_percent"));
            membership.setMinSpending(rs.getBigDecimal("min_spending"));
        }
        customer.setMembership(membership);
    }

    // Change status Active / Inactive (Manager only)
    public boolean updateCustomerStatus(int customerId, String status) {
        checkRole("Manager");
        try {
            int rows = workflow.update("UPDATE Customer SET status = ? WHERE customer_id = ? AND deleted_at IS NULL",
                    status, customerId);
            return rows == 1;
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }

    // Update customer information (deleted customer cannot be updated or turned Active again)
    public boolean updateCustomer(int accountId, String fullName, String phone, String email, String gender,
            String dob, String address, String status) {
        checkRole("Manager", "Receptionist");

        int customerId = LoginIdentity.customerId(accountId);
        String sql = "UPDATE Customer SET full_name = ?, phone = ?, email = ?, gender = ?, "
                + "date_of_birth = ?, address = ?, status = ? WHERE customer_id = ? AND deleted_at IS NULL";
        try {
            int rows = workflow.update(sql, fullName, phone, emptyToNull(email), emptyToNull(gender),
                    toDate(dob), address, status, customerId);
            return rows == 1;
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
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
