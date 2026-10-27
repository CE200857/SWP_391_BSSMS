package bssms_persistence.KhanhND;

import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Read-only queries for completed service appointments. This DAO does not
 * update Appointment or any other table.
 */
public class ServiceHistoryDAO extends DBContext {

    private static final String BASE_QUERY
            = "SELECT "
            + "a.appointment_id, "
            + "a.customer_id, "
            + "c.full_name AS customer_name, "
            + "COALESCE(s.service_name, N'Không xác định') AS service_name, "
            + "ISNULL(NULLIF(STUFF(( "
            + "    SELECT N', ' + st2.full_name "
            + "    FROM AppointmentStaff ast2 "
            + "    INNER JOIN " + bssms_persistence.common.SchemaSql.STAFF + " st2 ON st2.staff_id = ast2.staff_id "
            + "    WHERE ast2.appointment_id = a.appointment_id "
            + "    ORDER BY st2.full_name "
            + "    FOR XML PATH(''), TYPE "
            + ").value('.', 'NVARCHAR(MAX)'), 1, 2, N''), N''), N'Chưa phân công') AS staff_name, "
            + "a.appointment_date, "
            + "a.start_time, "
            + "a.end_time, "
            + "a.status, "
            + "a.notes "
            + "FROM Appointment a "
            + "INNER JOIN " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c ON c.customer_id = a.customer_id "
            + "LEFT JOIN Service s ON s.service_id = a.service_id "
            + "WHERE LOWER(LTRIM(RTRIM(a.status))) = 'completed' ";

    /**
     * Returns the current customer's completed service history.
     */
    public List<Map<String, Object>> getHistoryByCustomer(int customerId)
            throws SQLException {
        return queryHistory("AND a.customer_id = ? ", customerId);
    }

    /**
     * Returns completed appointments assigned to the specified staff member.
     */
    public List<Map<String, Object>> getHistoryByStaff(int staffId)
            throws SQLException {
        String condition
                = "AND EXISTS ("
                + " SELECT 1 FROM AppointmentStaff ast_filter "
                + " WHERE ast_filter.appointment_id = a.appointment_id "
                + " AND ast_filter.staff_id = ?"
                + ") ";
        return queryHistory(condition, staffId);
    }

    /**
     * Returns all completed service history, optionally filtered by customer.
     */
    public List<Map<String, Object>> getHistoryForManagerOrReceptionist(Integer customerId)
            throws SQLException {
        if (customerId == null) {
            return queryHistory("", null);
        }
        return queryHistory("AND a.customer_id = ? ", customerId);
    }

    /**
     * Resolves the Customer record linked to a logged-in account.
     */
    public Integer findCustomerIdByAccountId(int accountId) throws SQLException {
        String sql = "SELECT customer_id FROM " + bssms_persistence.common.SchemaSql.CUSTOMERS + " Customer WHERE account_id = ?";

        if (conn == null) {
            throw new SQLException("Database connection is not available.");
        }

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, accountId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("customer_id");
                }
            }
        }
        return null;
    }

    /**
     * Resolves the Staff record linked to a logged-in account.
     */
    public Integer findStaffIdByAccountId(int accountId) throws SQLException {
        String sql = "SELECT staff_id FROM " + bssms_persistence.common.SchemaSql.STAFF + " Staff WHERE account_id = ?";

        if (conn == null) {
            throw new SQLException("Database connection is not available.");
        }

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, accountId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("staff_id");
                }
            }
        }
        return null;
    }

    private List<Map<String, Object>> queryHistory(String extraCondition, Integer id)
            throws SQLException {
        List<Map<String, Object>> history = new ArrayList<>();

        if (conn == null) {
            throw new SQLException("Database connection is not available.");
        }

        String sql = BASE_QUERY + extraCondition
                + "ORDER BY a.appointment_date DESC, a.start_time DESC, a.appointment_id DESC";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            if (id != null) {
                ps.setInt(1, id);
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("appointmentId", rs.getInt("appointment_id"));
                    item.put("customerId", rs.getInt("customer_id"));
                    item.put("customerName", rs.getString("customer_name"));
                    item.put("serviceName", rs.getString("service_name"));
                    item.put("staffName", rs.getString("staff_name"));

                    java.sql.Date appointmentDate = rs.getDate("appointment_date");
                    java.sql.Time startTime = rs.getTime("start_time");
                    java.sql.Time endTime = rs.getTime("end_time");
                    item.put("appointmentDate",
                            appointmentDate == null ? null : appointmentDate.toString());
                    item.put("startTime", startTime == null ? null : startTime.toString());
                    item.put("endTime", endTime == null ? null : endTime.toString());
                    item.put("status", rs.getString("status"));
                    item.put("notes", rs.getString("notes"));
                    history.add(item);
                }
            }
        }

        return history;
    }
}
