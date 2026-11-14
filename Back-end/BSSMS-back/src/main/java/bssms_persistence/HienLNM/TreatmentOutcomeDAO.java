package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import java.sql.SQLException;
import java.util.*;

public class TreatmentOutcomeDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    public Map<String, Object> outcome(int lineId) throws SQLException {
        Workflow w = workflow();
        Map<String, Object> l = new LinkedHashMap<>(w.one("SELECT l.appointment_service_id,l.appointment_id,l.status,l.result_notes AS notes,l.skin_reaction,l.done_at,s.service_name,c.full_name AS customer_name "
                + "FROM AppointmentService l JOIN Service s ON s.service_id=l.service_id JOIN Appointment a ON a.appointment_id=l.appointment_id JOIN Customer c ON c.customer_id=a.customer_id WHERE l.appointment_service_id=?", lineId));
        w.appointmentAccess(Workflow.id(l.get("appointmentId")));
        l.put("photos", w.query("SELECT photo_id,photo_type,created_at FROM TreatmentPhoto WHERE appointment_service_id=? ORDER BY photo_id", lineId));
        return l;
    }

    public boolean recordOutcome(int lineId, String notes, String skinReaction) throws SQLException {
        Workflow w = workflow();
        w.roles("Technician");
        if (notes == null || notes.isBlank()) throw new IllegalArgumentException("Vui lòng nhập kết quả điều trị.");
        if (notes.length() > 4000 || (skinReaction != null && skinReaction.length() > 1000)) throw new IllegalArgumentException("Nội dung quá dài.");
        Map<String, Object> l = w.one("SELECT status,technician_id,result_notes,done_at FROM AppointmentService WHERE appointment_service_id=?", lineId);
        if (l.get("technicianId") == null || Workflow.id(l.get("technicianId")) != w.staffId()) throw new WorkflowException(403, "Dòng dịch vụ này không được giao cho bạn.");
        if (!"Done".equals(l.get("status"))) throw new WorkflowException(409, "Chỉ ghi nhận kết quả sau khi hoàn thành dịch vụ.");
        if (l.get("resultNotes") != null && w.query("SELECT appointment_service_id FROM AppointmentService WHERE appointment_service_id=? AND CAST(done_at AS date)=CAST(SYSDATETIME() AS date)", lineId).isEmpty())
            throw new WorkflowException(409, "Chỉ được sửa kết quả trong ngày thực hiện.");
        return w.update("UPDATE AppointmentService SET result_notes=?,skin_reaction=? WHERE appointment_service_id=?", notes.trim(), skinReaction == null || skinReaction.isBlank() ? null : skinReaction.trim(), lineId) == 1;
    }
}
