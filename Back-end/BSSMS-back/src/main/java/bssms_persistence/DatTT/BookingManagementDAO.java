/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_persistence.DatTT;

import bssms_persistence.DBContext;

import java.sql.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

/**
 * @author Trần Thành Đạt - CE200857
 */
public class BookingManagementDAO extends DBContext implements AutoCloseable {

    private void requireConnection() throws SQLException {
        if (conn == null || conn.isClosed()) throw new SQLException("Database connection unavailable");
    }

    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    // Lấy customer_id từ account_id (dùng cho Customer đang đăng nhập)
    public int getCustomerIdByAccountId(int accountId) throws SQLException {
        requireConnection();
        String sql = "SELECT customer_id FROM Customer WHERE account_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, accountId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("customer_id");
                }
            }
        } catch (SQLException e) {
            throw e;
        }
        return -1;
    }

    // Lấy danh sách gói liệu trình còn hiệu lực của Customer kèm tên gói và service_id
    public List<Map<String, Object>> getActivePackagesByCustomer(int customerId) throws SQLException {
        requireConnection();
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT cp.customer_package_id, cp.treatment_package_id, cp.remaining_sessions, "
                   + "cp.expiry_date, tp.package_name, tp.service_id, s.service_name, s.duration "
                   + "FROM CustomerPackage cp "
                   + "JOIN TreatmentPackage tp ON cp.treatment_package_id = tp.treatment_package_id "
                   + "JOIN Service s ON tp.service_id = s.service_id "
                   + "WHERE cp.customer_id = ? AND cp.status = 'Active' AND cp.remaining_sessions > 0 "
                   + "AND (cp.expiry_date IS NULL OR CAST(cp.expiry_date AS DATE) >= CAST(GETDATE() AS DATE))";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, customerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("customerPackageId", rs.getInt("customer_package_id"));
                    map.put("treatmentPackageId", rs.getInt("treatment_package_id"));
                    map.put("remainingSessions", rs.getInt("remaining_sessions"));
                    map.put("expiryDate", rs.getDate("expiry_date"));
                    map.put("packageName", rs.getString("package_name"));
                    map.put("serviceId", rs.getInt("service_id"));
                    map.put("serviceName", rs.getString("service_name"));
                    map.put("duration", rs.getInt("duration"));
                    list.add(map);
                }
            }
        } catch (SQLException e) {
            throw e;
        }
        return list;
    }

    // =========================================================================
    // 1. CHECK SLOT AVAILABILITY (Guest, Customer, Receptionist)
    // =========================================================================
    public Map<String, Object> checkSlotAvailability(int serviceId, String dateStr, Integer requestedTechId) throws Exception {
        Map<String, Object> response = new HashMap<>();
        if (conn == null) throw new SQLException("Database connection is null");

        // 1. Lấy thời lượng dịch vụ
        int duration = 60;
        String serviceName = "";
        String srvSql = "SELECT service_name, duration FROM Service WHERE service_id = ? AND status = 'Active'";
        try (PreparedStatement ps = conn.prepareStatement(srvSql)) {
            ps.setInt(1, serviceId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    serviceName = rs.getString("service_name");
                    duration = rs.getInt("duration");
                } else {
                    throw new IllegalArgumentException("Dịch vụ không tồn tại hoặc đã ngừng hoạt động.");
                }
            }
        }

        java.sql.Date sqlDate = java.sql.Date.valueOf(LocalDate.parse(dateStr.trim()));

        // 2. Lấy danh sách KTV có thể làm dịch vụ này (Nếu bảng StaffService chưa gán đủ thì fallback lấy tất cả Technician Active)
        List<Map<String, Object>> eligibleTechs = getEligibleTechnicians(serviceId, requestedTechId);

        // 3. Lấy tổng số phòng Available
        int totalAvailableRooms = 0;
        try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM Room WHERE status = 'Available'");
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                totalAvailableRooms = rs.getInt(1);
            }
        }

        // 4. Duyệt các khung giờ cách nhau 30 phút từ 08:30 đến 19:30
        List<Map<String, Object>> slots = new ArrayList<>();
        LocalTime openTime = LocalTime.of(8, 30);
        LocalTime closeTime = LocalTime.of(20, 30);

        if (duration <= 0 || duration > 720) throw new IllegalArgumentException("Invalid service duration for opening hours.");
        for (int minute = openTime.toSecondOfDay() / 60;
                minute + duration <= closeTime.toSecondOfDay() / 60; minute += 30) {
            LocalTime slotStart = LocalTime.of(minute / 60, minute % 60);
            LocalTime slotEnd = slotStart.plusMinutes(duration);
            Time sqlStart = Time.valueOf(slotStart);
            Time sqlEnd = Time.valueOf(slotEnd);

            List<Map<String, Object>> availableTechsForSlot = new ArrayList<>();
            for (Map<String, Object> tech : eligibleTechs) {
                int staffId = (int) tech.get("staffId");
                if (isTechnicianFreeInSlot(staffId, sqlDate, sqlStart, sqlEnd)) {
                    availableTechsForSlot.add(tech);
                }
            }

            int busyRooms = countBusyRoomsInSlot(sqlDate, sqlStart, sqlEnd);
            int freeRooms = Math.max(0, totalAvailableRooms - busyRooms);

            boolean isAvailable = !availableTechsForSlot.isEmpty() && freeRooms > 0;

            Map<String, Object> slotInfo = new HashMap<>();
            slotInfo.put("startTime", slotStart.toString().substring(0, 5));
            slotInfo.put("endTime", slotEnd.toString().substring(0, 5));
            slotInfo.put("available", isAvailable);
            slotInfo.put("availableTechnicianCount", availableTechsForSlot.size());
            slotInfo.put("availableTechnicians", availableTechsForSlot);
            slotInfo.put("freeRooms", freeRooms);
            slots.add(slotInfo);
        }

        response.put("serviceId", serviceId);
        response.put("serviceName", serviceName);
        response.put("duration", duration);
        response.put("appointmentDate", dateStr);
        response.put("technicians", eligibleTechs);
        response.put("slots", slots);
        return response;
    }

    private List<Map<String, Object>> getEligibleTechnicians(int serviceId, Integer requestedTechId) throws SQLException {
        List<Map<String, Object>> techs = new ArrayList<>();
        String sql = "SELECT DISTINCT s.staff_id, s.full_name "
                   + "FROM Staff s "
                   + "JOIN Account a ON s.account_id = a.account_id "
                   + "LEFT JOIN StaffService ss ON s.staff_id = ss.staff_id "
                   + "WHERE a.status = 'Active' AND s.position = N'Technician' "
                   + "AND (ss.service_id = ? OR NOT EXISTS (SELECT 1 FROM StaffService WHERE service_id = ?))";
        if (requestedTechId != null && requestedTechId > 0) {
            sql += " AND s.staff_id = ?";
        }
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, serviceId);
            ps.setInt(2, serviceId);
            if (requestedTechId != null && requestedTechId > 0) {
                ps.setInt(3, requestedTechId);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> t = new HashMap<>();
                    t.put("staffId", rs.getInt("staff_id"));
                    t.put("fullName", rs.getString("full_name"));
                    techs.add(t);
                }
            }
        }
        return techs;
    }

    private boolean isTechnicianFreeInSlot(int staffId, java.sql.Date date, Time start, Time end) throws SQLException {
        // Kiểm tra trùng lịch hẹn (bao gồm 15 phút dọn dẹp)
        String sql = "SELECT COUNT(*) FROM Appointment a "
                   + "JOIN AppointmentStaff ast ON a.appointment_id = ast.appointment_id "
                   + "WHERE ast.staff_id = ? AND a.appointment_date = ? "
                   + "AND a.status NOT IN ('Cancelled', 'No Show') "
                   + "AND a.end_time IS NOT NULL "
                   + "AND DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), ?) < DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), a.end_time) + 15 "
                   + "AND DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), ?) + 15 > DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), a.start_time)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, staffId);
            ps.setDate(2, date);
            ps.setTime(3, start);
            ps.setTime(4, end);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next() && rs.getInt(1) > 0) {
                    return false;
                }
            }
        }
        return true;
    }

    private int countBusyRoomsInSlot(java.sql.Date date, Time start, Time end) throws SQLException {
        String sql = "SELECT COUNT(DISTINCT room_id) FROM Appointment "
                   + "WHERE appointment_date = ? AND room_id IS NOT NULL "
                   + "AND status NOT IN ('Cancelled', 'No Show') AND end_time IS NOT NULL "
                   + "AND DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), ?) < DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), end_time) + 15 "
                   + "AND DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), ?) + 15 > DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), start_time)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, date);
            ps.setTime(2, start);
            ps.setTime(3, end);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        return 0;
    }

    // =========================================================================
    // 2. CREATE ONLINE APPOINTMENT (Customer)
    // =========================================================================
    public Map<String, Object> createOnlineAppointment(
            int customerId,
            int serviceId,
            Integer customerPackageId,
            String appointmentDateStr,
            String startTimeStr,
            Integer technicianId,
            String notes) throws Exception {

        if (conn == null) throw new SQLException("Database connection is null");

        LocalDate apptDate = LocalDate.parse(appointmentDateStr.trim());
        String cleanTime = startTimeStr.trim().length() == 5 ? startTimeStr.trim() + ":00" : startTimeStr.trim();
        LocalTime startTime = LocalTime.parse(cleanTime);

        if (apptDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Ngày đặt lịch không được nằm trong quá khứ.");
        }

        boolean origAutoCommit = conn.getAutoCommit();
        try {
            conn.setAutoCommit(false);

            // 1. Lấy thời lượng dịch vụ
            int duration = 60;
            try (PreparedStatement ps = conn.prepareStatement("SELECT duration FROM Service WHERE service_id = ? AND status = 'Active'")) {
                ps.setInt(1, serviceId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        duration = rs.getInt("duration");
                    } else {
                        throw new IllegalArgumentException("Dịch vụ không hợp lệ hoặc đang ngừng hoạt động.");
                    }
                }
            }

            if (duration <= 0 || startTime.isBefore(LocalTime.of(8, 30))
                    || startTime.toSecondOfDay() + (long) duration * 60 > LocalTime.of(20, 30).toSecondOfDay()) {
                throw new IllegalArgumentException("Appointment must fit within opening hours (08:30-20:30).");
            }
            LocalTime endTime = startTime.plusMinutes(duration);
            java.sql.Date sqlDate = java.sql.Date.valueOf(apptDate);
            Time sqlStart = Time.valueOf(startTime);
            Time sqlEnd = Time.valueOf(endTime);

            // 2. Kiểm tra gói liệu trình của khách (nếu đặt theo gói)
            if (customerPackageId != null && customerPackageId > 0) {
                String pkgSql = "SELECT COUNT(*) FROM CustomerPackage cp "
                              + "JOIN TreatmentPackage tp ON cp.treatment_package_id = tp.treatment_package_id "
                              + "WHERE cp.customer_package_id = ? AND cp.customer_id = ? "
                              + "AND cp.status = 'Active' AND cp.remaining_sessions > 0 AND tp.service_id = ? "
                              + "AND (cp.expiry_date IS NULL OR CAST(cp.expiry_date AS DATE) >= ?)";
                try (PreparedStatement ps = conn.prepareStatement(pkgSql)) {
                    ps.setInt(1, customerPackageId);
                    ps.setInt(2, customerId);
                    ps.setInt(3, serviceId);
                    ps.setDate(4, sqlDate);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next() || rs.getInt(1) == 0) {
                            throw new IllegalArgumentException("Gói liệu trình không hợp lệ hoặc đã hết buổi.");
                        }
                    }
                }
            }

            // 3. Kiểm tra trùng lịch của chính khách hàng
            String cusConflictSql = "SELECT COUNT(*) FROM Appointment "
                                  + "WHERE customer_id = ? AND appointment_date = ? "
                                  + "AND status NOT IN ('Cancelled', 'No Show') AND end_time IS NOT NULL "
                                  + "AND DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), ?) < DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), end_time) + 15 "
                                  + "AND DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), ?) + 15 > DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), start_time)";
            try (PreparedStatement ps = conn.prepareStatement(cusConflictSql)) {
                ps.setInt(1, customerId);
                ps.setDate(2, sqlDate);
                ps.setTime(3, sqlStart);
                ps.setTime(4, sqlEnd);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next() && rs.getInt(1) > 0) {
                        throw new IllegalStateException("Bạn đã có một lịch hẹn khác trùng với khung giờ này.");
                    }
                }
            }

            // 4. Tìm hoặc kiểm tra Kỹ thuật viên
            List<Map<String, Object>> candidates = getEligibleTechnicians(serviceId, technicianId);
            int assignedTechId = -1;
            String assignedTechName = "";
            for (Map<String, Object> tech : candidates) {
                int sId = (int) tech.get("staffId");
                if (isTechnicianFreeInSlot(sId, sqlDate, sqlStart, sqlEnd)) {
                    assignedTechId = sId;
                    assignedTechName = (String) tech.get("fullName");
                    break;
                }
            }

            if (assignedTechId <= 0) {
                throw new IllegalStateException("Không còn kỹ thuật viên trống trong khung giờ bạn chọn. Vui lòng chọn khung giờ khác!");
            }

            // 5. Thêm vào bảng Appointment với trạng thái 'Booked'
            String insertAppt = "INSERT INTO Appointment (customer_id, service_id, customer_package_id, "
                              + "appointment_date, start_time, end_time, status, notes) "
                              + "VALUES (?, ?, ?, ?, ?, ?, 'Booked', ?)";
            int appointmentId = -1;
            try (PreparedStatement ps = conn.prepareStatement(insertAppt, Statement.RETURN_GENERATED_KEYS)) {
                ps.setInt(1, customerId);
                ps.setInt(2, serviceId);
                if (customerPackageId != null && customerPackageId > 0) {
                    ps.setInt(3, customerPackageId);
                } else {
                    ps.setNull(3, Types.INTEGER);
                }
                ps.setDate(4, sqlDate);
                ps.setTime(5, sqlStart);
                ps.setTime(6, sqlEnd);
                if (notes != null && !notes.trim().isEmpty()) {
                    ps.setNString(7, notes.trim());
                } else {
                    ps.setNull(7, Types.NVARCHAR);
                }
                ps.executeUpdate();
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (keys.next()) appointmentId = keys.getInt(1);
                }
            }

            if (appointmentId <= 0) throw new SQLException("Missing generated appointment id");

            // 6. Gán KTV vào AppointmentStaff
            String insertStaff = "INSERT INTO AppointmentStaff (appointment_id, staff_id, role) VALUES (?, ?, 'Main Technician')";
            try (PreparedStatement ps = conn.prepareStatement(insertStaff)) {
                ps.setInt(1, appointmentId);
                ps.setInt(2, assignedTechId);
                ps.executeUpdate();
            }

            conn.commit();

            Map<String, Object> result = new HashMap<>();
            result.put("appointmentId", appointmentId);
            result.put("customerId", customerId);
            result.put("serviceId", serviceId);
            result.put("technicianId", assignedTechId);
            result.put("technicianName", assignedTechName);
            result.put("appointmentDate", sqlDate.toString());
            result.put("startTime", sqlStart.toString().substring(0, 5));
            result.put("endTime", sqlEnd.toString().substring(0, 5));
            result.put("status", "Booked");
            return result;

        } catch (Exception e) {
            conn.rollback();
            throw e;
        } finally {
            conn.setAutoCommit(origAutoCommit);
        }
    }

    // =========================================================================
    // 3. CHECK-IN & STATUS UPDATE (Receptionist)
    // =========================================================================
    public boolean updateCheckInAndStatus(int appointmentId, String newStatus, String notes) throws Exception {
        if (conn == null) throw new SQLException("Database connection is null");

        List<String> validStatuses = Arrays.asList(
            "Scheduled", "Booked", "Confirmed", "Checked-in", "In Progress", "Completed", "Cancelled", "No Show"
        );
        if (!validStatuses.contains(newStatus)) {
            throw new IllegalArgumentException("Trạng thái cập nhật không hợp lệ: " + newStatus);
        }

        boolean origAutoCommit = conn.getAutoCommit();
        try {
            conn.setAutoCommit(false);

            // Lấy trạng thái cũ, gói khách hàng, phòng, giường hiện tại
            String currentStatus = null;
            Integer customerPackageId = null;
            Integer roomId = null;
            Integer bedId = null;

            String checkSql = "SELECT status, customer_package_id, room_id, bed_id FROM Appointment WHERE appointment_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(checkSql)) {
                ps.setInt(1, appointmentId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        currentStatus = rs.getString("status");
                        customerPackageId = (Integer) rs.getObject("customer_package_id");
                        roomId = (Integer) rs.getObject("room_id");
                        bedId = (Integer) rs.getObject("bed_id");
                    } else {
                        throw new IllegalArgumentException("Không tìm thấy lịch hẹn #" + appointmentId);
                    }
                }
            }

            // Cập nhật trạng thái và ghi chú (nếu có)
            String updateSql = (notes != null && !notes.trim().isEmpty())
                    ? "UPDATE Appointment SET status = ?, notes = ? WHERE appointment_id = ?"
                    : "UPDATE Appointment SET status = ? WHERE appointment_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setString(1, newStatus);
                if (notes != null && !notes.trim().isEmpty()) {
                    ps.setNString(2, notes.trim());
                    ps.setInt(3, appointmentId);
                } else {
                    ps.setInt(2, appointmentId);
                }
                ps.executeUpdate();
            }

            // Nếu khách Check-in hoặc In Progress -> Đánh dấu Giường là 'Occupied'
            if (("Checked-in".equals(newStatus) || "In Progress".equals(newStatus)) && bedId != null) {
                try (PreparedStatement ps = conn.prepareStatement("UPDATE Bed SET status = 'Occupied' WHERE bed_id = ?")) {
                    ps.setInt(1, bedId);
                    ps.executeUpdate();
                }
            }

            // Nếu chuyển sang Completed, Cancelled hoặc No Show -> Giải phóng Phòng, Giường và Thiết bị về 'Available'
            if (Arrays.asList("Completed", "Cancelled", "No Show").contains(newStatus)) {
                if (bedId != null) {
                    try (PreparedStatement ps = conn.prepareStatement("UPDATE Bed SET status = 'Available' WHERE bed_id = ?")) {
                        ps.setInt(1, bedId);
                        ps.executeUpdate();
                    }
                }
                if (roomId != null) {
                    try (PreparedStatement ps = conn.prepareStatement("UPDATE Room SET status = 'Available' WHERE room_id = ?")) {
                        ps.setInt(1, roomId);
                        ps.executeUpdate();
                    }
                }
                try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE Equipment SET status = 'Available' WHERE equipment_id IN (SELECT equipment_id FROM AppointmentEquipment WHERE appointment_id = ?)")) {
                    ps.setInt(1, appointmentId);
                    ps.executeUpdate();
                }
            }

            // Quy tắc FE-4.5: Tự động trừ 1 buổi khi chuyển sang Completed (nếu trước đó chưa Completed và có dùng gói)
            if ("Completed".equals(newStatus) && !"Completed".equals(currentStatus) && customerPackageId != null) {
                String deductSql = "UPDATE CustomerPackage "
                                 + "SET remaining_sessions = CASE WHEN remaining_sessions > 0 THEN remaining_sessions - 1 ELSE 0 END, "
                                 + "status = CASE WHEN remaining_sessions - 1 <= 0 THEN 'Completed' ELSE status END "
                                 + "WHERE customer_package_id = ?";
                try (PreparedStatement ps = conn.prepareStatement(deductSql)) {
                    ps.setInt(1, customerPackageId);
                    ps.executeUpdate();
                }
            }

            conn.commit();
            return true;
        } catch (Exception e) {
            conn.rollback();
            throw e;
        } finally {
            conn.setAutoCommit(origAutoCommit);
        }
    }

    // =========================================================================
    // 4. COORDINATE SERVICE (Receptionist: Phân bổ KTV, Phòng, Giường, Thiết bị)
    // =========================================================================
    public Map<String, Object> getCoordinationResources(int appointmentId) throws Exception {
        requireConnection();
        Map<String, Object> data = new HashMap<>();

        // 1. Thông tin lịch hẹn hiện tại
        String apptSql = "SELECT a.appointment_id, a.customer_id, c.full_name AS customer_name, c.phone, "
                       + "a.service_id, s.service_name, s.duration, a.room_id, r.room_name, "
                       + "a.bed_id, b.bed_number, a.appointment_date, a.start_time, a.end_time, a.status, a.notes "
                       + "FROM Appointment a "
                       + "JOIN Customer c ON a.customer_id = c.customer_id "
                       + "LEFT JOIN Service s ON a.service_id = s.service_id "
                       + "LEFT JOIN Room r ON a.room_id = r.room_id "
                       + "LEFT JOIN Bed b ON a.bed_id = b.bed_id "
                       + "WHERE a.appointment_id = ?";
        int serviceId = 0;
        java.sql.Date apptDate = null;
        Time startTime = null;
        Time endTime = null;

        try (PreparedStatement ps = conn.prepareStatement(apptSql)) {
            ps.setInt(1, appointmentId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> appt = new HashMap<>();
                    appt.put("appointmentId", rs.getInt("appointment_id"));
                    appt.put("customerId", rs.getInt("customer_id"));
                    appt.put("customerName", rs.getString("customer_name"));
                    appt.put("phone", rs.getString("phone"));
                    serviceId = rs.getInt("service_id");
                    appt.put("serviceId", serviceId);
                    appt.put("serviceName", rs.getString("service_name"));
                    appt.put("duration", rs.getInt("duration"));
                    appt.put("roomId", rs.getObject("room_id"));
                    appt.put("roomName", rs.getString("room_name"));
                    appt.put("bedId", rs.getObject("bed_id"));
                    appt.put("bedNumber", rs.getString("bed_number"));
                    apptDate = rs.getDate("appointment_date");
                    startTime = rs.getTime("start_time");
                    endTime = rs.getTime("end_time");
                    appt.put("appointmentDate", apptDate);
                    appt.put("startTime", startTime);
                    appt.put("endTime", endTime);
                    appt.put("status", rs.getString("status"));
                    appt.put("notes", rs.getString("notes"));
                    data.put("appointment", appt);
                } else {
                    throw new IllegalArgumentException("Không tìm thấy lịch hẹn #" + appointmentId);
                }
            }
        }

        // 2. Nhân sự đang được gán cho lịch hẹn này
        List<Map<String, Object>> assignedStaff = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT ast.staff_id, s.full_name, ast.role FROM AppointmentStaff ast JOIN Staff s ON ast.staff_id = s.staff_id WHERE ast.appointment_id = ?")) {
            ps.setInt(1, appointmentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> st = new HashMap<>();
                    st.put("staffId", rs.getInt("staff_id"));
                    st.put("fullName", rs.getString("full_name"));
                    st.put("role", rs.getString("role"));
                    assignedStaff.add(st);
                }
            }
        }
        data.put("assignedStaff", assignedStaff);

        // 3. Thiết bị đang được gán cho lịch hẹn này
        List<Map<String, Object>> assignedEquipments = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT ae.equipment_id, e.equipment_name, ae.quantity FROM AppointmentEquipment ae JOIN Equipment e ON ae.equipment_id = e.equipment_id WHERE ae.appointment_id = ?")) {
            ps.setInt(1, appointmentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> eq = new HashMap<>();
                    eq.put("equipmentId", rs.getInt("equipment_id"));
                    eq.put("equipmentName", rs.getString("equipment_name"));
                    eq.put("quantity", rs.getInt("quantity"));
                    assignedEquipments.add(eq);
                }
            }
        }
        data.put("assignedEquipments", assignedEquipments);

        // 4. Danh sách toàn bộ KTV kèm cờ gợi ý (isSuggested: có chuyên môn + không trùng lịch)
        List<Map<String, Object>> allTechnicians = new ArrayList<>();
        String techSql = "SELECT s.staff_id, s.full_name, "
                       + "CASE WHEN EXISTS (SELECT 1 FROM StaffService ss WHERE ss.staff_id = s.staff_id AND ss.service_id = ?) THEN 1 ELSE 0 END AS has_skill "
                       + "FROM Staff s JOIN Account a ON s.account_id = a.account_id "
                       + "WHERE a.status = 'Active' AND s.position = N'Technician'";
        try (PreparedStatement ps = conn.prepareStatement(techSql)) {
            ps.setInt(1, serviceId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int sId = rs.getInt("staff_id");
                    boolean hasSkill = rs.getInt("has_skill") == 1;
                    boolean free = (apptDate != null && startTime != null && endTime != null)
                            ? isStaffFreeExceptAppointment(sId, appointmentId, apptDate, startTime, endTime)
                            : true;
                    Map<String, Object> t = new HashMap<>();
                    t.put("staffId", sId);
                    t.put("fullName", rs.getString("full_name"));
                    t.put("hasSkill", hasSkill);
                    t.put("isFree", free);
                    t.put("isSuggested", hasSkill && free);
                    allTechnicians.add(t);
                }
            }
        }
        data.put("technicians", allTechnicians);

        // 5. Danh sách Phòng và Giường
        data.put("roomsWithBeds", getRoomsWithBeds());

        // 6. Danh sách Thiết bị (separate request-scoped connection, always closed)
        try (EquipmentDAO eqDao = new EquipmentDAO()) {
            data.put("equipments", eqDao.getAllEquipments());
        }

        return data;
    }

    private boolean isStaffFreeExceptAppointment(int staffId, int excludeApptId, java.sql.Date date, Time start, Time end) throws SQLException {
        String sql = "SELECT COUNT(*) FROM Appointment a "
                   + "JOIN AppointmentStaff ast ON a.appointment_id = ast.appointment_id "
                   + "WHERE ast.staff_id = ? AND a.appointment_id != ? AND a.appointment_date = ? "
                   + "AND a.status NOT IN ('Cancelled', 'No Show') AND a.end_time IS NOT NULL "
                   + "AND DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), ?) < DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), a.end_time) + 15 "
                   + "AND DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), ?) + 15 > DATEDIFF(MINUTE, CAST('00:00:00' AS TIME), a.start_time)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, staffId);
            ps.setInt(2, excludeApptId);
            ps.setDate(3, date);
            ps.setTime(4, start);
            ps.setTime(5, end);
            try (ResultSet rs = ps.executeQuery()) {
                return !rs.next() || rs.getInt(1) == 0;
            }
        }
    }

    // Lưu điều phối dịch vụ (KTV + Phòng + Giường + Thiết bị)
    public boolean coordinateAppointment(
            int appointmentId,
            Integer technicianId,
            Integer roomId,
            Integer bedId,
            List<Integer> equipmentIds) throws Exception {

        if (conn == null) throw new SQLException("Database connection is null");

        boolean origAutoCommit = conn.getAutoCommit();
        try {
            conn.setAutoCommit(false);

            if (bedId != null) {
                try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM Bed WHERE bed_id = ? AND room_id = ?")) {
                    ps.setInt(1, bedId);
                    if (roomId == null) throw new IllegalArgumentException("A room is required for the selected bed.");
                    ps.setInt(2, roomId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next() || rs.getInt(1) == 0) throw new IllegalArgumentException("Bed does not belong to the selected room.");
                    }
                }
            }
            // 1. Cập nhật room_id, bed_id và chuyển status từ 'Booked'/'Scheduled' sang 'Confirmed'
            String updateApptSql = "UPDATE Appointment SET room_id = ?, bed_id = ?, "
                                 + "status = CASE WHEN status IN ('Booked', 'Scheduled') THEN 'Confirmed' ELSE status END "
                                 + "WHERE appointment_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(updateApptSql)) {
                if (roomId != null && roomId > 0) ps.setInt(1, roomId);
                else ps.setNull(1, Types.INTEGER);

                if (bedId != null && bedId > 0) ps.setInt(2, bedId);
                else ps.setNull(2, Types.INTEGER);

                ps.setInt(3, appointmentId);
                if (ps.executeUpdate() == 0) {
                    conn.rollback();
                    return false;
                }
            }

            // 2. Cập nhật Kỹ thuật viên trong AppointmentStaff
            if (technicianId != null && technicianId > 0) {
                try (PreparedStatement psDel = conn.prepareStatement("DELETE FROM AppointmentStaff WHERE appointment_id = ?")) {
                    psDel.setInt(1, appointmentId);
                    psDel.executeUpdate();
                }
                try (PreparedStatement psIns = conn.prepareStatement(
                        "INSERT INTO AppointmentStaff (appointment_id, staff_id, role) VALUES (?, ?, 'Main Technician')")) {
                    psIns.setInt(1, appointmentId);
                    psIns.setInt(2, technicianId);
                    psIns.executeUpdate();
                }
            }

            // 3. Cập nhật Thiết bị trong AppointmentEquipment
            if (equipmentIds != null) {
                try (PreparedStatement psDelEq = conn.prepareStatement("DELETE FROM AppointmentEquipment WHERE appointment_id = ?")) {
                    psDelEq.setInt(1, appointmentId);
                    psDelEq.executeUpdate();
                }
                String insEqSql = "INSERT INTO AppointmentEquipment (appointment_id, equipment_id, quantity) VALUES (?, ?, 1)";
                try (PreparedStatement psInsEq = conn.prepareStatement(insEqSql)) {
                    for (Integer eqId : equipmentIds) {
                        if (eqId != null && eqId > 0) {
                            psInsEq.setInt(1, appointmentId);
                            psInsEq.setInt(2, eqId);
                            psInsEq.addBatch();
                        }
                    }
                    psInsEq.executeBatch();
                }
            }

            conn.commit();
            return true;
        } catch (Exception e) {
            conn.rollback();
            throw e;
        } finally {
            conn.setAutoCommit(origAutoCommit);
        }
    }

    // Lấy toàn bộ danh sách lịch hẹn chi tiết phục vụ trang Điều phối & Check-in của Lễ tân
    public List<Map<String, Object>> getAllAppointmentsForCoordination() throws SQLException {
        requireConnection();
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT a.appointment_id, a.customer_id, c.full_name AS customer_name, a.phone_override, acc.phone, "
                   + "a.service_id, s.service_name, s.duration, a.customer_package_id, "
                   + "ast.staff_id, st.full_name AS staff_name, "
                   + "a.room_id, r.room_name, a.bed_id, b.bed_number, "
                   + "a.appointment_date, a.start_time, a.end_time, a.status, a.notes "
                   + "FROM Appointment a "
                   + "JOIN Customer c ON a.customer_id = c.customer_id "
                   + "LEFT JOIN Account acc ON c.account_id = acc.account_id "
                   + "LEFT JOIN Service s ON a.service_id = s.service_id "
                   + "LEFT JOIN AppointmentStaff ast ON a.appointment_id = ast.appointment_id "
                   + "LEFT JOIN Staff st ON ast.staff_id = st.staff_id "
                   + "LEFT JOIN Room r ON a.room_id = r.room_id "
                   + "LEFT JOIN Bed b ON a.bed_id = b.bed_id "
                   + "ORDER BY a.appointment_date DESC, a.start_time ASC";

        // Sử dụng câu query chuẩn với bảng hiện tại trong BSSMS.sql
        String safeSql = "SELECT a.appointment_id, a.customer_id, c.full_name AS customer_name, COALESCE(c.phone, acc.phone) AS customer_phone, "
                       + "a.service_id, s.service_name, s.duration, a.customer_package_id, "
                       + "ast.staff_id, st.full_name AS staff_name, "
                       + "a.room_id, r.room_name, a.bed_id, b.bed_number, "
                       + "a.appointment_date, a.start_time, a.end_time, a.status, a.notes "
                       + "FROM Appointment a "
                       + "JOIN Customer c ON a.customer_id = c.customer_id "
                       + "LEFT JOIN Account acc ON c.account_id = acc.account_id "
                       + "LEFT JOIN Service s ON a.service_id = s.service_id "
                       + "LEFT JOIN AppointmentStaff ast ON a.appointment_id = ast.appointment_id "
                       + "LEFT JOIN Staff st ON ast.staff_id = st.staff_id "
                       + "LEFT JOIN Room r ON a.room_id = r.room_id "
                       + "LEFT JOIN Bed b ON a.bed_id = b.bed_id "
                       + "ORDER BY a.appointment_date DESC, a.start_time ASC";

        try (PreparedStatement ps = conn.prepareStatement(safeSql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> map = new HashMap<>();
                int apptId = rs.getInt("appointment_id");
                map.put("appointmentId", apptId);
                map.put("customerId", rs.getInt("customer_id"));
                map.put("customerName", rs.getString("customer_name"));
                map.put("customerPhone", rs.getString("customer_phone"));
                map.put("serviceId", rs.getObject("service_id"));
                map.put("serviceName", rs.getString("service_name"));
                map.put("duration", rs.getObject("duration"));
                map.put("customerPackageId", rs.getObject("customer_package_id"));
                map.put("staffId", rs.getObject("staff_id"));
                map.put("staffName", rs.getString("staff_name"));
                map.put("roomId", rs.getObject("room_id"));
                map.put("roomName", rs.getString("room_name"));
                map.put("bedId", rs.getObject("bed_id"));
                map.put("bedNumber", rs.getString("bed_number"));
                map.put("appointmentDate", rs.getDate("appointment_date"));
                map.put("startTime", rs.getTime("start_time"));
                map.put("endTime", rs.getTime("end_time"));
                map.put("status", rs.getString("status"));
                map.put("notes", rs.getString("notes"));
                list.add(map);
            }
        } catch (SQLException e) {
            throw e;
        }
        return list;
    }

    private List<Map<String, Object>> getRoomsWithBeds() throws SQLException {
        List<Map<String, Object>> rooms = new ArrayList<>();
        Map<Integer, Map<String, Object>> byId = new LinkedHashMap<>();
        try (PreparedStatement ps = conn.prepareStatement("SELECT room_id, room_name, room_type, status FROM Room ORDER BY room_id");
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> room = new HashMap<>();
                int id = rs.getInt("room_id");
                room.put("roomId", id);
                room.put("roomName", rs.getString("room_name"));
                room.put("roomType", rs.getString("room_type"));
                room.put("status", rs.getString("status"));
                room.put("beds", new ArrayList<Map<String, Object>>());
                rooms.add(room); byId.put(id, room);
            }
        }
        try (PreparedStatement ps = conn.prepareStatement("SELECT bed_id, room_id, bed_number, status FROM Bed ORDER BY bed_number");
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> room = byId.get(rs.getInt("room_id"));
                if (room == null) continue;
                Map<String, Object> bed = new HashMap<>();
                bed.put("bedId", rs.getInt("bed_id"));
                bed.put("roomId", rs.getInt("room_id"));
                bed.put("bedNumber", rs.getString("bed_number"));
                bed.put("status", rs.getString("status"));
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> beds = (List<Map<String, Object>>) room.get("beds");
                beds.add(bed);
            }
        }
        return rooms;
    }
}
