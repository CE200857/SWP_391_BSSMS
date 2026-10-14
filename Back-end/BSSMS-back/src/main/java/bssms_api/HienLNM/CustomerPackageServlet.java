package bssms_api.HienLNM;

import bssms_catalog.CustomerPackage;
import bssms_persistence.HienLNM.CustomerPackageDAO;
import com.google.gson.Gson;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * @author HienLNM
 * 
 */
@WebServlet(name = "CustomerPackageServlet", urlPatterns = {"/api/customer-packages","/api/customer-packages/*"})
public class CustomerPackageServlet extends HttpServlet {

    private CustomerPackageDAO dao = new CustomerPackageDAO();
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

        // /api/customer-packages/{customerId}
        if (pathInfo != null && !pathInfo.equals("/")) {
            try {
                int customerId = Integer.parseInt(pathInfo.substring(1));
                List<CustomerPackage> list = dao.getCustomerPackagesByCustomerId(customerId);
                out.print(gson.toJson(list));
            } catch (NumberFormatException e) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\":\"Customer ID khong hop le\"}");
            }
            out.flush();
            return;
        }

        // /api/customer-packages?customerId=1
        String customerIdParam = req.getParameter("customerId");
        if (customerIdParam != null && !customerIdParam.isEmpty()) {
            try {
                int customerId = Integer.parseInt(customerIdParam);
                List<CustomerPackage> list = dao.getCustomerPackagesByCustomerId(customerId);
                out.print(gson.toJson(list));
            } catch (NumberFormatException e) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\":\"Customer ID khong hop le\"}");
            }
        } else {
            out.print("{\"message\":\"Vui long cung cap customerId de xem danh sach goi da mua\"}");
        }
        out.flush();
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        String pathInfo = req.getPathInfo();
        String servletPath = req.getServletPath();
        String requestUri = req.getRequestURI();
        String queryString = req.getQueryString();

        // DEBUG: in ra response luôn để dễ thấy
        String debug = "DEBUG: requestURI=" + requestUri + " | servletPath=" + servletPath 
                     + " | pathInfo=" + pathInfo + " | queryString=" + queryString;

        // POST /api/customer-packages/sell
        if (pathInfo != null && pathInfo.equals("/sell")) {
            BufferedReader reader = req.getReader();
            Map<String, Object> data = gson.fromJson(reader, Map.class);

            try {
                Object cidObj = data.get("customerId");
                Object tpidObj = data.get("treatmentPackageId");
                Object expObj = data.get("expiryMonths");

                if (cidObj == null || tpidObj == null) {
                    resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"message\":\"customerId va treatmentPackageId la bat buoc\"}");
                    out.flush();
                    return;
                }

                int customerId = ((Number) cidObj).intValue();
                int treatmentPackageId = ((Number) tpidObj).intValue();
                int expiryMonths = 12;
                if (expObj != null) {
                    expiryMonths = ((Number) expObj).intValue();
                }

                Map<String, Object> result = dao.sellTreatmentPackage(customerId, treatmentPackageId, expiryMonths);

                resp.setStatus(HttpServletResponse.SC_CREATED);
                out.print(gson.toJson(result));

            } catch (NumberFormatException e) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\":\"customerId hoac treatmentPackageId khong hop le\"}");
            } catch (Exception e) {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"message\":\"" + e.getMessage() + "\"}");
            }
            out.flush();
            return;
        }

    }
}
