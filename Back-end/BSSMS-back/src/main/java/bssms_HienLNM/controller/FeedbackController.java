package bssms_HienLNM.controller;

import bssms_HienLNM.dao.FeedbackDAO;
import bssms_common.model.Feedback;

import com.google.gson.Gson;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


/**
 * Feedback liên quan đến Appointment cụ thể.
 * Mỗi Appointment chỉ có 1 Feedback, rating 1-5.
 */
@WebServlet(name = "FeedbackController", urlPatterns = {"/api/feedback"})
public class FeedbackController extends HttpServlet {

    private FeedbackDAO feedbackDAO = new FeedbackDAO();
    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        String pathInfo = req.getPathInfo();

        // GET /api/feedback/appointments/{customerId}
        // Lấy danh sách appointment đã hoàn thành, chưa có feedback (để user chọn khi tạo feedback)
        if (pathInfo != null && pathInfo.startsWith("/appointments/")) {
            String customerIdStr = pathInfo.substring("/appointments/".length());
            try {
                int customerId = Integer.parseInt(customerIdStr);
                List<Map<String, Object>> list = feedbackDAO.getAvailableAppointmentsForFeedback(customerId);
                out.print(gson.toJson(list));
            } catch (NumberFormatException e) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\":\"Customer ID khong hop le\"}");
            }
            out.flush();
            return;
        }

        // GET /api/feedback/customer/{customerId}
        // Lấy feedback theo customer
        if (pathInfo != null && pathInfo.startsWith("/customer/")) {
            String customerIdStr = pathInfo.substring("/customer/".length());
            try {
                int customerId = Integer.parseInt(customerIdStr);
                List<Map<String, Object>> list = feedbackDAO.getFeedbackByCustomerId(customerId);
                out.print(gson.toJson(list));
            } catch (NumberFormatException e) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
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
                    resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"message\":\"Khong tim thay feedback voi id = " + id + "\"}");
                }
            } catch (NumberFormatException e) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\":\"Feedback ID khong hop le\"}");
            }
            out.flush();
            return;
        }

        // GET /api/feedback
        // Lấy tất cả feedback
        List<Map<String, Object>> list = feedbackDAO.getAllFeedbackDetails();
        out.print(gson.toJson(list));
        out.flush();
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        req.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        BufferedReader reader = req.getReader();
        Feedback newFeedback = gson.fromJson(reader, Feedback.class);

        // Validate bắt buộc
        if (newFeedback.getCustomerId() <= 0) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\":\"customerId la bat buoc\"}");
            out.flush();
            return;
        }
        if (newFeedback.getAppointmentId() <= 0) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\":\"appointmentId la bat buoc\"}");
            out.flush();
            return;
        }
        if (newFeedback.getRating() <= 0) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\":\"rating la bat buoc (1-5)\"}");
            out.flush();
            return;
        }

        try {
            feedbackDAO.addFeedback(newFeedback);
<<<<<<< Updated upstream:Back-end/BSSMS-back/src/main/java/bssms_HienLNM/controller/FeedbackController.java
            resp.setStatus(HttpServletResponse.SC_CREATED); // 201
            resp.getWriter().print("{\"message\": \"Tao feedback thanh cong\", \"status\": 201}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR); // 500
            resp.getWriter().print("{\"message\": \"" + e.getMessage() + "\", \"status\": 500}");
=======
            resp.setStatus(HttpServletResponse.SC_CREATED);
            out.print("{\"message\":\"Tao feedback thanh cong\",\"status\":201}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\":\"" + e.getMessage() + "\"}");
>>>>>>> Stashed changes:Back-end/BSSMS-back/src/main/java/bssms_api/HienLNM/FeedbackServlet.java
        }
        out.flush();
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        req.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/") || pathInfo.equals("")) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\":\"Thieu feedback ID\"}");
            out.flush();
            return;
        }

        try {
            int feedbackId = Integer.parseInt(pathInfo.substring(1));

            BufferedReader reader = req.getReader();
            Feedback updatedFeedback = gson.fromJson(reader, Feedback.class);
            updatedFeedback.setFeedbackId(feedbackId);

<<<<<<< Updated upstream:Back-end/BSSMS-back/src/main/java/bssms_HienLNM/controller/FeedbackController.java
            try {
                feedbackDAO.updateFeedback(updatedFeedback);
                resp.setStatus(HttpServletResponse.SC_OK); // 200
                resp.getWriter().print("{\"message\": \"Cap nhat feedback thanh cong\", \"status\": 200}");
            } catch (Exception e) {
                e.printStackTrace();
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR); // 500
                resp.getWriter().print("{\"message\": \"" + e.getMessage() + "\", \"status\": 500}");
            }
        } else {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST); // 400
            resp.getWriter().print("{\"message\": \"Thieu ID feedback\", \"status\": 400}");
=======
            feedbackDAO.updateFeedback(updatedFeedback);
            resp.setStatus(HttpServletResponse.SC_OK);
            out.print("{\"message\":\"Cap nhat feedback thanh cong\",\"status\":200}");
        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\":\"Feedback ID khong hop le\"}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"message\":\"" + e.getMessage() + "\"}");
>>>>>>> Stashed changes:Back-end/BSSMS-back/src/main/java/bssms_api/HienLNM/FeedbackServlet.java
        }
        out.flush();
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/") || pathInfo.equals("")) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\":\"Thieu feedback ID\"}");
            out.flush();
            return;
        }

        try {
            int id = Integer.parseInt(pathInfo.substring(1));
            boolean isSuccess = feedbackDAO.deleteFeedback(id);
            if (isSuccess) {
                resp.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\":\"Xoa feedback thanh cong\",\"status\":200}");
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"message\":\"Khong tim thay feedback de xoa\"}");
            }
        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\":\"Feedback ID khong hop le\"}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"message\":\"" + e.getMessage() + "\"}");
        }
        out.flush();
    }
}
