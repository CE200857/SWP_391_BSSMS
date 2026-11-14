package bssms_persistence.KhanhND;

import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ServiceHistoryDAO extends DBContext {

    private static final String BASE_QUERY
            = "SELECT l.appointment_service_id, a.appointment_id, a.customer_id, c.full_name AS customer_name, "
            + "l.service_id, s.service_name, COALESCE(st.full_name, N'Chưa phân công') AS staff_name, l.technician_id, "
            + "a.appointment_date, l.start_time, l.end_time, a.status, a.notes, l.result_notes, l.skin_reaction, "
            + "l.customer_package_id, l.unit_price, f.rating, f.comment "
            + "FROM AppointmentService l "
            + "INNER JOIN Appointment a ON a.appointment_id = l.appointment_id "
            + "INNER JOIN " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c ON c.customer_id = a.customer_id "
            + "INNER JOIN Service s ON s.service_id = l.service_id "
            + "LEFT JOIN " + bssms_persistence.common.SchemaSql.STAFF + " st ON st.staff_id = l.technician_id "
            + "LEFT JOIN ServiceFeedback f ON f.appointment_service_id = l.appointment_service_id "
            + "WHERE a.status = 'Completed' AND l.status = 'Done' ";

    public List<Map<String, Object>> getHistoryByCustomer(int customerId)
            throws SQLException {
        return queryHistory("AND a.customer_id = ? ", customerId);
    }

    public List<Map<String, Object>> getHistoryByStaff(int staffId)
            throws SQLException {
        String condition
                = "AND l.technician_id = ? ";
        return queryHistory(condition, staffId);
    }

    public List<Map<String, Object>> getHistoryForManagerOrReceptionist(Integer customerId)
            throws SQLException {
        if (customerId == null) {
            return queryHistory("", null);
        }
        return queryHistory("AND a.customer_id = ? ", customerId);
    }

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
                + "ORDER BY a.appointment_date DESC, l.start_time DESC, l.appointment_service_id DESC";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            if (id != null) {
                ps.setInt(1, id);
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("appointmentServiceId", rs.getInt("appointment_service_id"));
                    item.put("appointmentId", rs.getInt("appointment_id"));
                    item.put("serviceId", rs.getInt("service_id"));
                    item.put("resultNotes", rs.getString("result_notes"));
                    item.put("skinReaction", rs.getString("skin_reaction"));
                    item.put("usedPackage", rs.getObject("customer_package_id") != null);
                    item.put("unitPrice", rs.getBigDecimal("unit_price"));
                    item.put("rating", rs.getObject("rating"));
                    item.put("comment", rs.getString("comment"));
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
