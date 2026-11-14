package bssms_persistence.common;

import bssms_persistence.DBContext;
import com.google.gson.*;
import java.sql.*;
import java.time.*;
import java.util.*;

public class OperationsDAO extends DBContext implements AutoCloseable {
    public void close() throws SQLException { if (conn != null) conn.close(); }
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private int integer(JsonObject d, String k) {
        if (!d.has(k) || d.get(k).isJsonNull()) throw new IllegalArgumentException("Thiếu " + k);
        int v = d.get(k).getAsBigDecimal().intValueExact();
        if (v <= 0) throw new IllegalArgumentException(k + " phải lớn hơn 0");
        return v;
    }
    private String text(JsonObject d, String k) {
        if (!d.has(k) || d.get(k).isJsonNull()) throw new IllegalArgumentException("Thiếu " + k);
        String v = d.get(k).getAsString().trim();
        if (v.isEmpty() || v.length() > 500) throw new IllegalArgumentException(k + " không hợp lệ");
        return v;
    }
    private static String optional(JsonObject d, String k) {
        return d.has(k) && !d.get(k).isJsonNull() && !d.get(k).getAsString().isBlank() ? d.get(k).getAsString().trim() : null;
    }
    private static LocalTime[] shiftTimes(String type) {
        switch (type) {
            case "Morning": return new LocalTime[]{LocalTime.of(8, 30), LocalTime.of(13, 30)};
            case "Afternoon": return new LocalTime[]{LocalTime.of(13, 30), LocalTime.of(18, 30)};
            case "FullDay": return new LocalTime[]{LocalTime.of(8, 30), LocalTime.of(18, 30)};
            default: throw new IllegalArgumentException("Loại ca phải là Morning, Afternoon hoặc FullDay.");
        }
    }
    private static LocalDate monday(String date) {
        LocalDate day = date == null || date.isBlank() ? LocalDate.now(ZONE) : LocalDate.parse(date);
        return day.minusDays(day.getDayOfWeek().getValue() - 1);
    }

    public Object read(String kind, String date) throws SQLException {
        Workflow w = workflow();
        LocalDate from = monday(date);
        LocalDate to = from.plusDays(6);
        switch (kind) {
            case "scheduling": {
                w.roles("Manager");
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("weekStart", from.toString());
                r.put("staff", w.query("SELECT staff_id,full_name,role FROM Staff WHERE status='Active' AND role IN ('Technician','Receptionist') ORDER BY role DESC,full_name"));
                r.put("services", w.query("SELECT service_id,service_name FROM Service WHERE status='Active' ORDER BY service_name"));
                r.put("shifts", w.query("SELECT ss.staff_shift_id,ss.staff_id,ss.shift_date,ss.shift_type,ss.start_time,ss.end_time,s.full_name FROM StaffShift ss JOIN Staff s ON s.staff_id=ss.staff_id WHERE ss.shift_date BETWEEN ? AND ? ORDER BY ss.shift_date", java.sql.Date.valueOf(from), java.sql.Date.valueOf(to)));
                r.put("leaves", w.query("SELECT l.leave_id,l.staff_id,l.start_date,l.end_date,s.full_name FROM StaffLeave l JOIN Staff s ON s.staff_id=l.staff_id WHERE l.status='Approved' AND l.end_date>=? AND l.start_date<=?", java.sql.Date.valueOf(from), java.sql.Date.valueOf(to)));
                r.put("skills", w.query("SELECT ss.staff_id,ss.service_id,sv.service_name FROM StaffService ss JOIN Service sv ON sv.service_id=ss.service_id"));
                return r;
            }
            case "my-schedule": {
                w.roles("Technician", "Receptionist");
                int staff = w.staffId();
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("weekStart", from.toString());
                r.put("shifts", w.query("SELECT staff_shift_id,shift_date,shift_type,start_time,end_time FROM StaffShift WHERE staff_id=? AND shift_date BETWEEN ? AND ? ORDER BY shift_date", staff, java.sql.Date.valueOf(from), java.sql.Date.valueOf(to)));
                r.put("leaves", w.query("SELECT leave_id,start_date,end_date,reason,status,requested_at,decided_at,decision_note FROM StaffLeave WHERE staff_id=? ORDER BY requested_at DESC", staff));
                return r;
            }
            default: throw new WorkflowException(404, "Không tìm thấy chức năng.");
        }
    }

    public Object write(String kind, JsonObject d) throws SQLException {
        Workflow w = workflow();
        String action = text(d, "action");
        return w.transaction(() -> {
            switch (kind) {
                case "scheduling": return scheduling(w, action, d);
                default: throw new WorkflowException(404, "Không tìm thấy chức năng.");
            }
        });
    }

    private int outsideShift(Workflow w, int staff, LocalDate date) throws SQLException {
        return ((Number) w.one("SELECT COUNT(*) AS n FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id WHERE l.technician_id=? AND a.appointment_date=? AND l.status<>'Done' AND " + SchemaSql.BUSY_APPOINTMENT
                + " AND NOT EXISTS(SELECT 1 FROM StaffShift sh WHERE sh.staff_id=l.technician_id AND sh.shift_date=a.appointment_date AND sh.start_time<=l.start_time AND sh.end_time>=l.end_time)", staff, java.sql.Date.valueOf(date)).get("n")).intValue();
    }

    private static void pastShift(Map<String, Object> shift) {
        LocalDate date = LocalDate.parse(String.valueOf(shift.get("shiftDate")).substring(0, 10));
        if (date.isBefore(LocalDate.now(ZONE))) throw new WorkflowException(409, "Ca ngày " + date + " đã qua, không thể sửa hoặc xóa.");
    }

    private Object scheduling(Workflow w, String action, JsonObject d) throws SQLException {
        w.roles("Manager");
        Map<String, Object> result = new LinkedHashMap<>();
        switch (action) {
            case "createShifts": {
                String type = text(d, "shiftType");
                LocalTime[] times = shiftTimes(type);
                List<String> skipped = new ArrayList<>();
                int created = 0;
                for (JsonElement s : d.getAsJsonArray("staffIds")) for (JsonElement day : d.getAsJsonArray("dates")) {
                    int staff = s.getAsInt();
                    LocalDate date = LocalDate.parse(day.getAsString());
                    if (date.isBefore(LocalDate.now(ZONE))) throw new IllegalArgumentException("Không phân ca cho ngày đã qua (" + date + ").");
                    if (w.query("SELECT staff_id FROM Staff WHERE staff_id=? AND status='Active'", staff).isEmpty()) throw new IllegalArgumentException("Nhân viên không hoạt động.");
                    if (!w.query("SELECT staff_shift_id FROM StaffShift WHERE staff_id=? AND shift_date=?", staff, java.sql.Date.valueOf(date)).isEmpty()
                            || !w.query("SELECT leave_id FROM StaffLeave WHERE staff_id=? AND status='Approved' AND ? BETWEEN start_date AND end_date", staff, java.sql.Date.valueOf(date)).isEmpty()) {
                        skipped.add(staff + "@" + date); continue;
                    }
                    w.update("INSERT INTO StaffShift(staff_id,shift_date,shift_type,start_time,end_time) VALUES(?,?,?,?,?)", staff, java.sql.Date.valueOf(date), type, Time.valueOf(times[0]), Time.valueOf(times[1]));
                    created++;
                }
                result.put("created", created); result.put("skipped", skipped);
                result.put("message", skipped.isEmpty() ? "Đã tạo ca làm." : "Đã tạo " + created + " ca; bỏ qua " + skipped.size() + " ngày đã có ca hoặc nghỉ phép.");
                return result;
            }
            case "updateShift": {
                int id = integer(d, "id");
                String type = text(d, "shiftType");
                LocalTime[] times = shiftTimes(type);
                Map<String, Object> shift = w.one("SELECT staff_id,shift_date FROM StaffShift WHERE staff_shift_id=?", id);
                pastShift(shift);
                w.update("UPDATE StaffShift SET shift_type=?,start_time=?,end_time=? WHERE staff_shift_id=?", type, Time.valueOf(times[0]), Time.valueOf(times[1]), id);
                int affected = outsideShift(w, Workflow.id(shift.get("staffId")), LocalDate.parse(String.valueOf(shift.get("shiftDate")).substring(0, 10)));
                result.put("affected", affected);
                result.put("message", affected == 0 ? "Đã cập nhật ca làm." : "Đã cập nhật ca làm. Có " + affected + " dịch vụ không còn nằm trong ca, cần điều phối lại (Lịch bị ảnh hưởng).");
                return result;
            }
            case "deleteShift": {
                int id = integer(d, "id");
                Map<String, Object> shift = w.one("SELECT staff_id,shift_date FROM StaffShift WHERE staff_shift_id=?", id);
                pastShift(shift);
                w.update("DELETE FROM StaffShift WHERE staff_shift_id=?", id);
                int affected = outsideShift(w, Workflow.id(shift.get("staffId")), LocalDate.parse(String.valueOf(shift.get("shiftDate")).substring(0, 10)));
                result.put("affected", affected);
                result.put("message", affected == 0 ? "Đã xóa ca làm." : "Đã xóa ca. Có " + affected + " dịch vụ cần điều phối lại (Lịch bị ảnh hưởng).");
                return result;
            }
            case "copyWeek": {
                LocalDate source = monday(text(d, "fromDate")), target = monday(text(d, "toDate"));
                if (!source.isBefore(target)) throw new IllegalArgumentException("Tuần đích phải sau tuần nguồn.");
                int created = 0;
                for (Map<String, Object> s : w.query("SELECT ss.staff_id,ss.shift_date,ss.shift_type,ss.start_time,ss.end_time FROM StaffShift ss JOIN Staff st ON st.staff_id=ss.staff_id WHERE st.status='Active' AND ss.shift_date BETWEEN ? AND ?", java.sql.Date.valueOf(source), java.sql.Date.valueOf(source.plusDays(6)))) {
                    LocalDate date = LocalDate.parse(String.valueOf(s.get("shiftDate")).substring(0, 10)).plusDays(java.time.temporal.ChronoUnit.DAYS.between(source, target));
                    if (date.isBefore(LocalDate.now(ZONE))) continue;
                    if (!w.query("SELECT staff_shift_id FROM StaffShift WHERE staff_id=? AND shift_date=?", s.get("staffId"), java.sql.Date.valueOf(date)).isEmpty()
                            || !w.query("SELECT leave_id FROM StaffLeave WHERE staff_id=? AND status='Approved' AND ? BETWEEN start_date AND end_date", s.get("staffId"), java.sql.Date.valueOf(date)).isEmpty()) continue;
                    w.update("INSERT INTO StaffShift(staff_id,shift_date,shift_type,start_time,end_time) VALUES(?,?,?,?,?)", s.get("staffId"), java.sql.Date.valueOf(date), s.get("shiftType"), s.get("startTime"), s.get("endTime"));
                    created++;
                }
                result.put("created", created); result.put("message", "Đã sao chép " + created + " ca làm.");
                return result;
            }
            case "saveSkills": {
                int staff = integer(d, "staffId");
                if (w.query("SELECT staff_id FROM Staff WHERE staff_id=? AND role='Technician' AND status='Active'", staff).isEmpty()) throw new IllegalArgumentException("Chỉ gán kỹ năng cho kỹ thuật viên đang hoạt động.");
                Set<Integer> wanted = new HashSet<>();
                for (JsonElement e : d.getAsJsonArray("serviceIds")) wanted.add(e.getAsInt());
                w.update("DELETE FROM StaffService WHERE staff_id=?", staff);
                for (Integer service : wanted) w.update("INSERT INTO StaffService(staff_id,service_id) VALUES(?,?)", staff, service);
                int affected = ((Number) w.one("SELECT COUNT(*) AS n FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id WHERE l.technician_id=? AND l.status<>'Done' AND a.appointment_date>=CAST(SYSDATETIME() AS date) AND " + SchemaSql.BUSY_APPOINTMENT + " AND NOT EXISTS(SELECT 1 FROM StaffService ss WHERE ss.staff_id=l.technician_id AND ss.service_id=l.service_id)", staff).get("n")).intValue();
                result.put("affected", affected);
                result.put("message", affected == 0 ? "Đã lưu kỹ năng." : "Đã lưu kỹ năng. Có " + affected + " dịch vụ đã giao nhưng KTV không còn kỹ năng, cần phân công lại.");
                return result;
            }
            default: throw new IllegalArgumentException("Thao tác không hợp lệ.");
        }
    }

}
