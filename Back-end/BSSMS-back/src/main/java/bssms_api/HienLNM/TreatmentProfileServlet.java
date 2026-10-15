package bssms_api.HienLNM;

import com.google.gson.Gson;
import bssms_persistence.HienLNM.TreatmentProfileDAO;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(name = "TreatmentProfileServlet", urlPatterns = {"/api/treatment-profiles"})
public class TreatmentProfileServlet extends HttpServlet {

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
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        TreatmentProfileDAO dao = new TreatmentProfileDAO();
        PrintWriter out = response.getWriter();

        String customerIdParam = request.getParameter("customerId");
        String action = request.getParameter("action");

        if (customerIdParam == null || customerIdParam.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"Thiếu customerId\"}");
            out.flush();
            return;
        }

        try {
            int customerId = Integer.parseInt(customerIdParam);

            if ("summary".equals(action)) {
                Map<String, Object> summary = dao.getTreatmentSummary(customerId);
                out.print(this.gson.toJson(summary));
            } else if ("history".equals(action)) {
                List<Map<String, Object>> history = dao.getTreatmentHistory(customerId);
                out.print(this.gson.toJson(history));
            } else {
                List<Map<String, Object>> profiles = dao.getTreatmentProfilesByCustomerId(customerId);
                out.print(this.gson.toJson(profiles));
            }
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"CustomerId không hợp lệ\"}");
        }
        out.flush();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();
        try {
            com.google.gson.JsonObject jsonObject = gson.fromJson(request.getReader(), com.google.gson.JsonObject.class);
            TreatmentProfileDAO dao = new TreatmentProfileDAO();

            String action = jsonObject.has("action") ? jsonObject.get("action").getAsString() : null;

            if ("update-notes".equals(action)) {
                int appointmentId = jsonObject.get("appointmentId").getAsInt();
                String notes = jsonObject.get("notes").getAsString();

                boolean success = dao.updateAppointmentNotes(appointmentId, notes);
                if (success) {
                    out.print("{\"message\": \"Cập nhật ghi chú thành công!\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"message\": \"Cập nhật ghi chú thất bại!\"}");
                }
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Action không hợp lệ!\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
            e.printStackTrace();
        }
        out.flush();
    }
}
