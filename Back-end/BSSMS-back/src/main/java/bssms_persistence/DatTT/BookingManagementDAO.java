/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_persistence.DatTT;

import bssms_persistence.DBContext;

import java.sql.*;
import bssms_account.Staff;
import bssms_booking.*;
import bssms_persistence.common.ModelRows;
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
        String sql = "SELECT customer_id FROM " + bssms_persistence.common.SchemaSql.CUSTOMERS + " Customer WHERE account_id = ?";
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
    public List<ActivePackage> getActivePackagesByCustomer(int customerId) throws SQLException {
        requireConnection();
        List<ActivePackage> list = new ArrayList<>();
        String sql = "SELECT cp.customer_package_id, cp.treatment_package_id, cp.remaining_sessions, "
                   + "cp.expiry_date, tp.package_name, tp.service_id, s.service_name, s.duration "
                   + "FROM CustomerPackage cp "
                   + "JOIN TreatmentPackage tp ON cp.treatment_package_id = tp.treatment_package_id "
                   + "JOIN Service s ON tp.service_id = s.service_id "
                   + "WHERE cp.customer_id = ? AND cp.status = 'Active' AND cp.remaining_sessions > 0 AND EXISTS(SELECT 1 FROM " + bssms_persistence.common.SchemaSql.PACKAGE_SALES + " ip JOIN Invoice i ON i.invoice_id=ip.invoice_id WHERE ip.customer_package_id=cp.customer_package_id AND i.status='Paid') "
                   + "AND (cp.expiry_date IS NULL OR CAST(cp.expiry_date AS DATE) >= CAST(GETDATE() AS DATE))";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, customerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ActivePackage value = new ActivePackage();
                    value.setCustomerPackageId(rs.getInt("customer_package_id"));
                    value.setTreatmentPackageId(rs.getInt("treatment_package_id"));
                    value.setRemainingSessions(rs.getInt("remaining_sessions"));
                    value.setExpiryDate(rs.getDate("expiry_date"));
                    value.setPackageName(rs.getString("package_name"));
                    value.setServiceId(rs.getInt("service_id"));
                    value.setServiceName(rs.getString("service_name"));
                    value.setDuration(rs.getInt("duration"));
                    list.add(value);
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
    public SlotAvailability checkSlotAvailability(int serviceId, String dateStr, Integer requestedTechId) throws Exception {
        return new bssms_persistence.common.BookingWorkflow(conn,0).slots(serviceId,dateStr,requestedTechId);
    }

    private List<Staff> getEligibleTechnicians(int serviceId, Integer requestedTechId) throws SQLException {
        return new bssms_persistence.common.BookingWorkflow(conn,0).technicians(serviceId,requestedTechId);
    }





    // =========================================================================
    // 2. CREATE ONLINE APPOINTMENT (Customer)
    // =========================================================================
    public Appointment createOnlineAppointment(
            int customerId,
            int serviceId,
            Integer customerPackageId,
            String appointmentDateStr,
            String startTimeStr,
            Integer technicianId,
            String notes) throws Exception {
        return new bssms_persistence.common.BookingWorkflow(conn,requireActorAccountId()).save(customerId,serviceId,customerPackageId,appointmentDateStr,startTimeStr,technicianId,null,null,notes);
    }

    // =========================================================================
    // 3. CHECK-IN & STATUS UPDATE (Receptionist)
    // =========================================================================
    public boolean updateCheckInAndStatus(int appointmentId, String newStatus, String notes) throws Exception {
        workflow().call("usp_ChangeAppointmentStatus",requireActorAccountId(),appointmentId,newStatus,notes,notes,null);
        return true;
    }

    // =========================================================================
    // 4. COORDINATE SERVICE (Receptionist: Phân bổ KTV, Phòng, Giường, Thiết bị)
    // =========================================================================
    public CoordinationResources getCoordinationResources(int appointmentId) throws Exception {
        requireConnection();
        CoordinationResources data = new CoordinationResources();

        // 1. Thông tin lịch hẹn hiện tại
        String apptSql = "SELECT a.appointment_id, a.customer_id, c.full_name AS customer_name, c.phone, "
                       + "a.service_id, s.service_name, s.duration, a.room_id, r.room_name, "
                       + "a.bed_id, b.bed_number, a.appointment_date, a.start_time, a.end_time, a.status, a.notes "
                       + "FROM Appointment a "
                       + "JOIN " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c ON a.customer_id = c.customer_id "
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
                    Appointment appt = new Appointment();
                    appt.setAppointmentId(rs.getInt("appointment_id"));
                    appt.setCustomerId(rs.getInt("customer_id"));
                    appt.setCustomerName(rs.getString("customer_name"));
                    appt.setPhone(rs.getString("phone"));
                    serviceId = rs.getInt("service_id");
                    appt.setServiceId(serviceId);
                    appt.setServiceName(rs.getString("service_name"));
                    appt.setDuration(rs.getInt("duration"));
                    appt.setRoomId((Integer)rs.getObject("room_id"));
                    appt.setRoomName(rs.getString("room_name"));
                    appt.setBedId((Integer)rs.getObject("bed_id"));
                    appt.setBedNumber(rs.getString("bed_number"));
                    apptDate = rs.getDate("appointment_date");
                    startTime = rs.getTime("start_time");
                    endTime = rs.getTime("end_time");
                    appt.setAppointmentDate(apptDate == null ? null : apptDate.toString());
                    appt.setStartTime(startTime == null ? null : startTime.toString());
                    appt.setEndTime(endTime == null ? null : endTime.toString());
                    appt.setStatus(rs.getString("status"));
                    appt.setNotes(rs.getString("notes"));
                    data.setAppointment(appt);
                } else {
                    throw new IllegalArgumentException("Không tìm thấy lịch hẹn #" + appointmentId);
                }
            }
        }

        // 2. Nhân sự đang được gán cho lịch hẹn này
        List<Staff> assignedStaff = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT ast.staff_id, s.full_name, ast.role FROM AppointmentStaff ast JOIN " + bssms_persistence.common.SchemaSql.STAFF + " s ON ast.staff_id = s.staff_id WHERE ast.appointment_id = ?")) {
            ps.setInt(1, appointmentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Staff st = new Staff();
                    st.setStaffId(rs.getInt("staff_id"));
                    st.setFullName(rs.getString("full_name"));
                    st.setRole(rs.getString("role"));
                    assignedStaff.add(st);
                }
            }
        }
        data.setAssignedStaff(assignedStaff);

        // 3. Thiết bị đang được gán cho lịch hẹn này
        List<AssignedEquipment> assignedEquipments = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT ae.equipment_id, e.equipment_name, ae.quantity FROM AppointmentEquipment ae JOIN Equipment e ON ae.equipment_id = e.equipment_id WHERE ae.appointment_id = ?")) {
            ps.setInt(1, appointmentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    AssignedEquipment eq = new AssignedEquipment();
                    eq.setEquipmentId(rs.getInt("equipment_id"));
                    eq.setEquipmentName(rs.getString("equipment_name"));
                    eq.setQuantity(rs.getInt("quantity"));
                    assignedEquipments.add(eq);
                }
            }
        }
        data.setAssignedEquipments(assignedEquipments);

        // 4. Danh sách toàn bộ KTV kèm cờ gợi ý (isSuggested: có chuyên môn + không trùng lịch)
        List<Staff> allTechnicians = new ArrayList<>();
        String techSql = "SELECT s.staff_id, s.full_name, "
                       + "CASE WHEN EXISTS (SELECT 1 FROM StaffService ss WHERE ss.staff_id = s.staff_id AND ss.service_id = ?) THEN 1 ELSE 0 END AS has_skill "
                       + "FROM " + bssms_persistence.common.SchemaSql.STAFF + " s JOIN " + bssms_persistence.common.SchemaSql.ACCOUNTS + " a ON s.account_id = a.account_id "
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
                    Staff t = new Staff();
                    t.setStaffId(sId);
                    t.setFullName(rs.getString("full_name"));
                    t.setHasSkill(hasSkill);
                    t.setIsFree(free);
                    t.setIsSuggested(hasSkill && free);
                    allTechnicians.add(t);
                }
            }
        }
        data.setTechnicians(allTechnicians);

        // 5. Danh sách Phòng và Giường
        data.setRoomsWithBeds(getRoomsWithBeds());

        // 6. Danh sách Thiết bị (separate request-scoped connection, always closed)
        try (EquipmentDAO eqDao = new EquipmentDAO()) {
            data.setEquipments(eqDao.getAllEquipments());
        }

        return data;
    }

    private boolean isStaffFreeExceptAppointment(int staffId, int excludeApptId, java.sql.Date date, Time start, Time end) throws SQLException {
        return !new bssms_persistence.common.BookingWorkflow(conn,0).freeTechnicians(
            new bssms_persistence.common.Workflow(conn,0).one(rs -> rs.getInt("service_id"), "SELECT service_id FROM Appointment WHERE appointment_id=?",excludeApptId),date.toString(),start.toString(),end.toString(),staffId,excludeApptId).isEmpty();
    }

    // Lưu điều phối dịch vụ (KTV + Phòng + Giường + Thiết bị)
    public boolean coordinateAppointment(
            int appointmentId,
            Integer technicianId,
            Integer roomId,
            Integer bedId,
            List<Integer> equipmentIds) throws Exception {
        bssms_persistence.common.Workflow w=workflow();
        w.roles("Receptionist","Manager");
        return w.transaction(()->{
            Appointment a=w.one(ModelRows::appointment, "SELECT * FROM Appointment WHERE appointment_id=?",appointmentId);
            if(bedId==null || technicianId==null || roomId==null) throw new IllegalArgumentException("Technician, room and bed are required.");
            if(w.query(rs -> rs.getInt("bed_id"), "SELECT bed_id FROM Bed WHERE bed_id=? AND room_id=?",bedId,roomId).isEmpty()) throw new IllegalArgumentException("Bed does not belong to room.");
            int service=a.getServiceId();
            Set<Integer> required=new HashSet<>();
            required.addAll(w.query(rs -> rs.getInt("equipment_id"), "SELECT equipment_id FROM ServiceEquipment WHERE service_id=?",service));
            if(equipmentIds!=null && !new HashSet<>(equipmentIds).equals(required)) throw new IllegalArgumentException("Select exactly the equipment configured for this service.");
            new bssms_persistence.common.BookingWorkflow(conn,requireActorAccountId()).save(a.getCustomerId(),service,a.getCustomerPackageId(),a.getAppointmentDate().toString(),a.getStartTime().toString(),technicianId,bedId,appointmentId,null);
            w.call("usp_ChangeAppointmentStatus",requireActorAccountId(),appointmentId,"Confirmed",null,null,null);
            return true;
        });
    }

    // Lấy toàn bộ danh sách lịch hẹn chi tiết phục vụ trang Điều phối & Check-in của Lễ tân
    public List<Appointment> getAllAppointmentsForCoordination() throws SQLException {
        requireConnection();
        List<Appointment> list = new ArrayList<>();
        // Sử dụng câu query chuẩn với bảng hiện tại trong BSSMS.sql
        String safeSql = "SELECT a.appointment_id, a.customer_id, c.full_name AS customer_name, COALESCE(c.phone, acc.phone) AS customer_phone, "
                       + "a.service_id, s.service_name, s.duration, a.customer_package_id, "
                       + "ast.staff_id, st.full_name AS staff_name, "
                       + "a.room_id, r.room_name, a.bed_id, b.bed_number, "
                       + "a.appointment_date, a.start_time, a.end_time, a.status, a.notes "
                       + "FROM Appointment a "
                       + "JOIN " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c ON a.customer_id = c.customer_id "
                       + "LEFT JOIN " + bssms_persistence.common.SchemaSql.ACCOUNTS + " acc ON c.account_id = acc.account_id "
                       + "LEFT JOIN Service s ON a.service_id = s.service_id "
                       + "LEFT JOIN AppointmentStaff ast ON a.appointment_id = ast.appointment_id "
                       + "LEFT JOIN " + bssms_persistence.common.SchemaSql.STAFF + " st ON ast.staff_id = st.staff_id "
                       + "LEFT JOIN Room r ON a.room_id = r.room_id "
                       + "LEFT JOIN Bed b ON a.bed_id = b.bed_id "
                       + "ORDER BY a.appointment_date DESC, a.start_time ASC";

        try (PreparedStatement ps = conn.prepareStatement(safeSql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Appointment value = ModelRows.appointment(rs);
                list.add(value);
            }
        } catch (SQLException e) {
            throw e;
        }
        return list;
    }

    private List<RoomWithBeds> getRoomsWithBeds() throws SQLException {
        List<RoomWithBeds> rooms = new ArrayList<>();
        Map<Integer, RoomWithBeds> byId = new LinkedHashMap<>();
        try (PreparedStatement ps = conn.prepareStatement("SELECT room_id, room_name, room_type, status FROM Room ORDER BY room_id");
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                RoomWithBeds room = new RoomWithBeds();
                int id = rs.getInt("room_id");
                room.setRoomId(id);
                room.setRoomName(rs.getString("room_name"));
                room.setRoomType(rs.getString("room_type"));
                room.setStatus(rs.getString("status"));
                room.setBeds(new ArrayList<AvailableBed>());
                rooms.add(room); byId.put(id, room);
            }
        }
        try (PreparedStatement ps = conn.prepareStatement("SELECT bed_id, room_id, bed_number, status FROM Bed ORDER BY bed_number");
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                RoomWithBeds room = byId.get(rs.getInt("room_id"));
                if (room == null) continue;
                AvailableBed bed = new AvailableBed();
                bed.setBedId(rs.getInt("bed_id"));
                bed.setRoomId(rs.getInt("room_id"));
                bed.setBedNumber(rs.getString("bed_number"));
                bed.setStatus(rs.getString("status"));
                        List<AvailableBed> beds = room.getBeds();
                beds.add(bed);
            }
        }
        return rooms;
    }
}
