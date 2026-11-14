package bssms_persistence.HienLNM;

import bssms_feedback.Feedback;
import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import java.sql.SQLException;
import java.util.*;

public class FeedbackDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    private static final String BASE = "SELECT f.feedback_id,f.customer_id,c.full_name AS customer_name,l.appointment_id,f.appointment_service_id,l.service_id,s.service_name,"
            + "f.rating,f.comment,f.created_at,f.updated_at,f.is_hidden,f.moderation_reason,a.appointment_date "
            + "FROM ServiceFeedback f JOIN AppointmentService l ON l.appointment_service_id=f.appointment_service_id JOIN Appointment a ON a.appointment_id=l.appointment_id "
            + "JOIN Service s ON s.service_id=l.service_id JOIN Customer c ON c.customer_id=f.customer_id ";

    static String shortName(Object name) {
        String[] parts = String.valueOf(name).trim().split("\\s+");
        if (parts.length <= 1) return parts[0];
        StringBuilder b = new StringBuilder(parts[0]);
        for (int i = 1; i < parts.length; i++) b.append(' ').append(parts[i].charAt(0)).append('.');
        return b.toString();
    }

    public boolean moderate(int id, boolean hidden, String reason) throws SQLException {
        Workflow w = workflow();
        w.roles("Manager");
        if (hidden && (reason == null || reason.isBlank())) throw new IllegalArgumentException("Vui lòng nhập lý do ẩn đánh giá.");
        return w.update("UPDATE ServiceFeedback SET is_hidden=?,moderation_reason=?,moderated_by_staff_id=? WHERE feedback_id=?",
                hidden, hidden ? reason.trim() : null, hidden ? w.staffId() : null, id) > 0;
    }

    public List<Map<String, Object>> getAllForModeration() throws SQLException {
        workflow().roles("Manager", "Receptionist");
        return workflow().query(BASE + "ORDER BY f.created_at DESC");
    }

    public List<Map<String, Object>> getAvailableAppointmentsForFeedback(int customerId) throws SQLException {
        Workflow w = workflow();
        w.roles("Customer");
        return w.query("SELECT a.appointment_id,a.appointment_date,l.appointment_service_id,l.service_id,s.service_name,l.line_no,l.done_at "
                + "FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id JOIN Service s ON s.service_id=l.service_id "
                + "WHERE a.customer_id=? AND l.status='Done' AND NOT EXISTS(SELECT 1 FROM ServiceFeedback f WHERE f.appointment_service_id=l.appointment_service_id) "
                + "ORDER BY l.done_at DESC", w.customerId());
    }

    public List<Map<String, Object>> getAllFeedbackDetails(Integer serviceId) throws SQLException {
        Workflow w = new Workflow(conn, 0);
        List<Map<String, Object>> rows = w.query("SELECT f.feedback_id,l.service_id,s.service_name,f.rating,f.comment,f.created_at,c.full_name AS customer_name "
                + "FROM ServiceFeedback f JOIN AppointmentService l ON l.appointment_service_id=f.appointment_service_id JOIN Service s ON s.service_id=l.service_id JOIN Customer c ON c.customer_id=f.customer_id "
                + "WHERE f.is_hidden=0 AND (? IS NULL OR l.service_id=?) ORDER BY f.created_at DESC", serviceId, serviceId);
        for (Map<String, Object> r : rows) r.put("customerName", shortName(r.get("customerName")));
        return rows;
    }
    public List<Map<String, Object>> getAllFeedbackDetails() throws SQLException { return getAllFeedbackDetails(null); }

    public List<Map<String, Object>> getServiceRatings() throws SQLException {
        return new Workflow(conn, 0).query("SELECT l.service_id,COUNT(*) AS review_count,CAST(AVG(CAST(f.rating AS decimal(5,2))) AS decimal(3,1)) AS avg_rating "
                + "FROM ServiceFeedback f JOIN AppointmentService l ON l.appointment_service_id=f.appointment_service_id WHERE f.is_hidden=0 GROUP BY l.service_id");
    }

    public List<Map<String, Object>> getFeedbackByCustomerId(int customerId) throws SQLException {
        Workflow w = workflow();
        if ("Customer".equals(w.role())) customerId = w.customerId(); else w.roles("Manager", "Receptionist");
        List<Map<String, Object>> rows = w.query(BASE + "WHERE f.customer_id=? ORDER BY f.created_at DESC", customerId);
        for (Map<String, Object> r : rows)
            r.put("editable", !w.query("SELECT feedback_id FROM ServiceFeedback WHERE feedback_id=? AND created_at>=DATEADD(day,-7,SYSDATETIME()) AND is_hidden=0", r.get("feedbackId")).isEmpty());
        return rows;
    }

    public Map<String, Object> getFeedbackDetails(int id) throws SQLException {
        Workflow w = workflow();
        Map<String, Object> r = w.one(BASE + "WHERE f.feedback_id=?", id);
        if ("Customer".equals(w.role()) && Workflow.id(r.get("customerId")) != w.customerId()) throw new WorkflowException(404, "Không tìm thấy đánh giá.");
        return r;
    }

    public Feedback getFeedbackById(int id) throws SQLException {
        Map<String, Object> r = getFeedbackDetails(id);
        Feedback f = new Feedback(Workflow.id(r.get("feedbackId")), Workflow.id(r.get("customerId")), Workflow.id(r.get("appointmentId")),
                Workflow.id(r.get("serviceId")), Workflow.id(r.get("rating")), (String) r.get("comment"), null);
        f.setAppointmentServiceId(Workflow.id(r.get("appointmentServiceId")));
        return f;
    }

    public int addFeedback(Feedback fb) throws Exception {
        Workflow w = workflow();
        w.roles("Customer");
        int customer = w.customerId();
        if (fb.getRating() < 1 || fb.getRating() > 5) throw new IllegalArgumentException("Vui lòng chọn từ 1 đến 5 sao.");
        String comment = fb.getComment() == null || fb.getComment().isBlank() ? null : fb.getComment().trim();
        if (comment != null && comment.length() > 1000) throw new IllegalArgumentException("Nhận xét tối đa 1000 ký tự.");
        int line = fb.getAppointmentServiceId();
        if (line <= 0) line = w.query("SELECT TOP 1 appointment_service_id FROM AppointmentService WHERE appointment_id=? AND service_id=? ORDER BY line_no", fb.getAppointmentId(), fb.getServiceId())
                .stream().map(r -> Workflow.id(r.get("appointmentServiceId"))).findFirst().orElse(0);
        int changed = w.update("INSERT INTO ServiceFeedback(customer_id,appointment_service_id,rating,comment,created_at,is_hidden) "
                + "SELECT a.customer_id,l.appointment_service_id,?,?,SYSDATETIME(),0 FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id "
                + "WHERE l.appointment_service_id=? AND a.customer_id=? AND l.status='Done' AND NOT EXISTS(SELECT 1 FROM ServiceFeedback f WHERE f.appointment_service_id=l.appointment_service_id)",
                fb.getRating(), comment, line, customer);
        if (changed != 1) throw new WorkflowException(409, "Chỉ đánh giá được dịch vụ đã hoàn thành của bạn, mỗi dịch vụ một lần.");
        return changed;
    }

    public int updateFeedback(Feedback fb) throws Exception {
        Workflow w = workflow();
        w.roles("Customer");
        if (fb.getRating() < 1 || fb.getRating() > 5) throw new IllegalArgumentException("Vui lòng chọn từ 1 đến 5 sao.");
        String comment = fb.getComment() == null || fb.getComment().isBlank() ? null : fb.getComment().trim();
        if (comment != null && comment.length() > 1000) throw new IllegalArgumentException("Nhận xét tối đa 1000 ký tự.");
        int changed = w.update("UPDATE ServiceFeedback SET rating=?,comment=?,updated_at=SYSDATETIME() WHERE feedback_id=? AND customer_id=? AND is_hidden=0 AND created_at>=DATEADD(day,-7,SYSDATETIME())",
                fb.getRating(), comment, fb.getFeedbackId(), w.customerId());
        if (changed != 1) throw new WorkflowException(409, "Chỉ sửa được đánh giá của bạn trong vòng 7 ngày.");
        return changed;
    }

    public boolean deleteFeedback(int id) throws SQLException {
        Workflow w = workflow();
        w.roles("Customer");
        return w.update("DELETE FROM ServiceFeedback WHERE feedback_id=? AND customer_id=?", id, w.customerId()) > 0;
    }
}
