package bssms_api.HienLNM;

import bssms_catalog.Service;
import bssms_persistence.HienLNM.ServiceStatusDAO;
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
 * @author HienLNM
 */
@WebServlet(name = "ServiceStatusServlet", urlPatterns = {"/api/service-status"})
public class ServiceStatusServlet extends HttpServlet {

    private ServiceStatusDAO dao = new ServiceStatusDAO();
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

        List<Service> list = dao.getAllServices();
        out.print(gson.toJson(list));
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
            out.print("{\"message\":\"Thieu service ID\"}");
            out.flush();
            return;
        }

        try {
            int serviceId = Integer.parseInt(pathInfo.substring(1));

            BufferedReader reader = req.getReader();
            Map<String, String> data = gson.fromJson(reader, Map.class);
            String newStatus = data.get("status");

            if (newStatus == null || newStatus.trim().isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\":\"Trang thai moi khong duoc de trong\"}");
                out.flush();
                return;
            }

            boolean success = dao.updateServiceStatus(serviceId, newStatus);
            if (success) {
                resp.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\":\"Cap nhat trang thai service thanh cong\"}");
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"message\":\"Khong tim thay service de cap nhat\"}");
            }
        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\":\"Service ID khong hop le\"}");
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"message\":\"" + e.getMessage() + "\"}");
        }
        out.flush();
    }
}
