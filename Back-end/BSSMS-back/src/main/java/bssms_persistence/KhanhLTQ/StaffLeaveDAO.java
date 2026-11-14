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

    private static int integer(JsonObject d, String k) {
        if (!d.has(k) || d.get(k).isJsonNull()) throw new IllegalArgumentException("Thiếu " + k);
        int v = d.get(k).getAsBigDecimal().intValueExact();
        if (v <= 0) throw new IllegalArgumentException(k + " phải lớn hơn 0");
        return v;
    }
    private static String text(JsonObject d, String k) {
        if (!d.has(k) || d.get(k).isJsonNull()) throw new IllegalArgumentException("Thiếu " + k);
        String v = d.get(k).getAsString().trim();
        if (v.isEmpty() || v.length() > 500) throw new IllegalArgumentException(k + " không hợp lệ");
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
                List<Map<String, Object>> rows = w.query("SELECT l.*,s.full_name,(SELECT COUNT(DISTINCT a.appointment_id) FROM Appointment a JOIN AppointmentService x ON x.appointment_id=a.appointment_id WHERE x.technician_id=l.staff_id AND x.status<>'Done' AND a.appointment_date BETWEEN l.start_date AND l.end_date AND " + SchemaSql.BUSY_APPOINTMENT + ") AS affected_appointments FROM StaffLeave l JOIN Staff s ON s.staff_id=l.staff_id ORDER BY CASE WHEN l.status='Pending' THEN 0 ELSE 1 END,l.requested_at DESC");
                return rows;
            }
            case "leave-appointments": {
                w.roles("Manager");
                if (date == null || !date.trim().matches("[0-9]+")) throw new IllegalArgumentException("Thiếu mã đơn nghỉ.");
                int leave = Integer.parseInt(date.trim());
                Map<String, Object> l = w.one("SELECT staff_id,start_date,end_date FROM StaffLeave WHERE leave_id=?", leave);
                return w.query("SELECT a.appointment_id,a.appointment_date,a.start_time,a.status,c.full_name AS customer_name,s.service_name FROM Appointment a JOIN AppointmentService x ON x.appointment_id=a.appointment_id JOIN Customer c ON c.customer_id=a.customer_id JOIN Service s ON s.service_id=x.service_id WHERE x.technician_id=? AND x.status<>'Done' AND a.appointment_date BETWEEN ? AND ? AND " + SchemaSql.BUSY_APPOINTMENT + " ORDER BY a.appointment_date,a.start_time",
                        l.get("staffId"), l.get("startDate"), l.get("endDate"));
            }
            case "tour-report": {
                w.roles("Manager");
                LocalDate day = date == null || date.isBlank() ? LocalDate.now(ZONE) : LocalDate.parse(date);
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("date", day.toString());
                r.put("rows", w.query("SELECT t.staff_id,s.full_name,t.start_offset_tours,t.counted_tours,t.actual_tours,t.requested_tours,t.last_assigned_at FROM TechnicianDailyTour t JOIN Staff s ON s.staff_id=t.staff_id WHERE t.work_date=? ORDER BY t.counted_tours DESC,s.full_name", java.sql.Date.valueOf(day)));
                r.put("gap", w.one("SELECT MAX(counted_tours)-MIN(counted_tours) AS gap FROM TechnicianDailyTour WHERE work_date=?", java.sql.Date.valueOf(day)).get("gap"));
                return r;
            }
            default: throw new WorkflowException(404, "Không tìm thấy chức năng.");
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
                w.roles("Technician", "Receptionist");
                int staff = w.staffId();
                LocalDate start = LocalDate.parse(text(d, "startDate")), end = LocalDate.parse(text(d, "endDate"));
                if (end.isBefore(start)) throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu.");
                if (!start.isAfter(LocalDate.now(ZONE).minusDays(1))) throw new IllegalArgumentException("Không xin nghỉ cho ngày đã qua.");
                if (!w.query("SELECT leave_id FROM StaffLeave WHERE staff_id=? AND status IN ('Pending','Approved') AND start_date<=? AND end_date>=?", staff, java.sql.Date.valueOf(end), java.sql.Date.valueOf(start)).isEmpty())
                    throw new WorkflowException(409, "Khoảng nghỉ trùng với đơn khác.");
                w.update("INSERT INTO StaffLeave(staff_id,start_date,end_date,reason,status,requested_at) VALUES(?,?,?,?,'Pending',SYSDATETIME())", staff, java.sql.Date.valueOf(start), java.sql.Date.valueOf(end), optional(d, "reason"));
                result.put("message", "Đã gửi đơn xin nghỉ.");
                return result;
            }
            case "cancel": {
                w.roles("Technician", "Receptionist");
                if (w.update("UPDATE StaffLeave SET status='Cancelled' WHERE leave_id=? AND staff_id=? AND status='Pending'", integer(d, "id"), w.staffId()) != 1)
                    throw new WorkflowException(409, "Chỉ hủy được đơn đang chờ duyệt của bạn.");
                result.put("message", "Đã hủy đơn xin nghỉ.");
                return result;
            }
            case "decide": {
                w.roles("Manager");
                int id = integer(d, "id");
                String decision = text(d, "decision");
                if (!"Approved".equals(decision) && !"Rejected".equals(decision)) throw new IllegalArgumentException("Quyết định không hợp lệ.");
                Map<String, Object> l = w.one("SELECT staff_id,start_date,end_date,status FROM StaffLeave WHERE leave_id=?", id);
                if (!"Pending".equals(l.get("status"))) throw new WorkflowException(409, "Đơn đã được xử lý.");
                if ("Approved".equals(decision) && LocalDate.parse(String.valueOf(l.get("endDate")).substring(0, 10)).isBefore(LocalDate.now(ZONE)))
                    throw new WorkflowException(409, "Đơn nghỉ đã qua ngày nghỉ, không thể duyệt. Hãy từ chối đơn.");
                if ("Approved".equals(decision)) {
                    int staff = Workflow.id(l.get("staffId"));
                    LocalDate from = LocalDate.parse(String.valueOf(l.get("startDate")).substring(0, 10)), to = LocalDate.parse(String.valueOf(l.get("endDate")).substring(0, 10));
                    List<Map<String, Object>> blocked = new BookingWorkflow(w).withoutReplacement(staff, from, to);
                    if (!blocked.isEmpty()) {
                        StringBuilder text = new StringBuilder("Không duyệt được: các lịch sau không có KTV thay thế: ");
                        for (Map<String, Object> b : blocked) text.append("#").append(b.get("appointmentId")).append(" ").append(b.get("appointmentDate")).append(" ").append(b.get("customerName")).append("; ");
                        throw new WorkflowException(409, text.toString());
                    }
                    w.update("DELETE FROM StaffShift WHERE staff_id=? AND shift_date BETWEEN ? AND ?", staff, java.sql.Date.valueOf(from), java.sql.Date.valueOf(to));
                }
                w.update("UPDATE StaffLeave SET status=?,approved_by_staff_id=?,decided_at=SYSDATETIME(),decision_note=? WHERE leave_id=?", decision, w.staffId(), optional(d, "note"), id);
                result.put("message", "Approved".equals(decision) ? "Đã duyệt đơn nghỉ. Các lịch bị ảnh hưởng được chuyển cho lễ tân điều phối." : "Đã từ chối đơn nghỉ.");
                return result;
            }
            default: throw new IllegalArgumentException("Thao tác không hợp lệ.");
        }
    }
}
