package bssms_persistence.HienLNM;

import bssms_feedback.Feedback;
import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author HienLNM
 */
<<<<<<< Updated upstream
public class FeedbackDAO extends DBContext {
=======
public class FeedbackDAO extends DBContext implements AutoCloseable {

    public boolean moderate(int id,boolean hidden,String reason) throws java.sql.SQLException {
        workflow().roles("Manager");
        if(reason==null||reason.isBlank()) throw new IllegalArgumentException("Moderation reason required.");
        return workflow().update("UPDATE Appointment SET feedback_is_hidden=?,feedback_moderation_reason=?,feedback_updated_at=CONVERT(datetime2,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time') WHERE feedback_id=?",hidden,reason,id)==1;
    }
    private void requireConnection() {
        if (conn == null) throw new DataAccessException("Database connection unavailable");
    }
    @Override public void close() throws java.sql.SQLException { if (conn != null) conn.close(); }
>>>>>>> Stashed changes

    /**
     * Lấy danh sách Appointment đã hoàn thành (Completed) của 1 customer
     * mà chưa có feedback - để user chọn khi tạo feedback.
     */
    public List<Map<String, Object>> getAvailableAppointmentsForFeedback(int customerId) {
<<<<<<< Updated upstream
=======
        try {workflow().customerAccess(customerId);} catch(java.sql.SQLException ex){throw new DataAccessException(ex);}
        requireConnection();
>>>>>>> Stashed changes
        List<Map<String, Object>> list = new ArrayList<>();
        if (conn == null) {
            System.out.println("Database connection is null in FeedbackDAO.getAvailableAppointmentsForFeedback()");
            return list;
        }
        String sql = "SELECT a.appointment_id, a.customer_id, c.full_name AS customer_name, "
                   + "s.service_name, a.appointment_date, a.start_time, a.end_time, a.status "
                   + "FROM Appointment a "
                   + "JOIN " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c ON a.customer_id = c.customer_id "
                   + "LEFT JOIN Service s ON a.service_id = s.service_id "
                   + "WHERE a.customer_id = ? "
                   + "AND a.status = 'Completed' "
                   + "AND a.appointment_id NOT IN (SELECT appointment_id FROM " + bssms_persistence.common.SchemaSql.FEEDBACK + " Feedback) "
                   + "ORDER BY a.appointment_date DESC, a.start_time DESC";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setInt(1, customerId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> map = new HashMap<>();
                map.put("appointmentId", rs.getInt("appointment_id"));
                map.put("customerId", rs.getInt("customer_id"));
                map.put("customerName", rs.getString("customer_name"));
                map.put("serviceName", rs.getString("service_name"));
                map.put("appointmentDate", rs.getDate("appointment_date"));
                map.put("startTime", rs.getTime("start_time"));
                map.put("endTime", rs.getTime("end_time"));
                map.put("status", rs.getString("status"));
                list.add(map);
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Lấy danh sách tất cả Feedback kèm thông tin chi tiết.
     */
    public List<Map<String, Object>> getAllFeedbackDetails() {
        List<Map<String, Object>> list = new ArrayList<>();
        if (conn == null) {
            System.out.println("Database connection is null in FeedbackDAO.getAllFeedbackDetails()");
            return list;
        }
        String sql = "SELECT f.feedback_id, f.customer_id, c.full_name AS customer_name, "
                   + "f.appointment_id, s.service_name, a.appointment_date, "
                   + "f.rating, f.comment, f.created_at "
                   + "FROM " + bssms_persistence.common.SchemaSql.FEEDBACK + " f "
                   + "JOIN " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c ON f.customer_id = c.customer_id "
                   + "JOIN Appointment a ON f.appointment_id = a.appointment_id "
                   + "LEFT JOIN Service s ON a.service_id = s.service_id "
                   + "WHERE f.is_hidden=0 ORDER BY f.created_at DESC";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> map = new HashMap<>();
                map.put("feedbackId", rs.getInt("feedback_id"));
                map.put("customerId", rs.getInt("customer_id"));
                map.put("customerName", rs.getString("customer_name"));
                map.put("appointmentId", rs.getInt("appointment_id"));
                map.put("serviceName", rs.getString("service_name"));
                map.put("appointmentDate", rs.getDate("appointment_date"));
                map.put("rating", rs.getInt("rating"));
                map.put("comment", rs.getString("comment"));
                map.put("createdAt", rs.getTimestamp("created_at"));
                list.add(map);
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Lấy danh sách Feedback theo customerId.
     */
    public List<Map<String, Object>> getFeedbackByCustomerId(int customerId) {
<<<<<<< Updated upstream
=======
        try {workflow().customerAccess(customerId);} catch(java.sql.SQLException ex){throw new DataAccessException(ex);}
        requireConnection();
>>>>>>> Stashed changes
        List<Map<String, Object>> list = new ArrayList<>();
        if (conn == null) {
            System.out.println("Database connection is null in FeedbackDAO.getFeedbackByCustomerId()");
            return list;
        }
        String sql = "SELECT f.feedback_id, f.customer_id, c.full_name AS customer_name, "
                   + "f.appointment_id, s.service_name, a.appointment_date, "
                   + "f.rating, f.comment, f.created_at "
                   + "FROM " + bssms_persistence.common.SchemaSql.FEEDBACK + " f "
                   + "JOIN " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c ON f.customer_id = c.customer_id "
                   + "JOIN Appointment a ON f.appointment_id = a.appointment_id "
                   + "LEFT JOIN Service s ON a.service_id = s.service_id "
                   + "WHERE f.customer_id = ? "
                   + "AND f.is_hidden=0 ORDER BY f.created_at DESC";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setInt(1, customerId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> map = new HashMap<>();
                map.put("feedbackId", rs.getInt("feedback_id"));
                map.put("customerId", rs.getInt("customer_id"));
                map.put("customerName", rs.getString("customer_name"));
                map.put("appointmentId", rs.getInt("appointment_id"));
                map.put("serviceName", rs.getString("service_name"));
                map.put("appointmentDate", rs.getDate("appointment_date"));
                map.put("rating", rs.getInt("rating"));
                map.put("comment", rs.getString("comment"));
                map.put("createdAt", rs.getTimestamp("created_at"));
                list.add(map);
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Lấy chi tiết 1 Feedback.
     */
    public Feedback getFeedbackById(int id) {
        if (conn == null) {
            System.out.println("Database connection is null in FeedbackDAO.getFeedbackById()");
            return null;
        }
        String sql = "SELECT * FROM " + bssms_persistence.common.SchemaSql.FEEDBACK + " Feedback WHERE feedback_id = ? AND is_hidden=0";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                Feedback fb = new Feedback(
                        rs.getInt("feedback_id"),
                        rs.getInt("customer_id"),
                        rs.getInt("appointment_id"),
                        rs.getInt("rating"),
                        rs.getString("comment"),
                        rs.getTimestamp("created_at")
                );
                rs.close();
                ps.close();
                return fb;
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Lấy Feedback theo appointmentId.
     */
    public Feedback getFeedbackByAppointmentId(int appointmentId) {
        if (conn == null) {
            System.out.println("Database connection is null in FeedbackDAO.getFeedbackByAppointmentId()");
            return null;
        }
        String sql = "SELECT * FROM " + bssms_persistence.common.SchemaSql.FEEDBACK + " Feedback WHERE appointment_id = ? AND is_hidden=0";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setInt(1, appointmentId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                Feedback fb = new Feedback(
                        rs.getInt("feedback_id"),
                        rs.getInt("customer_id"),
                        rs.getInt("appointment_id"),
                        rs.getInt("rating"),
                        rs.getString("comment"),
                        rs.getTimestamp("created_at")
                );
                rs.close();
                ps.close();
                return fb;
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Tạo Feedback cho 1 Appointment cụ thể.
     * Validation:
     * 1. appointmentId phải tồn tại
     * 2. appointment phải thuộc về customerId trong body
     * 3. appointment phải có status = 'Completed'
     * 4. appointment chưa có feedback
     * 5. rating 1-5
     */
    public int addFeedback(Feedback fb) throws Exception {
<<<<<<< Updated upstream
        if (conn == null) {
            throw new Exception("Database connection is null in FeedbackDAO.addFeedback()");
        }

        // Validate rating
        if (fb.getRating() < 1 || fb.getRating() > 5) {
            throw new Exception("Rating phai nam trong khoang 1 den 5");
        }

        // Validate appointment tồn tại
        Map<String, Object> appt = getAppointmentInfo(fb.getAppointmentId());
        if (appt == null) {
            throw new Exception("Khong tim thay appointment voi id = " + fb.getAppointmentId());
        }

        // Validate appointment thuộc về customer
        int apptCustomerId = (Integer) appt.get("customerId");
        if (apptCustomerId != fb.getCustomerId()) {
            throw new Exception("Appointment khong thuoc ve customer nay");
        }

        // Validate appointment đã hoàn thành
        String apptStatus = (String) appt.get("status");
        if (!"Completed".equalsIgnoreCase(apptStatus)) {
            throw new Exception("Chi co the danh gia appointment da hoan thanh");
        }

        // Validate chưa có feedback
        Feedback existing = getFeedbackByAppointmentId(fb.getAppointmentId());
        if (existing != null) {
            throw new Exception("Appointment nay da co feedback roi");
        }

        String sql = "INSERT INTO Feedback (customer_id, appointment_id, rating, comment) "
                   + "VALUES (?, ?, ?, ?)";
        PreparedStatement ps = conn.prepareStatement(sql);

        ps.setInt(1, fb.getCustomerId());
        ps.setInt(2, fb.getAppointmentId());
        ps.setInt(3, fb.getRating());
        ps.setString(4, fb.getComment());

        int rows = ps.executeUpdate();
        ps.close();
        return rows;
=======
        workflow().roles("Customer"); workflow().customerAccess(fb.getCustomerId());
        workflow().appointmentAccess(fb.getAppointmentId());
        if(fb.getRating()<1 || fb.getRating()>5) throw new IllegalArgumentException("Rating must be 1-5");
        int changed=workflow().update("UPDATE Appointment SET feedback_rating=?,feedback_comment=?,feedback_created_at=GETDATE() WHERE appointment_id=? AND customer_id=? AND status='Completed' AND feedback_id IS NULL AND feedback_rating IS NULL",fb.getRating(),fb.getComment(),fb.getAppointmentId(),fb.getCustomerId());
        if(changed!=1) throw new bssms_persistence.common.WorkflowException(409,"Completed appointment required or feedback already exists.");
        return changed;
>>>>>>> Stashed changes
    }

    /**
     * Lấy thông tin Appointment để validate.
     */
    private Map<String, Object> getAppointmentInfo(int appointmentId) {
        if (conn == null) {
            return null;
        }
        String sql = "SELECT customer_id, status FROM Appointment WHERE appointment_id = ?";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setInt(1, appointmentId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                Map<String, Object> map = new HashMap<>();
                map.put("customerId", rs.getInt("customer_id"));
                map.put("status", rs.getString("status"));
                rs.close();
                ps.close();
                return map;
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Cập nhật Feedback.
     */
    public int updateFeedback(Feedback fb) throws Exception {
<<<<<<< Updated upstream
=======
        java.util.Map<String,Object> existing=workflow().one("SELECT customer_id,appointment_id FROM " + bssms_persistence.common.SchemaSql.FEEDBACK + " Feedback WHERE feedback_id=?",fb.getFeedbackId());
        workflow().customerAccess(((Number)existing.get("customerId")).intValue());
        if(((Number)existing.get("customerId")).intValue()!=fb.getCustomerId() || ((Number)existing.get("appointmentId")).intValue()!=fb.getAppointmentId()) throw new IllegalArgumentException("Feedback owner and appointment cannot be changed.");
        workflow().roles("Customer");workflow().customerAccess(fb.getCustomerId());
        workflow().appointmentAccess(fb.getAppointmentId());
        requireConnection();
>>>>>>> Stashed changes
        if (conn == null) {
            throw new Exception("Database connection is null in FeedbackDAO.updateFeedback()");
        }

        if (fb.getRating() < 1 || fb.getRating() > 5) {
            throw new Exception("Rating phai nam trong khoang 1 den 5");
        }

        String sql = "UPDATE Appointment SET feedback_rating=?,feedback_comment=?,feedback_updated_at=GETDATE() WHERE feedback_id=? AND feedback_is_hidden=0";
        PreparedStatement ps = conn.prepareStatement(sql);

        ps.setInt(1, fb.getRating());
        ps.setString(2, fb.getComment());
        ps.setInt(3, fb.getFeedbackId());

        int rows = ps.executeUpdate();
        ps.close();
        return rows;
    }

    /**
     * Xóa Feedback.
     */
    public boolean deleteFeedback(int id) {
<<<<<<< Updated upstream
=======
        try {
            workflow().roles("Customer");
            workflow().customerAccess(((Number)workflow().one("SELECT customer_id FROM " + bssms_persistence.common.SchemaSql.FEEDBACK + " Feedback WHERE feedback_id=?",id).get("customerId")).intValue());
        } catch(java.sql.SQLException ex){throw new DataAccessException(ex);}
        requireConnection();
>>>>>>> Stashed changes
        if (conn == null) {
            System.out.println("Database connection is null in FeedbackDAO.deleteFeedback()");
            return false;
        }
        String sql = "UPDATE Appointment SET feedback_id=NULL,feedback_rating=NULL,feedback_comment=NULL,feedback_created_at=NULL,feedback_updated_at=NULL,feedback_is_hidden=0,feedback_moderation_reason=NULL WHERE feedback_id=? AND feedback_is_hidden=0";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setInt(1, id);
            int rows = ps.executeUpdate();
            ps.close();
            return rows > 0;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }
}
