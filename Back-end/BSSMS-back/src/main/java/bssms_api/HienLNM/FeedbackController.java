package bssms_api.HienLNM;

import bssms_persistence.HienLNM.FeedbackDAO;
import bssms_feedback.Feedback;

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

        String idParam = req.getParameter("id");
        PrintWriter out = resp.getWriter();

        if (idParam != null && !idParam.isEmpty()) {
            int id = Integer.parseInt(idParam);
            Feedback fb = feedbackDAO.getFeedbackById(id);
            out.print(gson.toJson(fb));
        } else {
            
            List<Map<String, Object>> list = feedbackDAO.getAllFeedbackDetails();
            out.print(gson.toJson(list));
        }
        out.flush();
    }

    
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        req.setCharacterEncoding("UTF-8");

        BufferedReader reader = req.getReader();
        Feedback newFeedback = gson.fromJson(reader, Feedback.class);

        try {
            feedbackDAO.addFeedback(newFeedback);
            resp.setStatus(HttpServletResponse.SC_CREATED); // 201
            resp.getWriter().print("{\"message\": \"Tao feedback thanh cong\", \"status\": 201}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR); // 500
            resp.getWriter().print("{\"message\": \"" + e.getMessage() + "\", \"status\": 500}");
        }
    }

    
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        req.setCharacterEncoding("UTF-8");

        String idParam = req.getParameter("id");
        if (idParam != null) {
            BufferedReader reader = req.getReader();
            Feedback updatedFeedback = gson.fromJson(reader, Feedback.class);
            updatedFeedback.setFeedbackId(Integer.parseInt(idParam));

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
        }
    }

    
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        String idParam = req.getParameter("id");

        if (idParam != null) {
            try {
                boolean isSuccess = feedbackDAO.deleteFeedback(Integer.parseInt(idParam));
                if (isSuccess) {
                    resp.setStatus(HttpServletResponse.SC_OK);
                    resp.getWriter().print("{\"message\": \"Xoa feedback thanh cong\", \"status\": 200}");
                } else {
                    resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    resp.getWriter().print("{\"message\": \"Khong tim thay feedback de xoa\", \"status\": 400}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                resp.getWriter().print("{\"message\": \"" + e.getMessage() + "\", \"status\": 500}");
            }
        } else {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().print("{\"message\": \"Thieu ID feedback\", \"status\": 400}");
        }
    }
}
