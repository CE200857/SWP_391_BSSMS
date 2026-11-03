package bssms_persistence.HienLNM;

import bssms_feedback.Feedback;
import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import bssms_persistence.common.SchemaSql;
import bssms_persistence.common.WorkflowException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Đánh giá theo DỊCH VỤ: mỗi dịch vụ đã hoàn thành trong mỗi lần đến (lịch hẹn) được khách đánh giá một lần.
 * Dữ liệu nằm ở bảng ServiceFeedback (xem 13_Feedback_Per_Service.sql).
 *
 * @author HienLNM
 */
public class FeedbackDAO extends DBContext implements AutoCloseable {

    private static final String NOW_VN = "CONVERT(datetime2,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time')";

    private void requireConnection() {
        if (conn == null) throw new DataAccessException("Database connection unavailable");
    }

    @Override public void close() throws java.sql.SQLException { if (conn != null) conn.close(); }

    // ------------------------------------------------------------------ Manager (9.3)

    public boolean moderate(int id, boolean hidden, String reason) throws java.sql.SQLException {
        workflow().roles("Manager");
        if (reason == null || reason.isBlank()) throw new IllegalArgumentException("Moderation reason required.");
        return workflow().update("UPDATE ServiceFeedback SET is_hidden=?,moderation_reason=?,updated_at=" + NOW_VN + " WHERE feedback_id=?",
                hidden, reason.trim(), id) > 0;
    }

    /** Manager view of every review, including hidden ones. */
    public List<Map<String, Object>> getAllForModeration() throws java.sql.SQLException {
        workflow().roles("Manager");
        return workflow().query(
            "SELECT f.feedback_id,f.customer_id,c.full_name AS customer_name,f.appointment_id,f.service_id,s.service_name,"
          + "a.appointment_date,f.rating,f.comment,f.created_at,f.is_hidden,f.moderation_reason "
          + "FROM " + SchemaSql.FEEDBACK + " f "
          + "JOIN " + SchemaSql.CUSTOMERS + " c ON f.customer_id=c.customer_id "
          + "JOIN Appointment a ON f.appointment_id=a.appointment_id "
          + "JOIN Service s ON s.service_id=f.service_id ORDER BY f.created_at DESC");
    }

    // ------------------------------------------------------------------ Customer: what can be reviewed

    /** Các dịch vụ đã hoàn thành của khách mà chưa được đánh giá (mỗi dòng = một dịch vụ trong một lần đến). */
    public List<Map<String, Object>> getAvailableAppointmentsForFeedback(int customerId) {
        try { workflow().customerAccess(customerId); } catch (java.sql.SQLException ex) { throw new DataAccessException(ex); }
        requireConnection();
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT a.appointment_id,a.customer_id,c.full_name AS customer_name,l.service_id,s.service_name,l.line_no,"
                   + "a.appointment_date,a.start_time,a.end_time,a.status "
                   + "FROM Appointment a "
                   + "JOIN " + SchemaSql.CUSTOMERS + " c ON a.customer_id=c.customer_id "
                   + "JOIN dbo.vw_AppointmentLine l ON l.appointment_id=a.appointment_id "
                   + "JOIN Service s ON s.service_id=l.service_id "
                   + "WHERE a.customer_id=? AND a.status='Completed' "
                   + "AND NOT EXISTS(SELECT 1 FROM ServiceFeedback f WHERE f.appointment_id=a.appointment_id AND f.service_id=l.service_id) "
                   + "ORDER BY a.appointment_date DESC,a.start_time DESC,l.line_no";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, customerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("appointmentId", rs.getInt("appointment_id"));
                    map.put("customerId", rs.getInt("customer_id"));
                    map.put("customerName", rs.getString("customer_name"));
                    map.put("serviceId", rs.getInt("service_id"));
                    map.put("serviceName", rs.getString("service_name"));
                    map.put("lineNo", rs.getInt("line_no"));
                    map.put("appointmentDate", rs.getDate("appointment_date"));
                    map.put("startTime", rs.getTime("start_time"));
                    map.put("endTime", rs.getTime("end_time"));
                    map.put("status", rs.getString("status"));
                    list.add(map);
                }
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return list;
    }

    // ------------------------------------------------------------------ Public lists

    /** Đánh giá công khai (không bị ẩn). Có serviceId thì chỉ lấy đánh giá của dịch vụ đó. */
    public List<Map<String, Object>> getAllFeedbackDetails(Integer serviceId) {
        requireConnection();
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT f.feedback_id,f.customer_id,c.full_name AS customer_name,f.service_id,s.service_name,"
                   + "f.rating,f.comment,f.created_at "
                   + "FROM " + SchemaSql.FEEDBACK + " f "
                   + "JOIN " + SchemaSql.CUSTOMERS + " c ON f.customer_id=c.customer_id "
                   + "JOIN Service s ON s.service_id=f.service_id "
                   + "WHERE f.is_hidden=0 " + (serviceId != null ? "AND f.service_id=? " : "")
                   + "ORDER BY f.created_at DESC";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            if (serviceId != null) ps.setInt(1, serviceId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("feedbackId", rs.getInt("feedback_id"));
                    map.put("customerId", rs.getInt("customer_id"));
                    map.put("customerName", rs.getString("customer_name"));
                    map.put("serviceId", rs.getInt("service_id"));
                    map.put("serviceName", rs.getString("service_name"));
                    map.put("rating", rs.getInt("rating"));
                    map.put("comment", rs.getString("comment"));
                    map.put("createdAt", rs.getTimestamp("created_at"));
                    list.add(map);
                }
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return list;
    }

    public List<Map<String, Object>> getAllFeedbackDetails() { return getAllFeedbackDetails(null); }

    /** Điểm trung bình và số đánh giá của từng dịch vụ (công khai). */
    public List<Map<String, Object>> getServiceRatings() {
        requireConnection();
        List<Map<String, Object>> list = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement("SELECT service_id,review_count,avg_rating FROM dbo.vw_ServiceRating");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> map = new HashMap<>();
                map.put("serviceId", rs.getInt("service_id"));
                map.put("reviewCount", rs.getInt("review_count"));
                map.put("avgRating", rs.getBigDecimal("avg_rating"));
                list.add(map);
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return list;
    }

    /** Đánh giá của một khách (khách chỉ xem được của chính mình). */
    public List<Map<String, Object>> getFeedbackByCustomerId(int customerId) {
        try { workflow().customerAccess(customerId); } catch (java.sql.SQLException ex) { throw new DataAccessException(ex); }
        requireConnection();
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT f.feedback_id,f.customer_id,c.full_name AS customer_name,f.appointment_id,f.service_id,s.service_name,"
                   + "a.appointment_date,a.start_time,f.rating,f.comment,f.created_at "
                   + "FROM " + SchemaSql.FEEDBACK + " f "
                   + "JOIN " + SchemaSql.CUSTOMERS + " c ON f.customer_id=c.customer_id "
                   + "JOIN Appointment a ON f.appointment_id=a.appointment_id "
                   + "JOIN Service s ON s.service_id=f.service_id "
                   + "WHERE f.customer_id=? AND f.is_hidden=0 ORDER BY f.created_at DESC";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, customerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("feedbackId", rs.getInt("feedback_id"));
                    map.put("customerId", rs.getInt("customer_id"));
                    map.put("customerName", rs.getString("customer_name"));
                    map.put("appointmentId", rs.getInt("appointment_id"));
                    map.put("serviceId", rs.getInt("service_id"));
                    map.put("serviceName", rs.getString("service_name"));
                    map.put("appointmentDate", rs.getDate("appointment_date"));
                    map.put("startTime", rs.getTime("start_time"));
                    map.put("rating", rs.getInt("rating"));
                    map.put("comment", rs.getString("comment"));
                    map.put("createdAt", rs.getTimestamp("created_at"));
                    list.add(map);
                }
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return list;
    }

    // ------------------------------------------------------------------ Single reads

    private Feedback readOne(String where, int value) {
        requireConnection();
        String sql = "SELECT TOP(1) * FROM " + SchemaSql.FEEDBACK + " Feedback WHERE " + where + " AND is_hidden=0 ORDER BY feedback_id";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, value);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Feedback(rs.getInt("feedback_id"), rs.getInt("customer_id"), rs.getInt("appointment_id"),
                            rs.getInt("service_id"), rs.getInt("rating"), rs.getString("comment"), rs.getTimestamp("created_at"));
                }
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return null;
    }

    public Feedback getFeedbackById(int id) { return readOne("feedback_id = ?", id); }

    public Feedback getFeedbackByAppointmentId(int appointmentId) { return readOne("appointment_id = ?", appointmentId); }

    // ------------------------------------------------------------------ Customer writes

    /**
     * Tạo đánh giá cho một dịch vụ đã hoàn thành trong một lần đến.
     * Điều kiện: lịch hẹn của chính khách, đã Completed, dịch vụ nằm trong lịch hẹn, chưa được đánh giá, 1 đến 5 sao.
     */
    public int addFeedback(Feedback fb) throws Exception {
        workflow().roles("Customer");
        workflow().customerAccess(fb.getCustomerId());
        workflow().appointmentAccess(fb.getAppointmentId());
        if (fb.getRating() < 1 || fb.getRating() > 5) throw new IllegalArgumentException("Rating must be 1-5");
        if (fb.getServiceId() <= 0) throw new IllegalArgumentException("Service is required.");
        String comment = fb.getComment() == null ? null : fb.getComment().trim();
        if (comment != null && comment.length() > 1000) throw new IllegalArgumentException("Comment is too long.");
        int changed = workflow().update(
            "INSERT dbo.ServiceFeedback(customer_id,service_id,appointment_id,rating,comment) "
          + "SELECT a.customer_id,l.service_id,a.appointment_id,?,? FROM Appointment a "
          + "JOIN dbo.vw_AppointmentLine l ON l.appointment_id=a.appointment_id "
          + "WHERE a.appointment_id=? AND a.customer_id=? AND a.status='Completed' AND l.service_id=? "
          + "AND NOT EXISTS(SELECT 1 FROM dbo.ServiceFeedback f WHERE f.appointment_id=a.appointment_id AND f.service_id=l.service_id)",
            fb.getRating(), comment, fb.getAppointmentId(), fb.getCustomerId(), fb.getServiceId());
        if (changed != 1) throw new WorkflowException(409, "Chỉ đánh giá được dịch vụ đã hoàn thành, và mỗi dịch vụ trong mỗi lần đến chỉ đánh giá một lần.");
        return changed;
    }

    /** Sửa điểm và nội dung (không đổi khách, lịch hẹn hay dịch vụ). */
    public int updateFeedback(Feedback fb) throws Exception {
        Map<String, Object> existing = workflow().one("SELECT customer_id,appointment_id,service_id FROM " + SchemaSql.FEEDBACK + " Feedback WHERE feedback_id=?", fb.getFeedbackId());
        int owner = ((Number) existing.get("customerId")).intValue();
        workflow().roles("Customer");
        workflow().customerAccess(owner);
        if (owner != fb.getCustomerId() || ((Number) existing.get("appointmentId")).intValue() != fb.getAppointmentId()
                || (fb.getServiceId() > 0 && ((Number) existing.get("serviceId")).intValue() != fb.getServiceId()))
            throw new IllegalArgumentException("Feedback owner, appointment and service cannot be changed.");
        if (fb.getRating() < 1 || fb.getRating() > 5) throw new IllegalArgumentException("Rating must be 1-5");
        String comment = fb.getComment() == null ? null : fb.getComment().trim();
        if (comment != null && comment.length() > 1000) throw new IllegalArgumentException("Comment is too long.");
        return workflow().update("UPDATE ServiceFeedback SET rating=?,comment=?,updated_at=" + NOW_VN + " WHERE feedback_id=? AND is_hidden=0",
                fb.getRating(), comment, fb.getFeedbackId());
    }

    public boolean deleteFeedback(int id) {
        try {
            workflow().roles("Customer");
            Map<String, Object> existing = workflow().one("SELECT customer_id FROM " + SchemaSql.FEEDBACK + " Feedback WHERE feedback_id=?", id);
            workflow().customerAccess(((Number) existing.get("customerId")).intValue());
            return workflow().update("DELETE FROM ServiceFeedback WHERE feedback_id=? AND is_hidden=0", id) > 0;
        } catch (java.sql.SQLException ex) {
            throw new DataAccessException(ex);
        }
    }
}
