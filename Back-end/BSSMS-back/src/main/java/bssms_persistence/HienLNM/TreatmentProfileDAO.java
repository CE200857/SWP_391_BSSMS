package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class TreatmentProfileDAO extends DBContext implements AutoCloseable {

    private void requireConnection() {
        if (conn == null) throw new DataAccessException("Database connection unavailable");
    }
    @Override public void close() throws java.sql.SQLException { if (conn != null) conn.close(); }

    // Lấy hồ sơ điều trị theo customer ID
    public List<Map<String, Object>> getTreatmentProfilesByCustomerId(int customerId) {
        requireConnection();
        List<Map<String, Object>> list = new ArrayList<>();
        String query = "SELECT a.appointment_id, a.appointment_date, a.start_time, a.end_time, a.status AS appointment_status, "
                     + "a.notes, s.service_name, s.price, "
                     + "tp.package_name, cp.remaining_sessions, "
                     + "st.full_name AS staff_name, st.position, "
                     + "f.rating, f.comment AS feedback_comment, f.created_at AS feedback_date "
                     + "FROM Appointment a "
                     + "LEFT JOIN Service s ON a.service_id = s.service_id "
                     + "LEFT JOIN CustomerPackage cp ON a.customer_package_id = cp.customer_package_id "
                     + "LEFT JOIN TreatmentPackage tp ON cp.treatment_package_id = tp.treatment_package_id "
                     + "LEFT JOIN AppointmentStaff aps ON a.appointment_id = aps.appointment_id "
                     + "LEFT JOIN Staff st ON aps.staff_id = st.staff_id "
                     + "LEFT JOIN Feedback f ON a.appointment_id = f.appointment_id "
                     + "WHERE a.customer_id = ? "
                     + "ORDER BY a.appointment_date DESC, a.start_time DESC";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setInt(1, customerId);
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("appointmentId", rs.getInt("appointment_id"));
                    map.put("appointmentDate", rs.getDate("appointment_date") != null ? rs.getDate("appointment_date").toString() : null);
                    map.put("startTime", rs.getTime("start_time") != null ? rs.getTime("start_time").toString() : null);
                    map.put("endTime", rs.getTime("end_time") != null ? rs.getTime("end_time").toString() : null);
                    map.put("appointmentStatus", rs.getString("appointment_status"));
                    map.put("notes", rs.getString("notes"));
                    map.put("serviceName", rs.getString("service_name"));
                    map.put("price", rs.getDouble("price"));
                    map.put("packageName", rs.getString("package_name"));
                    map.put("remainingSessions", rs.getInt("remaining_sessions"));
                    map.put("staffName", rs.getString("staff_name"));
                    map.put("position", rs.getString("position"));
                    map.put("rating", rs.getInt("rating"));
                    map.put("feedbackComment", rs.getString("feedback_comment"));
                    map.put("feedbackDate", rs.getTimestamp("feedback_date") != null ? rs.getTimestamp("feedback_date").toString() : null);
                    list.add(map);
                }
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return list;
    }

    // Lấy tổng quan hồ sơ điều trị
    public Map<String, Object> getTreatmentSummary(int customerId) {
        requireConnection();
        Map<String, Object> map = new HashMap<>();
        String query = "SELECT c.customer_id, c.full_name, c.date_of_birth, c.gender, c.phone, "
                     + "a.email, "
                     + "COUNT(DISTINCT ap.appointment_id) AS total_appointments, "
                     + "SUM(CASE WHEN ap.status = 'Completed' THEN 1 ELSE 0 END) AS completed_appointments, "
                     + "SUM(CASE WHEN ap.status = 'Scheduled' THEN 1 ELSE 0 END) AS upcoming_appointments, "
                     + "COUNT(DISTINCT cp.customer_package_id) AS total_packages, "
                     + "COALESCE(SUM(cp.remaining_sessions), 0) AS total_remaining_sessions, "
                     + "COALESCE(AVG(f.rating), 0) AS average_rating "
                     + "FROM Customer c "
                     + "JOIN Account a ON c.account_id = a.account_id "
                     + "LEFT JOIN Appointment ap ON c.customer_id = ap.customer_id "
                     + "LEFT JOIN CustomerPackage cp ON c.customer_id = cp.customer_id "
                     + "LEFT JOIN Feedback f ON c.customer_id = f.customer_id "
                     + "WHERE c.customer_id = ? "
                     + "GROUP BY c.customer_id, c.full_name, c.date_of_birth, c.gender, c.phone, a.email";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setInt(1, customerId);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    map.put("customerId", rs.getInt("customer_id"));
                    map.put("fullName", rs.getString("full_name"));
                    map.put("dateOfBirth", rs.getDate("date_of_birth") != null ? rs.getDate("date_of_birth").toString() : null);
                    map.put("gender", rs.getString("gender"));
                    map.put("phone", rs.getString("phone"));
                    map.put("email", rs.getString("email"));
                    map.put("totalAppointments", rs.getInt("total_appointments"));
                    map.put("completedAppointments", rs.getInt("completed_appointments"));
                    map.put("upcomingAppointments", rs.getInt("upcoming_appointments"));
                    map.put("totalPackages", rs.getInt("total_packages"));
                    map.put("totalRemainingSessions", rs.getInt("total_remaining_sessions"));
                    map.put("averageRating", rs.getDouble("average_rating"));
                }
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return map;
    }

    // Cập nhật ghi chú điều trị
    public boolean updateAppointmentNotes(int appointmentId, String notes) {
        requireConnection();
        String query = "UPDATE Appointment SET notes = ? WHERE appointment_id = ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setString(1, notes);
                ps.setInt(2, appointmentId);
                int rowsAffected = ps.executeUpdate();
                return rowsAffected > 0;
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return false;
    }

    // Lấy lịch sử điều trị
    public List<Map<String, Object>> getTreatmentHistory(int customerId) {
        requireConnection();
        List<Map<String, Object>> list = new ArrayList<>();
        String query = "SELECT a.appointment_id, a.appointment_date, a.status, s.service_name, "
                     + "tp.package_name, st.full_name AS staff_name, f.rating, f.comment "
                     + "FROM Appointment a "
                     + "LEFT JOIN Service s ON a.service_id = s.service_id "
                     + "LEFT JOIN CustomerPackage cp ON a.customer_package_id = cp.customer_package_id "
                     + "LEFT JOIN TreatmentPackage tp ON cp.treatment_package_id = tp.treatment_package_id "
                     + "LEFT JOIN AppointmentStaff aps ON a.appointment_id = aps.appointment_id "
                     + "LEFT JOIN Staff st ON aps.staff_id = st.staff_id "
                     + "LEFT JOIN Feedback f ON a.appointment_id = f.appointment_id "
                     + "WHERE a.customer_id = ? AND a.status = 'Completed' "
                     + "ORDER BY a.appointment_date DESC";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setInt(1, customerId);
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("appointmentId", rs.getInt("appointment_id"));
                    map.put("appointmentDate", rs.getDate("appointment_date") != null ? rs.getDate("appointment_date").toString() : null);
                    map.put("status", rs.getString("status"));
                    map.put("serviceName", rs.getString("service_name"));
                    map.put("packageName", rs.getString("package_name"));
                    map.put("staffName", rs.getString("staff_name"));
                    map.put("rating", rs.getInt("rating"));
                    map.put("comment", rs.getString("comment"));
                    list.add(map);
                }
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return list;
    }
}
