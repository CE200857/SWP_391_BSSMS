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
        try {if (customerId > 0) workflow().customerAccess(customerId); else workflow().roles("Manager", "Receptionist", "Technician");} catch(java.sql.SQLException ex){throw new DataAccessException(ex);}
        requireConnection();
        List<Map<String, Object>> list = new ArrayList<>();
        String query = "SELECT a.customer_id, (SELECT full_name FROM Customer WHERE customer_id=a.customer_id) AS customer_name, a.appointment_id, a.appointment_date, a.start_time, a.end_time, a.status AS appointment_status, "
                     + "a.notes, tr.result_notes, s.service_name, s.price, "
                     + "tp.package_name, cp.remaining_sessions, "
                     + "st.full_name AS staff_name, st.position, "
                     + "f.rating, f.comment AS feedback_comment, f.created_at AS feedback_date "
                     + "FROM Appointment a LEFT JOIN " + bssms_persistence.common.SchemaSql.TREATMENTS + " tr ON tr.appointment_id=a.appointment_id "
                     + "LEFT JOIN Service s ON a.service_id = s.service_id "
                     + "LEFT JOIN CustomerPackage cp ON a.customer_package_id = cp.customer_package_id "
                     + "LEFT JOIN TreatmentPackage tp ON cp.treatment_package_id = tp.treatment_package_id "
                     + "LEFT JOIN AppointmentStaff aps ON a.appointment_id = aps.appointment_id AND aps.role='Main Technician' "
                     + "LEFT JOIN " + bssms_persistence.common.SchemaSql.STAFF + " st ON aps.staff_id = st.staff_id "
                     + "LEFT JOIN " + bssms_persistence.common.SchemaSql.FEEDBACK + " f ON a.appointment_id = f.appointment_id "
                     + "WHERE (?=0 OR a.customer_id = ?) AND " + bssms_persistence.common.Workflow.appointmentScope() + " "
                     + "ORDER BY a.appointment_date DESC, a.start_time DESC";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setInt(1, customerId);
                ps.setInt(2, customerId);
                ps.setInt(3, requireActorAccountId());
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("customerId", rs.getInt("customer_id"));
                    map.put("customerName", rs.getString("customer_name"));
                    map.put("appointmentId", rs.getInt("appointment_id"));
                    map.put("appointmentDate", rs.getDate("appointment_date") != null ? rs.getDate("appointment_date").toString() : null);
                    map.put("startTime", rs.getTime("start_time") != null ? rs.getTime("start_time").toString() : null);
                    map.put("endTime", rs.getTime("end_time") != null ? rs.getTime("end_time").toString() : null);
                    map.put("appointmentStatus", rs.getString("appointment_status"));
                    map.put("notes", rs.getString("notes"));
                    map.put("resultNotes", rs.getString("result_notes"));
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
        try {workflow().customerAccess(customerId);} catch(java.sql.SQLException ex){throw new DataAccessException(ex);}
        requireConnection();
        Map<String, Object> map = new HashMap<>();
        String query = "SELECT c.customer_id,c.full_name,c.date_of_birth,c.gender,c.phone,c.email, "
            + "(SELECT COUNT(*) FROM Appointment WHERE customer_id=c.customer_id) AS total_appointments, "
            + "(SELECT COUNT(*) FROM Appointment WHERE customer_id=c.customer_id AND status='Completed') AS completed_appointments, "
            + "(SELECT COUNT(*) FROM Appointment WHERE customer_id=c.customer_id AND status IN ('Pending','Confirmed')) AS upcoming_appointments, "
            + "(SELECT COUNT(*) FROM CustomerPackage WHERE customer_id=c.customer_id) AS total_packages, "
            + "(SELECT COALESCE(SUM(remaining_sessions),0) FROM CustomerPackage WHERE customer_id=c.customer_id AND status='Active') AS total_remaining_sessions, "
            + "(SELECT COALESCE(AVG(CAST(feedback_rating AS decimal(5,2))),0) FROM Appointment WHERE customer_id=c.customer_id AND feedback_is_hidden=0) AS average_rating "
            + "FROM " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c WHERE c.customer_id=?";
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
        try {workflow().roles("Receptionist","Technician","Manager");workflow().appointmentAccess(appointmentId);} catch(java.sql.SQLException ex){throw new DataAccessException(ex);}
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
        try {workflow().customerAccess(customerId);} catch(java.sql.SQLException ex){throw new DataAccessException(ex);}
        requireConnection();
        List<Map<String, Object>> list = new ArrayList<>();
        String query = "SELECT a.appointment_id, a.appointment_date, a.status, s.service_name, "
                     + "tp.package_name, st.full_name AS staff_name, f.rating, f.comment "
                     + "FROM Appointment a LEFT JOIN " + bssms_persistence.common.SchemaSql.TREATMENTS + " tr ON tr.appointment_id=a.appointment_id "
                     + "LEFT JOIN Service s ON a.service_id = s.service_id "
                     + "LEFT JOIN CustomerPackage cp ON a.customer_package_id = cp.customer_package_id "
                     + "LEFT JOIN TreatmentPackage tp ON cp.treatment_package_id = tp.treatment_package_id "
                     + "LEFT JOIN AppointmentStaff aps ON a.appointment_id = aps.appointment_id AND aps.role='Main Technician' "
                     + "LEFT JOIN " + bssms_persistence.common.SchemaSql.STAFF + " st ON aps.staff_id = st.staff_id "
                     + "LEFT JOIN " + bssms_persistence.common.SchemaSql.FEEDBACK + " f ON a.appointment_id = f.appointment_id "
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
