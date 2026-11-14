package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.*;

public class TreatmentStatusDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    public List<Map<String, Object>> getTreatmentStatusList(Integer customerId, String status, String fromDate, String toDate) throws SQLException {
        Workflow w = workflow();
        String role = w.role();
        Integer technician = "Technician".equals(role) ? w.staffId() : null;
        if ("Customer".equals(role)) customerId = w.customerId();
        List<Map<String, Object>> rows = w.query("SELECT l.appointment_service_id,l.appointment_id,l.line_no,l.service_id,s.service_name,l.start_time,l.end_time,l.status,l.started_at,l.done_at,"
                + "l.technician_id,st.full_name AS technician_name,l.bed_id,b.bed_number,r.room_name,l.customer_package_id,l.result_notes,l.skin_reaction,"
                + "a.appointment_date,a.status AS appointment_status,a.customer_id,c.full_name AS customer_name,c.phone AS customer_phone,c.allergies,c.skin_condition "
                + "FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id JOIN Customer c ON c.customer_id=a.customer_id "
                + "JOIN Service s ON s.service_id=l.service_id LEFT JOIN Staff st ON st.staff_id=l.technician_id LEFT JOIN Bed b ON b.bed_id=l.bed_id LEFT JOIN Room r ON r.room_id=b.room_id "
                + "WHERE " + Workflow.appointmentScope() + " AND a.status IN ('Confirmed','Checked-in','In-progress','Completed')"
                + " AND (? IS NULL OR l.technician_id=?) AND (? IS NULL OR a.customer_id=?) AND (? IS NULL OR l.status=?)"
                + " AND a.appointment_date>=COALESCE(?,'1900-01-01') AND a.appointment_date<=COALESCE(?,'9999-12-31')"
                + " ORDER BY a.appointment_date DESC,l.start_time",
                w.actor, technician, technician, customerId, customerId, status, status, fromDate, toDate);
        for (Map<String, Object> r : rows) {
            if (!"Waiting".equals(r.get("status"))) continue;
            String block = startBlock(w, r);
            r.put("canStart", block == null);
            r.put("startNote", block);
        }
        return rows;
    }

    private static String startBlock(Workflow w, Map<String, Object> l) throws SQLException {
        int appointment = Workflow.id(l.get("appointmentId"));
        List<Map<String, Object>> before = w.query("SELECT technician_id,status FROM AppointmentService WHERE appointment_id=? AND line_no<? ORDER BY line_no", appointment, l.get("lineNo"));
        boolean partStart = before.isEmpty() || !String.valueOf(before.get(before.size() - 1).get("technicianId")).equals(String.valueOf(l.get("technicianId")));
        String block = Timing.startLine(String.valueOf(l.get("appointmentStatus")), l.get("appointmentDate"), l.get("startTime"), partStart);
        if (block != null) return block;
        for (Map<String, Object> b : before) if (!"Done".equals(b.get("status"))) return "Dịch vụ trước chưa hoàn thành.";
        return null;
    }

    public Map<String, Object> getTreatmentStatusById(int appointmentServiceId) throws SQLException {
        Workflow w = workflow();
        List<Map<String, Object>> rows = getTreatmentStatusList(null, null, null, null);
        for (Map<String, Object> r : rows) if (Workflow.id(r.get("appointmentServiceId")) == appointmentServiceId) return r;
        return null;
    }

    private Map<String, Object> line(Workflow w, int id) throws SQLException {
        Map<String, Object> l = w.one("SELECT l.*,a.status AS appointment_status,a.appointment_date FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id WHERE l.appointment_service_id=?", id);
        if (l.get("technicianId") == null || Workflow.id(l.get("technicianId")) != w.staffId())
            throw new WorkflowException(403, "Dòng dịch vụ này không được giao cho bạn.");
        return l;
    }

    public void start(int id) throws SQLException {
        Workflow w = workflow();
        w.roles("Technician");
        w.transaction(() -> {
            Map<String, Object> l = line(w, id);
            String appointmentStatus = String.valueOf(l.get("appointmentStatus"));
            if (!"Waiting".equals(l.get("status"))) throw new WorkflowException(409, "Dịch vụ đã bắt đầu hoặc đã hoàn thành.");
            int appointment = Workflow.id(l.get("appointmentId"));
            String block = startBlock(w, l);
            if (block != null) throw new WorkflowException(409, block);
            w.update("UPDATE AppointmentService SET status='InProgress',started_at=SYSDATETIME() WHERE appointment_service_id=?", id);
            if (l.get("bedId") != null) w.update("UPDATE Bed SET use_state='InUse',use_state_updated_at=SYSDATETIME() WHERE bed_id=? AND status='Active'", l.get("bedId"));
            if ("Checked-in".equals(appointmentStatus)) {
                w.update("UPDATE Appointment SET status='In-progress' WHERE appointment_id=?", appointment);
                w.history(appointment, "Checked-in", "In-progress", "Bắt đầu dịch vụ đầu tiên");
            }
            return null;
        });
    }

    public Map<String, Object> done(int id) throws SQLException {
        Workflow w = workflow();
        w.roles("Technician");
        return w.transaction(() -> {
            Map<String, Object> l = line(w, id);
            if (!"InProgress".equals(l.get("status"))) throw new WorkflowException(409, "Dịch vụ chưa bắt đầu hoặc đã hoàn thành.");
            int appointment = Workflow.id(l.get("appointmentId"));
            w.update("UPDATE AppointmentService SET status='Done',done_at=SYSDATETIME() WHERE appointment_service_id=?", id);
            if (l.get("bedId") != null) w.update("UPDATE Bed SET use_state='Free',use_state_updated_at=SYSDATETIME() WHERE bed_id=?", l.get("bedId"));
            LocalDate date = LocalDate.parse(String.valueOf(l.get("appointmentDate")).substring(0, 10));
            w.update("UPDATE TechnicianDailyTour SET actual_tours=actual_tours+? WHERE staff_id=? AND work_date=?", l.get("tourCount"), l.get("technicianId"), java.sql.Date.valueOf(date));
            if (l.get("customerPackageId") != null) {
                if (w.update("UPDATE CustomerPackage SET remaining_sessions=remaining_sessions-1 WHERE customer_package_id=? AND remaining_sessions>0", l.get("customerPackageId")) != 1)
                    throw new WorkflowException(409, "Gói liệu trình đã hết buổi.");
                w.update("UPDATE CustomerPackage SET status='Completed' WHERE customer_package_id=? AND remaining_sessions=0", l.get("customerPackageId"));
            }
            boolean completed = w.query("SELECT appointment_service_id FROM AppointmentService WHERE appointment_id=? AND status<>'Done'", appointment).isEmpty();
            if (completed) {
                w.update("UPDATE Appointment SET status='Completed',completed_at=SYSDATETIME() WHERE appointment_id=?", appointment);
                w.history(appointment, "In-progress", "Completed", "Hoàn thành tất cả dịch vụ");
            }
            return Collections.singletonMap("appointmentCompleted", completed);
        });
    }
}
