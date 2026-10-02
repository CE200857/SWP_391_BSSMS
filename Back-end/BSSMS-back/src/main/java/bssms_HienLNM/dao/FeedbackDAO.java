package bssms_HienLNM.dao;

import bssms_common.model.Feedback;
import bssms_common.util.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author HienLNM
 */
public class FeedbackDAO extends DBContext {

    
    public List<Map<String, Object>> getAllFeedbackDetails() {
        List<Map<String, Object>> list = new ArrayList<>();
        if (conn == null) {
            System.out.println("Database connection is null in FeedbackDAO.getAllFeedbackDetails()");
            return list;
        }
        String sql = "SELECT f.feedback_id, f.customer_id, c.full_name AS customer_name, "
                   + "f.appointment_id, f.rating, f.comment, f.created_at "
                   + "FROM Feedback f "
                   + "JOIN Customer c ON f.customer_id = c.customer_id "
                   + "ORDER BY f.created_at DESC";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> map = new HashMap<>();
                map.put("feedbackId", rs.getInt("feedback_id"));
                map.put("customerId", rs.getInt("customer_id"));
                map.put("customerName", rs.getString("customer_name"));
                map.put("appointmentId", rs.getInt("appointment_id"));
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

    
    public Feedback getFeedbackById(int id) {
        if (conn == null) {
            System.out.println("Database connection is null in FeedbackDAO.getFeedbackById()");
            return null;
        }
        String sql = "SELECT * FROM Feedback WHERE feedback_id = ?";
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

    
    public int addFeedback(Feedback fb) throws Exception {
        if (conn == null) {
            throw new Exception("Database connection is null in FeedbackDAO.addFeedback()");
        }

        
        if (fb.getRating() < 1 || fb.getRating() > 5) {
            throw new Exception("Rating phai nam trong khoang 1 den 5");
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
    }

    
    public int updateFeedback(Feedback fb) throws Exception {
        if (conn == null) {
            throw new Exception("Database connection is null in FeedbackDAO.updateFeedback()");
        }

        if (fb.getRating() < 1 || fb.getRating() > 5) {
            throw new Exception("Rating phai nam trong khoang 1 den 5");
        }

        String sql = "UPDATE Feedback "
                   + "SET rating = ?, comment = ? "
                   + "WHERE feedback_id = ?";
        PreparedStatement ps = conn.prepareStatement(sql);

        ps.setInt(1, fb.getRating());
        ps.setString(2, fb.getComment());
        ps.setInt(3, fb.getFeedbackId());

        int rows = ps.executeUpdate();
        ps.close();
        return rows;
    }

    
    public boolean deleteFeedback(int id) {
        if (conn == null) {
            System.out.println("Database connection is null in FeedbackDAO.deleteFeedback()");
            return false;
        }
        String sql = "DELETE FROM Feedback WHERE feedback_id = ?";
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
