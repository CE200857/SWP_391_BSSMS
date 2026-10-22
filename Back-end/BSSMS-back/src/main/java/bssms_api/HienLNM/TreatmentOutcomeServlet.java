package bssms_api.HienLNM;

import bssms_persistence.HienLNM.TreatmentOutcomeDAO;
import com.google.gson.Gson;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * @author HienLNM
 */
@WebServlet(name = "TreatmentOutcomeServlet", urlPatterns = {"/api/treatment-outcomes"})
public class TreatmentOutcomeServlet extends HttpServlet {

    private TreatmentOutcomeDAO dao = new TreatmentOutcomeDAO();
    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setHeader("Access-Control-Allow-Credentials", "true");
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
        if (pathInfo == null || pathInfo.equals("/")) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\":\"Thieu appointment ID\"}");
            out.flush();
            return;
        }

        try {
            int appointmentId = Integer.parseInt(pathInfo.substring(1));
            if (!dao.appointmentExists(appointmentId)) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"message\":\"Khong tim thay appointment voi id = " + appointmentId + "\"}");
                out.flush();
                return;
            }

            String raw = dao.getOutcomeByAppointmentId(appointmentId);
            if (raw != null) {
                String[] parts = raw.split("\\|\\|\\|", 2);
                Map<String, Object> result = new HashMap<>();
                result.put("appointmentId", appointmentId);
                result.put("notes", parts[0]);
                result.put("status", parts.length > 1 ? parts[1] : null);
                out.print(gson.toJson(result));
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"message\":\"Khong tim thay ket qua dieu tri\"}");
            }
        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\":\"Appointment ID khong hop le\"}");
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"message\":\"" + e.getMessage() + "\"}");
        }
        out.flush();
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\":\"Thieu appointment ID\"}");
            out.flush();
            return;
        }

        try {
            int appointmentId = Integer.parseInt(pathInfo.substring(1));

            BufferedReader reader = req.getReader();
            Map<String, String> data = gson.fromJson(reader, Map.class);
            String notes = data.get("notes");
            String status = data.get("status");

            if (notes == null || notes.trim().isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\":\"Ket qua dieu tri (notes) khong duoc de trong\"}");
                out.flush();
                return;
            }
            if (status == null || status.trim().isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\":\"Trang thai appointment khong duoc de trong\"}");
                out.flush();
                return;
            }

            boolean success = dao.recordOutcome(appointmentId, notes, status);
            if (success) {
                resp.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\":\"Ghi nhan ket qua dieu tri thanh cong\",\"appointmentId\":" + appointmentId + "}");
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"message\":\"Khong tim thay appointment de ghi nhan ket qua\"}");
            }
        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\":\"Appointment ID khong hop le\"}");
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"message\":\"" + e.getMessage() + "\"}");
        }
        out.flush();
    }
}
