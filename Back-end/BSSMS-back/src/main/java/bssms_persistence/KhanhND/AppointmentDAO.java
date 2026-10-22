package bssms_persistence.KhanhND;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Time;
import java.sql.Types;
import java.time.LocalDate;
import java.time.LocalTime;

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

    // Create Walk-in Appointment
    public Map<String, Object> createWalkInAppointment(
            int customerId,
            int serviceId,
            Integer customerPackageId,
            String appointmentDate,
            String startTime,
            Integer technicianId,
            String notes) throws Exception {

        if (conn == null) {
            throw new SQLException("Database connection is not available.");
        }

        if (customerId <= 0 || serviceId <= 0) {
            throw new IllegalArgumentException(
                    "Customer and service are required.");
        }

        if (appointmentDate == null || appointmentDate.trim().isEmpty()
                || startTime == null || startTime.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Appointment date and start time are required.");
        }

        LocalDate selectedDate = LocalDate.parse(appointmentDate.trim());
        LocalTime selectedStart = LocalTime.parse(startTime.trim());

        if (selectedDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "Appointment date cannot be in the past.");
        }

        if (selectedStart.getSecond() != 0
                || selectedStart.getNano() != 0) {
            throw new IllegalArgumentException(
                    "Start time must be in HH:mm format.");
        }

        if (notes != null && notes.length() > 500) {
            throw new IllegalArgumentException(
                    "Notes cannot exceed 500 characters.");
        }

        java.sql.Date sqlDate = java.sql.Date.valueOf(selectedDate);
        Time sqlStart = Time.valueOf(selectedStart);

        boolean originalAutoCommit = conn.getAutoCommit();

        try {
            conn.setAutoCommit(false);

            // 1. Check that the customer exists and is active.
            if (!isActiveCustomer(customerId)) {
                throw new IllegalArgumentException(
                        "Customer does not exist or is inactive.");
            }

            // 2. Get the duration of the selected active service.
            int duration = getActiveServiceDuration(serviceId);

            LocalTime selectedEnd = selectedStart.plusMinutes(duration);

            if (!selectedEnd.isAfter(selectedStart)
                    || !selectedEnd.isBefore(LocalTime.MAX)) {
                throw new IllegalArgumentException(
                        "Invalid appointment end time.");
            }

            Time sqlEnd = Time.valueOf(selectedEnd);

            // 3. Validate the customer's existing package, if provided.
            if (customerPackageId != null) {
                if (customerPackageId <= 0) {
                    throw new IllegalArgumentException(
                            "Invalid customer package ID.");
                }

                if (!isValidCustomerPackage(
                        customerPackageId,
                        customerId,
                        serviceId,
                        sqlDate)) {

                    throw new IllegalArgumentException(
                            "The selected package is not active, "
                            + "has no remaining sessions, is expired, "
                            + "or does not match the selected service.");
                }
            }

            // 4. The customer cannot have another appointment
            //    in the same time range or cleanup interval.
            if (hasCustomerConflict(
                    customerId,
                    sqlDate,
                    sqlStart,
                    sqlEnd)) {

                throw new IllegalStateException(
                        "Customer already has an appointment "
                        + "conflicting with this time slot.");
            }

            // 5. Find an eligible technician.
            //    If no technician was specified, select one automatically.
            Integer requestedTechnicianId
                    = technicianId != null && technicianId > 0
                            ? technicianId : null;

            int selectedTechnicianId = findAvailableTechnician(
                    serviceId,
                    sqlDate,
                    sqlStart,
                    sqlEnd,
                    requestedTechnicianId);

            if (selectedTechnicianId <= 0) {
                throw new IllegalStateException(
                        "No eligible technician is available "
                        + "for the selected date and time.");
            }

            // 6. Insert the appointment.
            String insertAppointment
                    = "INSERT INTO Appointment "
                    + "(customer_id, service_id, customer_package_id, "
                    + "appointment_date, start_time, end_time, status, notes) "
                    + "VALUES (?, ?, ?, ?, ?, ?, 'Confirmed', ?)";

            int appointmentId = -1;

            try (PreparedStatement ps = conn.prepareStatement(
                    insertAppointment, Statement.RETURN_GENERATED_KEYS)) {

                ps.setInt(1, customerId);
                ps.setInt(2, serviceId);

                if (customerPackageId == null) {
                    ps.setNull(3, Types.INTEGER);
                } else {
                    ps.setInt(3, customerPackageId);
                }

                ps.setDate(4, sqlDate);
                ps.setTime(5, sqlStart);
                ps.setTime(6, sqlEnd);

                if (notes == null || notes.trim().isEmpty()) {
                    ps.setNull(7, Types.NVARCHAR);
                } else {
                    ps.setNString(7, notes.trim());
                }

                int rowsAffected = ps.executeUpdate();

                if (rowsAffected == 0) {
                    throw new SQLException(
                            "Failed to create the appointment.");
                }

                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (keys.next()) {
                        appointmentId = keys.getInt(1);
                    }
                }
            }

            if (appointmentId <= 0) {
                throw new SQLException(
                        "Could not retrieve the new appointment ID.");
            }

            // 7. Store the technician assignment.
            String insertStaff
                    = "INSERT INTO AppointmentStaff "
                    + "(appointment_id, staff_id, role) "
                    + "VALUES (?, ?, ?)";

            try (PreparedStatement ps = conn.prepareStatement(insertStaff)) {
                ps.setInt(1, appointmentId);
                ps.setInt(2, selectedTechnicianId);
                ps.setString(3, "Main Technician");
                ps.executeUpdate();
            }

            // Both inserts succeed together.
            conn.commit();

            Map<String, Object> result = new HashMap<>();
            result.put("appointmentId", appointmentId);
            result.put("customerId", customerId);
            result.put("serviceId", serviceId);
            result.put("technicianId", selectedTechnicianId);
            result.put("appointmentDate", sqlDate.toString());
            result.put("startTime", sqlStart.toString());
            result.put("endTime", sqlEnd.toString());
            result.put("status", "Confirmed");

            return result;

        } catch (Exception e) {
            try {
                conn.rollback();
            } catch (SQLException rollbackError) {
                e.addSuppressed(rollbackError);
            }

            throw e;

        } finally {
            conn.setAutoCommit(originalAutoCommit);
        }
    }

// Check that the customer exists and is active.
    private boolean isActiveCustomer(int customerId) throws SQLException {

        String sql
                = "SELECT COUNT(*) "
                + "FROM Customer c "
                + "LEFT JOIN Account a ON c.account_id = a.account_id "
                + "WHERE c.customer_id = ? "
                + "AND (c.account_id IS NULL OR a.status = 'Active')";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, customerId);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }

// Get the duration of an active service.
    private int getActiveServiceDuration(int serviceId) throws SQLException {

        String sql
                = "SELECT duration "
                + "FROM Service "
                + "WHERE service_id = ? AND status = 'Active'";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, serviceId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("duration");
                }
            }
        }

        throw new IllegalArgumentException(
                "Service does not exist or is inactive.");
    }

// Check whether the selected package belongs to the customer
// and can be used for the selected service.
    private boolean isValidCustomerPackage(
            int customerPackageId,
            int customerId,
            int serviceId,
            java.sql.Date appointmentDate) throws SQLException {

        String sql
                = "SELECT COUNT(*) "
                + "FROM CustomerPackage cp "
                + "JOIN TreatmentPackage tp "
                + "ON cp.treatment_package_id = tp.treatment_package_id "
                + "WHERE cp.customer_package_id = ? "
                + "AND cp.customer_id = ? "
                + "AND cp.status = 'Active' "
                + "AND cp.remaining_sessions > 0 "
                + "AND (cp.expiry_date IS NULL "
                + "OR CAST(cp.expiry_date AS DATE) >= ?) "
                + "AND tp.service_id = ?";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, customerPackageId);
            ps.setInt(2, customerId);
            ps.setDate(3, appointmentDate);
            ps.setInt(4, serviceId);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }

// Check whether the customer has a conflicting appointment.
// A 15-minute gap is required between appointments.
    private boolean hasCustomerConflict(
            int customerId,
            java.sql.Date appointmentDate,
            Time startTime,
            Time endTime) throws SQLException {

        String sql
                = "SELECT COUNT(*) "
                + "FROM Appointment a "
                + "WHERE a.customer_id = ? "
                + "AND a.appointment_date = ? "
                + "AND a.status IN ('Booked', 'Confirmed', 'Completed') "
                + "AND a.end_time IS NOT NULL "
                + "AND DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), ?) "
                + "< DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), a.end_time) + 15 "
                + "AND DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), ?) + 15 "
                + "> DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), a.start_time)";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, customerId);
            ps.setDate(2, appointmentDate);
            ps.setTime(3, startTime);
            ps.setTime(4, endTime);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }

// Find a technician who can perform the service,
// works the selected shift, and has no conflicting appointment.
    private int findAvailableTechnician(
            int serviceId,
            java.sql.Date appointmentDate,
            Time startTime,
            Time endTime,
            Integer requestedTechnicianId) throws SQLException {

        StringBuilder sql = new StringBuilder();

        sql.append("SELECT DISTINCT s.staff_id ");
        sql.append("FROM Staff s ");
        sql.append("JOIN Account a ON s.account_id = a.account_id ");
        sql.append("JOIN StaffService ss ON s.staff_id = ss.staff_id ");
        sql.append("JOIN StaffShift sh ON s.staff_id = sh.staff_id ");
        sql.append("WHERE ss.service_id = ? ");
        sql.append("AND a.status = 'Active' ");
        sql.append("AND s.position = N'Technician' ");
        sql.append("AND sh.shift_date = ? ");
        sql.append("AND CAST(sh.start_time AS time) <= CAST(? AS time) ");
        sql.append("AND CAST(sh.end_time AS time) >= CAST(? AS time) ");

        if (requestedTechnicianId != null) {
            sql.append("AND s.staff_id = ? ");
        }

        sql.append("ORDER BY s.staff_id");

        try (PreparedStatement ps
                = conn.prepareStatement(sql.toString())) {

            ps.setInt(1, serviceId);
            ps.setDate(2, appointmentDate);
            ps.setTime(3, startTime);
            ps.setTime(4, endTime);

            if (requestedTechnicianId != null) {
                ps.setInt(5, requestedTechnicianId);
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int staffId = rs.getInt("staff_id");

                    if (!hasStaffConflict(
                            staffId,
                            appointmentDate,
                            startTime,
                            endTime)) {

                        return staffId;
                    }
                }
            }
        }

        return -1;
    }

// Check technician schedule conflicts, including the cleanup gap.
    private boolean hasStaffConflict(
            int staffId,
            java.sql.Date appointmentDate,
            Time startTime,
            Time endTime) throws SQLException {

        String sql
                = "SELECT COUNT(*) "
                + "FROM Appointment a "
                + "JOIN AppointmentStaff ast "
                + "ON a.appointment_id = ast.appointment_id "
                + "WHERE ast.staff_id = ? "
                + "AND a.appointment_date = ? "
                + "AND a.status IN ('Booked', 'Confirmed', 'Completed') "
                + "AND a.end_time IS NOT NULL "
                + "AND DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), ?) "
                + "< DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), a.end_time) + 15 "
                + "AND DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), ?) + 15 "
                + "> DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), a.start_time)";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, staffId);
            ps.setDate(2, appointmentDate);
            ps.setTime(3, startTime);
            ps.setTime(4, endTime);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }

}
