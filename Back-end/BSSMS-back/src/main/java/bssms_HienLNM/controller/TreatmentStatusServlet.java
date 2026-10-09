package bssms_api.HienLNM;

import bssms_persistence.HienLNM.TreatmentStatusDAO;
import com.google.gson.Gson;
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
 * @author HienLNM
 */
@WebServlet(name = "TreatmentStatusServlet", urlPatterns = {"/api/treatment-status"})
public class TreatmentStatusServlet extends HttpServlet {

    private TreatmentStatusDAO dao = new TreatmentStatusDAO();
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

        // /api/treatment-status/{id}
        if (pathInfo != null && !pathInfo.equals("/")) {
            try {
                int appointmentId = Integer.parseInt(pathInfo.substring(1));
                Map<String, Object> result = dao.getTreatmentStatusById(appointmentId);
                if (result != null) {
                    out.print(gson.toJson(result));
                } else {
                    resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"message\":\"Khong tim thay treatment status voi id = " + appointmentId + "\"}");
                }
            } catch (NumberFormatException e) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\":\"Appointment ID khong hop le\"}");
            }
            out.flush();
            return;
        }

        // Filter params
        String customerIdParam = req.getParameter("customerId");
        String status = req.getParameter("status");
        String fromDate = req.getParameter("fromDate");
        String toDate = req.getParameter("toDate");

        Integer customerId = null;
        if (customerIdParam != null && !customerIdParam.isEmpty()) {
            try {
                customerId = Integer.parseInt(customerIdParam);
            } catch (NumberFormatException e) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\":\"customerId khong hop le\"}");
                out.flush();
                return;
            }
        }

        List<Map<String, Object>> list = dao.getTreatmentStatusList(customerId, status, fromDate, toDate);
        out.print(gson.toJson(list));
        out.flush();
    }
}
