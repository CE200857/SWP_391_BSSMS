package bssms_persistence.KhanhLTQ;

import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import com.google.gson.JsonObject;
import java.sql.SQLException;
import java.time.*;
import java.util.*;

public class StaffLeaveDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    // Bật/tắt luật "Manager duyệt đơn nghỉ vào thứ 6" (mặc định bật; đặt BSSMS_LEAVE_FRIDAY_RULE=false để tắt khi demo)
    public static boolean fridayRule() {
        return bssms_common.AppConfig.flag("BSSMS_LEAVE_FRIDAY_RULE", true);
    }

    // Ngày nghỉ sớm nhất được xin: thứ 2 ngay sau thứ 6 gần nhất (tính cả hôm nay nếu hôm nay là thứ 6)
    public static LocalDate earliestStart() {
        LocalDate friday = LocalDate.now(ZONE);
        while (friday.getDayOfWeek() != DayOfWeek.FRIDAY) friday = friday.plusDays(1);
        return friday.plusDays(3);
    }

    private static int integer(JsonObject d, String k) {
        if (!d.has(k) || d.get(k).isJsonNull()) throw new IllegalArgumentException("Missing " + k);
        int v = d.get(k).getAsBigDecimal().intValueExact();
        if (v <= 0) throw new IllegalArgumentException(k + " must be greater than 0");
        return v;
    }
    private static String text(JsonObject d, String k) {
        if (!d.has(k) || d.get(k).isJsonNull()) throw new IllegalArgumentException("Missing " + k);
        String v = d.get(k).getAsString().trim();
        if (v.isEmpty() || v.length() > 500) throw new IllegalArgumentException(k + " is invalid");
        return v;
    }
    private static String optional(JsonObject d, String k) {
        return d.has(k) && !d.get(k).isJsonNull() && !d.get(k).getAsString().isBlank() ? d.get(k).getAsString().trim() : null;
    }

    public Object read(String kind, String date) throws SQLException {
        Workflow w = workflow();
        switch (kind) {
            case "leaves": {
                w.roles("Manager");
                // affected_appointments: số lịch hẹn của nhân viên trong những ngày xin nghỉ
                // same_day_requests: số đơn chờ duyệt khác trùng ngày nghỉ
                // approved_staff_name: người đã được duyệt nghỉ trùng ngày (mỗi ngày tối đa 1 người nghỉ)
                List<Map<String, Object>> rows = w.query("SELECT l.*,s.full_name,s.role,"
                        + "(SELECT COUNT(DISTINCT a.appointment_id) FROM Appointment a JOIN AppointmentService x ON x.appointment_id=a.appointment_id WHERE x.technician_id=l.staff_id AND x.status<>'Done' AND a.appointment_date BETWEEN l.start_date AND l.end_date AND " + SchemaSql.BUSY_APPOINTMENT + ") AS affected_appointments,"
                        + "(SELECT COUNT(*) FROM StaffLeave o WHERE o.leave_id<>l.leave_id AND o.status='Pending' AND o.start_date<=l.end_date AND o.end_date>=l.start_date) AS same_day_requests,"
                        + "(SELECT TOP 1 os.full_name FROM StaffLeave o JOIN Staff os ON os.staff_id=o.staff_id WHERE o.leave_id<>l.leave_id AND o.status='Approved' AND o.start_date<=l.end_date AND o.end_date>=l.start_date) AS approved_staff_name "
                        + "FROM StaffLeave l JOIN Staff s ON s.staff_id=l.staff_id "
                        + "ORDER BY CASE WHEN l.status='Pending' THEN 0 ELSE 1 END,l.start_date,affected_appointments,l.requested_at");
                // Gợi ý cho Manager: đơn chờ duyệt, không đụng lịch hẹn và ngày đó chưa có ai nghỉ
                String me = String.valueOf(w.staffId());
                for (Map<String, Object> row : rows) {
                    // mine = the manager's own request: it must be decided by another manager
                    boolean mine = me.equals(String.valueOf(Workflow.id(row.get("staffId"))));
                    row.put("mine", mine);
                    boolean suggested = !mine && "Pending".equals(row.get("status"))
                            && ((Number) row.get("affectedAppointments")).intValue() == 0
                            && row.get("approvedStaffName") == null;
                    row.put("suggested", suggested);
                }
                return rows;
            }
            case "leave-appointments": {
                w.roles("Manager");
                if (date == null || !date.trim().matches("[0-9]+")) throw new IllegalArgumentException("Missing leave request ID.");
                int leave = Integer.parseInt(date.trim());
                Map<String, Object> l = w.one("SELECT staff_id,start_date,end_date FROM StaffLeave WHERE leave_id=?", leave);
                return w.query("SELECT a.appointment_id,a.appointment_date,a.start_time,a.status,c.full_name AS customer_name,s.service_name FROM Appointment a JOIN AppointmentService x ON x.appointment_id=a.appointment_id JOIN Customer c ON c.customer_id=a.customer_id JOIN Service s ON s.service_id=x.service_id WHERE x.technician_id=? AND x.status<>'Done' AND a.appointment_date BETWEEN ? AND ? AND " + SchemaSql.BUSY_APPOINTMENT + " ORDER BY a.appointment_date,a.start_time",
                        l.get("staffId"), l.get("startDate"), l.get("endDate"));
            }
            case "tour-report": {
                w.roles("Manager", "Receptionist");
                LocalDate day = date == null || date.isBlank() ? LocalDate.now(ZONE) : LocalDate.parse(date);
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("date", day.toString());
                r.put("rows", w.query("SELECT t.staff_id,s.full_name,t.start_offset_tours,t.counted_tours,t.actual_tours,t.requested_tours,t.last_assigned_at FROM TechnicianDailyTour t JOIN Staff s ON s.staff_id=t.staff_id WHERE t.work_date=? ORDER BY t.counted_tours DESC,s.full_name", java.sql.Date.valueOf(day)));
                r.put("gap", w.one("SELECT MAX(counted_tours)-MIN(counted_tours) AS gap FROM TechnicianDailyTour WHERE work_date=?", java.sql.Date.valueOf(day)).get("gap"));
                return r;
            }
            default: throw new WorkflowException(404, "Function not found.");
        }
    }

    public Object write(JsonObject d) throws SQLException {
        Workflow w = workflow();
        String action = text(d, "action");
        return w.transaction(() -> leaves(w, action, d));
    }

    private Object leaves(Workflow w, String action, JsonObject d) throws SQLException {
        Map<String, Object> result = new LinkedHashMap<>();
        switch (action) {
            case "request": {
                w.roles("Technician", "Receptionist", "Manager");
                int staff = w.staffId();
                LocalDate start = LocalDate.parse(text(d, "startDate")), end = LocalDate.parse(text(d, "endDate"));
                if (end.isBefore(start)) throw new IllegalArgumentException("The end date must be after the start date.");
                if (!start.isAfter(LocalDate.now(ZONE).minusDays(1))) throw new IllegalArgumentException("Leave cannot start on a past date.");
                // Manager duyệt đơn vào thứ 6 cho tuần sau, nên ngày nghỉ sớm nhất là thứ 2 sau thứ 6 gần nhất
                if (fridayRule() && start.isBefore(earliestStart()))
                    throw new IllegalArgumentException("Leave requests are approved on Fridays for the following week. The earliest start date is " + earliestStart() + ".");
                String reason = optional(d, "reason");
                if (reason == null || reason.length() < 5)
                    throw new IllegalArgumentException("Please enter a clear reason for the leave (at least 5 characters).");
                if (!w.query("SELECT leave_id FROM StaffLeave WHERE staff_id=? AND status IN ('Pending','Approved') AND start_date<=? AND end_date>=?", staff, java.sql.Date.valueOf(end), java.sql.Date.valueOf(start)).isEmpty())
                    throw new WorkflowException(409, "The leave period overlaps another request.");
                w.update("INSERT INTO StaffLeave(staff_id,start_date,end_date,reason,status,requested_at) VALUES(?,?,?,?,'Pending',SYSDATETIME())", staff, java.sql.Date.valueOf(start), java.sql.Date.valueOf(end), reason);
                result.put("message", "Leave request submitted.");
                return result;
            }
            case "cancel": {
                w.roles("Technician", "Receptionist", "Manager");
                if (w.update("UPDATE StaffLeave SET status='Cancelled' WHERE leave_id=? AND staff_id=? AND status='Pending'", integer(d, "id"), w.staffId()) != 1)
                    throw new WorkflowException(409, "You can only cancel your own pending requests.");
                result.put("message", "Leave request cancelled.");
                return result;
            }
            case "decide": {
                w.roles("Manager");
                int id = integer(d, "id");
                String decision = text(d, "decision");
                if (!"Approved".equals(decision) && !"Rejected".equals(decision)) throw new IllegalArgumentException("Invalid decision.");
                Map<String, Object> l = w.one("SELECT staff_id,start_date,end_date,status FROM StaffLeave WHERE leave_id=?", id);
                if (!"Pending".equals(l.get("status"))) throw new WorkflowException(409, "The request has already been processed.");
                if (String.valueOf(w.staffId()).equals(String.valueOf(Workflow.id(l.get("staffId")))))
                    throw new WorkflowException(403, "You cannot approve or reject your own leave request. Another manager must decide it.");
                if ("Approved".equals(decision) && LocalDate.parse(String.valueOf(l.get("endDate")).substring(0, 10)).isBefore(LocalDate.now(ZONE)))
                    throw new WorkflowException(409, "The leave dates have passed, so the request cannot be approved. Please reject it.");
                if ("Approved".equals(decision)) {
                    int staff = Workflow.id(l.get("staffId"));
                    LocalDate from = LocalDate.parse(String.valueOf(l.get("startDate")).substring(0, 10)), to = LocalDate.parse(String.valueOf(l.get("endDate")).substring(0, 10));
                    // Luật duyệt vào thứ 6
                    if (fridayRule() && LocalDate.now(ZONE).getDayOfWeek() != DayOfWeek.FRIDAY)
                        throw new WorkflowException(409, "Leave requests can only be approved on Fridays.");
                    // Mỗi ngày tối đa 1 nhân viên được nghỉ
                    List<Map<String, Object>> taken = w.query("SELECT o.start_date,o.end_date,s.full_name FROM StaffLeave o JOIN Staff s ON s.staff_id=o.staff_id WHERE o.leave_id<>? AND o.status='Approved' AND o.start_date<=? AND o.end_date>=?",
                            id, java.sql.Date.valueOf(to), java.sql.Date.valueOf(from));
                    if (!taken.isEmpty())
                        throw new WorkflowException(409, "Only one staff member may be on leave per day. " + taken.get(0).get("fullName")
                                + " is already approved for leave from " + taken.get(0).get("startDate") + " to " + taken.get(0).get("endDate") + ".");
                    List<Map<String, Object>> blocked = new BookingWorkflow(w).withoutReplacement(staff, from, to);
                    if (!blocked.isEmpty()) {
                        StringBuilder text = new StringBuilder("Cannot approve: the following appointments have no replacement technician: ");
                        for (Map<String, Object> b : blocked) text.append("#").append(b.get("appointmentId")).append(" ").append(b.get("appointmentDate")).append(" ").append(b.get("customerName")).append("; ");
                        throw new WorkflowException(409, text.toString());
                    }
                    w.update("DELETE FROM StaffShift WHERE staff_id=? AND shift_date BETWEEN ? AND ?", staff, java.sql.Date.valueOf(from), java.sql.Date.valueOf(to));
                }
                w.update("UPDATE StaffLeave SET status=?,approved_by_staff_id=?,decided_at=SYSDATETIME(),decision_note=? WHERE leave_id=?", decision, w.staffId(), optional(d, "note"), id);
                int autoRejected = 0;
                if ("Approved".equals(decision)) {
                    // Các đơn chờ duyệt khác trùng ngày không thể duyệt nữa -> tự từ chối
                    autoRejected = w.update("UPDATE StaffLeave SET status='Rejected',approved_by_staff_id=?,decided_at=SYSDATETIME(),decision_note=N'Another staff member is already on leave on these dates.' "
                            + "WHERE leave_id<>? AND status='Pending' AND start_date<=? AND end_date>=?", w.staffId(), id, l.get("endDate"), l.get("startDate"));
                }
                result.put("autoRejected", autoRejected);
                result.put("message", "Approved".equals(decision) ? "Leave approved. Affected appointments have been sent to the receptionist for reassignment." : "Leave request rejected.");
                return result;
            }
            default: throw new IllegalArgumentException("Invalid action.");
        }
    }
}
