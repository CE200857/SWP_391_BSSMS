package bssms_persistence.KhanhND;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import bssms_persistence.DBContext;

public class AppointmentDAO extends DBContext {

    // View Appointment List
    public List<Map<String, Object>> getAllAppointmentDetails() {

        List<Map<String, Object>> list = new ArrayList<>();

        String query = "SELECT "
                + "a.appointment_id, "
                + "c.full_name AS customer_name, "
                + "s.service_name, "
                + "st.full_name AS staff_name, "
                + "r.room_name, "
                + "a.appointment_date, "
                + "a.start_time, "
                + "a.end_time, "
                + "a.status "
                + "FROM Appointment a "
                + "JOIN Customer c "
                + "ON a.customer_id = c.customer_id "
                + "JOIN Service s "
                + "ON a.service_id = s.service_id "
                + "LEFT JOIN AppointmentStaff ast "
                + "ON a.appointment_id = ast.appointment_id "
                + "LEFT JOIN Staff st "
                + "ON ast.staff_id = st.staff_id "
                + "LEFT JOIN Room r "
                + "ON a.room_id = r.room_id "
                + "ORDER BY a.appointment_date, a.start_time";

        try {
            if (conn != null) {

                PreparedStatement ps = conn.prepareStatement(query);
                ResultSet rs = ps.executeQuery();

                while (rs.next()) {

                    Map<String, Object> map = new HashMap<>();

                    map.put("appointmentId",
                            rs.getInt("appointment_id"));

                    map.put("customerName",
                            rs.getString("customer_name"));

                    map.put("serviceName",
                            rs.getString("service_name"));

                    map.put("staffName",
                            rs.getString("staff_name"));

                    map.put("roomName",
                            rs.getString("room_name"));

                    map.put("appointmentDate",
                            rs.getDate("appointment_date"));

                    map.put("startTime",
                            rs.getTime("start_time"));

                    map.put("endTime",
                            rs.getTime("end_time"));

                    map.put("status",
                            rs.getString("status"));

                    list.add(map);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return list;
    }

    // View Appointment Details
    public Map<String, Object> getAppointmentDetails(int appointmentId) {

        Map<String, Object> map = null;

        String query = "SELECT "
                + "a.appointment_id, "
                + "c.full_name AS customer_name, "
                + "s.service_name, "
                + "st.full_name AS staff_name, "
                + "r.room_name, "
                + "a.appointment_date, "
                + "a.start_time, "
                + "a.end_time, "
                + "a.status, "
                + "a.notes "
                + "FROM Appointment a "
                + "JOIN Customer c "
                + "ON a.customer_id = c.customer_id "
                + "JOIN Service s "
                + "ON a.service_id = s.service_id "
                + "LEFT JOIN AppointmentStaff ast "
                + "ON a.appointment_id = ast.appointment_id "
                + "LEFT JOIN Staff st "
                + "ON ast.staff_id = st.staff_id "
                + "LEFT JOIN Room r "
                + "ON a.room_id = r.room_id "
                + "WHERE a.appointment_id = ?";

        try {

            if (conn != null) {

                PreparedStatement ps = conn.prepareStatement(query);

                ps.setInt(1, appointmentId);

                ResultSet rs = ps.executeQuery();

                if (rs.next()) {

                    map = new HashMap<>();

                    map.put("appointmentId",
                            rs.getInt("appointment_id"));

                    map.put("customerName",
                            rs.getString("customer_name"));

                    map.put("serviceName",
                            rs.getString("service_name"));

                    map.put("staffName",
                            rs.getString("staff_name"));

                    map.put("roomName",
                            rs.getString("room_name"));

                    map.put("appointmentDate",
                            rs.getDate("appointment_date"));

                    map.put("startTime",
                            rs.getTime("start_time"));

                    map.put("endTime",
                            rs.getTime("end_time"));

                    map.put("status",
                            rs.getString("status"));

                    map.put("notes",
                            rs.getString("notes"));
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return map;
    }

    // Reschedule Appointment
    public boolean rescheduleAppointment(
            int appointmentId,
            String appointmentDate,
            String startTime,
            String endTime) {

        String query = "UPDATE Appointment "
                + "SET appointment_date = ?, "
                + "start_time = ?, "
                + "end_time = ? "
                + "WHERE appointment_id = ?";

        try {
            if (conn != null) {

                PreparedStatement ps = conn.prepareStatement(query);

                ps.setDate(1, java.sql.Date.valueOf(appointmentDate));
                ps.setTime(2, java.sql.Time.valueOf(startTime));
                ps.setTime(3, java.sql.Time.valueOf(endTime));
                ps.setInt(4, appointmentId);

                int rowsAffected = ps.executeUpdate();

                return rowsAffected > 0;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return false;
    }

    // Cancel Appointment
    public boolean cancelAppointment(int appointmentId) {

        String query = "UPDATE Appointment "
                + "SET status = 'Cancelled' "
                + "WHERE appointment_id = ? "
                + "AND status IN ('Booked', 'Confirmed')";

        try {
            if (conn != null) {

                PreparedStatement ps = conn.prepareStatement(query);

                ps.setInt(1, appointmentId);

                int rowsAffected = ps.executeUpdate();

                return rowsAffected > 0;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return false;
    }

}
