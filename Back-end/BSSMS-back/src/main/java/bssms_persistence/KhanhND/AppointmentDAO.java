package bssms_persistence.KhanhND;

import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import java.sql.SQLException;
import java.time.*;
import java.util.*;

public class AppointmentDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    private static final String SERVICES = "(SELECT STRING_AGG(s.service_name,N', ') WITHIN GROUP (ORDER BY l.line_no) FROM AppointmentService l JOIN Service s ON s.service_id=l.service_id WHERE l.appointment_id=a.appointment_id)";
    private static final String TECHNICIANS = "(SELECT STRING_AGG(x.full_name,N', ') FROM (SELECT DISTINCT st.full_name FROM AppointmentService l JOIN Staff st ON st.staff_id=l.technician_id WHERE l.appointment_id=a.appointment_id) x)";

    public List<Map<String, Object>> bookingTechnicians() throws SQLException {
        workflow().roles("Receptionist", "Manager", "Customer");
        return workflow().query("SELECT staff_id,full_name,role AS position,status FROM Staff WHERE role='Technician' AND status='Active' ORDER BY full_name");
    }

    public List<Map<String, Object>> list(String date, String status, Integer technician) throws SQLException {
        Workflow w = workflow();
        List<Map<String, Object>> rows = w.query("SELECT a.appointment_id,a.customer_id,a.appointment_date,a.start_time,a.end_time,a.status,a.payment_choice,a.notes,a.created_at,"
                + "c.full_name AS customer_name,c.phone AS customer_phone," + SERVICES + " AS service_names," + TECHNICIANS + " AS technician_names,"
                + "(SELECT TOP 1 i.status FROM Invoice i WHERE i.appointment_id=a.appointment_id AND i.status<>'Cancelled' ORDER BY i.invoice_id DESC) AS invoice_status,"
                + "(SELECT TOP 1 i.total_amount FROM Invoice i WHERE i.appointment_id=a.appointment_id AND i.status<>'Cancelled' ORDER BY i.invoice_id DESC) AS total_amount "
                + "FROM Appointment a JOIN Customer c ON c.customer_id=a.customer_id WHERE " + Workflow.appointmentScope()
                + " AND (? IS NULL OR a.appointment_date=?) AND (? IS NULL OR a.status=?)"
                + " AND (? IS NULL OR EXISTS(SELECT 1 FROM AppointmentService l WHERE l.appointment_id=a.appointment_id AND l.technician_id=?))"
                + " ORDER BY a.appointment_date DESC,a.start_time",
                w.actor, date, date, status, status, technician, technician);
        for (Map<String, Object> r : rows) r.putAll(Timing.flags(r));
        return rows;
    }

    public Map<String, Object> detail(int id) throws SQLException {
        Workflow w = workflow();
        w.appointmentAccess(id);
        Map<String, Object> a = new LinkedHashMap<>(w.one("SELECT a.*,c.full_name AS customer_name,c.phone AS customer_phone,c.email AS customer_email,c.skin_condition,c.allergies,c.notes AS health_notes,t.tier_name "
                + "FROM Appointment a JOIN Customer c ON c.customer_id=a.customer_id JOIN MembershipTier t ON t.membership_tier_id=c.membership_tier_id WHERE a.appointment_id=?", id));
        a.put("services", w.query("SELECT l.appointment_service_id,l.line_no,l.service_id,s.service_name,s.duration,s.required_room_type,l.start_time,l.end_time,l.technician_id,st.full_name AS technician_name,l.is_requested_technician,"
                + "l.bed_id,b.bed_number,r.room_name,l.customer_package_id,tp.package_name,l.unit_price,l.tour_count,l.status,l.started_at,l.done_at,l.result_notes,l.skin_reaction,"
                + "(SELECT COUNT(*) FROM ServiceFeedback f WHERE f.appointment_service_id=l.appointment_service_id) AS feedback_count "
                + "FROM AppointmentService l JOIN Service s ON s.service_id=l.service_id LEFT JOIN Staff st ON st.staff_id=l.technician_id LEFT JOIN Bed b ON b.bed_id=l.bed_id LEFT JOIN Room r ON r.room_id=b.room_id "
                + "LEFT JOIN CustomerPackage cp ON cp.customer_package_id=l.customer_package_id LEFT JOIN TreatmentPackage tp ON tp.treatment_package_id=cp.treatment_package_id WHERE l.appointment_id=? ORDER BY l.line_no", id));
        a.put("invoice", w.query("SELECT TOP 1 invoice_id,status,subtotal,tier_discount,voucher_discount,total_discount,total_amount,paid_at FROM Invoice WHERE appointment_id=? ORDER BY CASE WHEN status='Cancelled' THEN 1 ELSE 0 END,invoice_id DESC", id).stream().findFirst().orElse(null));
        a.put("history", w.query("SELECT old_status,new_status,changed_at,reason FROM AppointmentStatusHistory WHERE appointment_id=? ORDER BY history_id", id));
        a.put("actions", actions(a, w.role()));
        Timing.Appt t = new Timing.Appt(a);
        a.put("timingNote", Timing.note(t));
        a.put("canPayOnline", Timing.payOnline(t) == null);
        return a;
    }

    private List<String> actions(Map<String, Object> a, String role) {
        List<String> result = new ArrayList<>();
        String status = String.valueOf(a.get("status"));
        LocalDateTime start = LocalDateTime.of(LocalDate.parse(String.valueOf(a.get("appointmentDate")).substring(0, 10)), BookingWorkflowTime.parse(a.get("startTime")));
        LocalDateTime now = LocalDateTime.now(BookingWorkflow.ZONE);
        boolean open = "Pending".equals(status) || "Confirmed".equals(status);
        Timing.Appt t = new Timing.Appt(a);
        if ("Receptionist".equals(role)) {
            if (Timing.confirm(t) == null) result.add("confirm");
            if (open) result.add("reschedule");
            if (Timing.staffCancel(t) == null) result.add("cancel");
            if (Timing.checkIn(t) == null) result.add("checkin");
            if (Timing.noShow(t) == null) result.add("noShow");
        } else if ("Manager".equals(role)) {
            if (Timing.staffCancel(t) == null) result.add("cancel");
        } else if ("Customer".equals(role)) {
            if (open && now.isBefore(start.minusHours(2))) { result.add("reschedule"); result.add("cancel"); }
        } else if ("Technician".equals(role)) {
            if ("Checked-in".equals(status) || "In-progress".equals(status)) result.add("serviceStatus");
        }
        return result;
    }

    public Map<String, Object> cancel(int id, String reason) throws SQLException {
        Workflow w = workflow();
        String role = w.role();
        if (!Arrays.asList("Customer", "Receptionist", "Manager").contains(role)) throw new WorkflowException(403, "Role not permitted.");
        w.appointmentAccess(id);
        if (reason == null || reason.isBlank()) throw new IllegalArgumentException("Vui lòng nhập lý do hủy.");
        return w.transaction(() -> {
            Map<String, Object> a = w.one("SELECT status,appointment_date,start_time FROM Appointment WHERE appointment_id=?", id);
            String status = String.valueOf(a.get("status"));
            if (!"Pending".equals(status) && !"Confirmed".equals(status)) throw new WorkflowException(409, "Lịch đã check-in hoặc đã kết thúc nên không thể hủy.");
            LocalDateTime start = LocalDateTime.of(LocalDate.parse(String.valueOf(a.get("appointmentDate")).substring(0, 10)), BookingWorkflowTime.parse(a.get("startTime")));
            if ("Customer".equals(role) && start.isBefore(LocalDateTime.now(BookingWorkflow.ZONE).plusHours(2)))
                throw new WorkflowException(409, "Chỉ được hủy trước giờ hẹn ít nhất 2 tiếng. Vui lòng gọi cho spa.");
            if (!"Customer".equals(role)) {
                String block = Timing.staffCancel(new Timing.Appt(a));
                if (block != null) throw new WorkflowException(409, block);
            }
            w.update("UPDATE Appointment SET status='Cancelled',cancelled_at=SYSDATETIME(),cancellation_reason=? WHERE appointment_id=?", reason.trim(), id);
            w.history(id, status, "Cancelled", reason.trim());
            boolean refund = false;
            for (Map<String, Object> i : w.query("SELECT invoice_id,status FROM Invoice WHERE appointment_id=? AND status IN ('Unpaid','Paid')", id)) {
                if ("Unpaid".equals(i.get("status"))) new BillingWorkflow(w).cancel(Workflow.id(i.get("invoiceId")), "Lịch hẹn bị hủy", null);
                else refund = true;
            }
            return Collections.singletonMap("refundRequired", refund);
        });
    }

    public void reschedule(int id, List<BookingWorkflow.LineInput> lines, String date, String start, String reason) throws SQLException {
        Workflow w = workflow();
        String role = w.role();
        if (!"Customer".equals(role) && !"Receptionist".equals(role)) throw new WorkflowException(403, "Role not permitted.");
        w.appointmentAccess(id);
        new BookingWorkflow(w).reschedule(id, lines, date, start, "Customer".equals(role), reason);
    }

    public int createAtCounter(int customer, List<BookingWorkflow.LineInput> lines, String date, String start, Integer technician, String paymentChoice, String notes) throws SQLException {
        Workflow w = workflow();
        w.roles("Receptionist");
        return new BookingWorkflow(w).create(customer, lines, date, start, technician, paymentChoice, notes, w.staffId());
    }

    static final class BookingWorkflowTime {
        static LocalTime parse(Object value) {
            String text = String.valueOf(value);
            return LocalTime.parse(text.length() > 8 ? text.substring(0, 8) : text);
        }
    }
}
