package bssms_controller.HienLNM;

import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import bssms_persistence.HienLNM.FeedbackDAO;
import bssms_feedback.Feedback;

import com.google.gson.Gson;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
/**
 * Feedback liên quan đến Appointment cụ thể.
 * Mỗi Appointment chỉ có 1 Feedback, rating 1-5.
 */

public class FeedbackController extends ControllerSupport {

    private FeedbackDAO feedbackDAO = use(new FeedbackDAO());
    private final Gson gson = new Gson();

    public void get(ActionRequest req, ActionResult resp) throws IOException {
        bind(req);

        PrintWriter out = resp.writer();

        String pathInfo = req.pathInfo();

        // GET /api/feedback/appointments/{customerId}
        if (pathInfo != null && pathInfo.startsWith("/appointments/")) {
            String customerIdStr = pathInfo.substring("/appointments/".length());
            try {
                int customerId = Integer.parseInt(customerIdStr);
                List<Map<String, Object>> list = feedbackDAO.getAvailableAppointmentsForFeedback(customerId);
                out.print(gson.toJson(list));
            } catch (NumberFormatException e) {
                resp.status(400);
                out.print("{\"message\":\"Customer ID khong hop le\"}");
            }
            out.flush();
            return;
        }

        // GET /api/feedback/customer/{customerId}
        if (pathInfo != null && pathInfo.startsWith("/customer/")) {
            String customerIdStr = pathInfo.substring("/customer/".length());
            try {
                int customerId = Integer.parseInt(customerIdStr);
                List<Map<String, Object>> list = feedbackDAO.getFeedbackByCustomerId(customerId);
                out.print(gson.toJson(list));
            } catch (NumberFormatException e) {
                resp.status(400);
                out.print("{\"message\":\"Customer ID khong hop le\"}");
            }
            out.flush();
            return;
        }

        // GET /api/feedback/{id}
        if (pathInfo != null && !pathInfo.equals("/")) {
            try {
                int id = Integer.parseInt(pathInfo.substring(1));
                Feedback fb = feedbackDAO.getFeedbackById(id);
                if (fb != null) {
                    out.print(gson.toJson(fb));
                } else {
                    resp.status(404);
                    out.print("{\"message\":\"Khong tim thay feedback voi id = " + id + "\"}");
                }
            } catch (NumberFormatException e) {
                resp.status(400);
                out.print("{\"message\":\"Feedback ID khong hop le\"}");
            }
            out.flush();
            return;
        }

        // GET /api/feedback (mặc định)
        List<Map<String, Object>> list = feedbackDAO.getAllFeedbackDetails();
        out.print(gson.toJson(list));
        out.flush();
    }

    public void post(ActionRequest req, ActionResult resp) throws IOException {
        bind(req);

        PrintWriter out = resp.writer();

        BufferedReader reader = req.bodyReader();
        Feedback newFeedback = gson.fromJson(reader, Feedback.class);

        if (newFeedback == null) {
            resp.status(400);
            out.print("{\"message\":\"Body JSON khong hop le\"}");
            out.flush();
            return;
        }

        // Validate bắt buộc
        if (newFeedback.getCustomerId() <= 0) {
            resp.status(400);
            out.print("{\"message\":\"customerId la bat buoc\"}");
            out.flush();
            return;
        }
        if (newFeedback.getAppointmentId() <= 0) {
            resp.status(400);
            out.print("{\"message\":\"appointmentId la bat buoc\"}");
            out.flush();
            return;
        }
        if (newFeedback.getRating() <= 0 || newFeedback.getRating() > 5) {
            resp.status(400);
            out.print("{\"message\":\"rating la bat buoc (1-5)\"}");
            out.flush();
            return;
        }

        try {
            feedbackDAO.addFeedback(newFeedback);
            resp.status(201); // 201
            out.print("{\"message\":\"Tao feedback thanh cong\",\"status\":201}");
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            
            resp.status(400);
            out.print(gson.toJson(java.util.Map.of("message", "Không thể thực hiện thao tác. Vui lòng kiểm tra dữ liệu.")));
        }
        out.flush();
    }

    public void put(ActionRequest req, ActionResult resp) throws IOException {
        bind(req);
        if(req.pathInfo()!=null && req.pathInfo().matches("/\\d+/moderate")) {
            com.google.gson.JsonObject body=com.google.gson.JsonParser.parseReader(req.bodyReader()).getAsJsonObject();
            try {
                boolean changed=feedbackDAO.moderate(Integer.parseInt(req.pathInfo().split("/")[1]),body.get("hidden").getAsBoolean(),body.get("reason").getAsString());
                resp.status(changed?200:404);resp.writer().print("{\"success\":"+changed+"}");return;
            }catch(java.sql.SQLException ex){throw new DataAccessException(ex);}
        }


        PrintWriter out = resp.writer();

        String pathInfo = req.pathInfo();
        if (pathInfo == null || pathInfo.equals("/") || pathInfo.equals("")) {
            resp.status(400);
            out.print("{\"message\":\"Thieu feedback ID\"}");
            out.flush();
            return;
        }

        try {
            int feedbackId = Integer.parseInt(pathInfo.substring(1));
            BufferedReader reader = req.bodyReader();
            Feedback updatedFeedback = gson.fromJson(reader, Feedback.class);
            updatedFeedback.setFeedbackId(feedbackId);

            if(updatedFeedback.getRating()<1 || updatedFeedback.getRating()>5) throw new IllegalArgumentException("Rating must be 1-5");
            if(feedbackDAO.updateFeedback(updatedFeedback)==0) {
                resp.error(404,"Không tìm thấy đánh giá."); return;
            }
            resp.status(200); // 200
            out.print("{\"message\":\"Cap nhat feedback thanh cong\",\"status\":200}");
        } catch (NumberFormatException e) {
            resp.status(400);
            out.print("{\"message\":\"Feedback ID khong hop le\"}");
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            
            resp.status(500);
            out.print(gson.toJson(java.util.Map.of("message", "Không thể thực hiện thao tác. Vui lòng kiểm tra dữ liệu.")));
        }
        out.flush();
    }

    public void delete(ActionRequest req, ActionResult resp) throws IOException {
        bind(req);

        PrintWriter out = resp.writer();

        String pathInfo = req.pathInfo();
        if (pathInfo == null || pathInfo.equals("/") || pathInfo.equals("")) {
            resp.status(400);
            out.print("{\"message\":\"Thieu feedback ID\"}");
            out.flush();
            return;
        }

        try {
            int id = Integer.parseInt(pathInfo.substring(1));
            boolean isSuccess = feedbackDAO.deleteFeedback(id);
            if (isSuccess) {
                resp.status(200);
                out.print("{\"message\":\"Xoa feedback thanh cong\",\"status\":200}");
            } else {
                resp.status(404);
                out.print("{\"message\":\"Khong tim thay feedback de xoa\"}");
            }
        } catch (NumberFormatException e) {
            resp.status(400);
            out.print("{\"message\":\"Feedback ID khong hop le\"}");
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            
            resp.status(500);
            out.print(gson.toJson(java.util.Map.of("message", "Không thể thực hiện thao tác. Vui lòng kiểm tra dữ liệu.")));
        }
        out.flush();
    }
}