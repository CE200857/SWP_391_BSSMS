package bssms_api.DatNT;

import com.google.gson.Gson;
import bssms_persistence.DatNT.CustomerDAO;
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
 * 
 * @author Nguyen Tien Dat - CE200858
 */

@WebServlet(name = "CustomerServlet", urlPatterns = {"/api/customers"})
public class CustomerServlet extends HttpServlet {

    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173"); 
        resp.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
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

        CustomerDAO dao = new CustomerDAO();
        List<Map<String, Object>> customers = dao.getAllCustomerDetails(); 
        
        String jsonString = this.gson.toJson(customers);
        PrintWriter out = response.getWriter();
        out.print(jsonString);
        out.flush();
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        try {
            int customerId = Integer.parseInt(request.getParameter("id"));
            CustomerDAO dao = new CustomerDAO();
            boolean isSuccess = dao.deactivateCustomer(customerId);
            
            PrintWriter out = response.getWriter();
            if (isSuccess) {
                out.print("{\"message\": \"Hủy/Vô hiệu hóa tài khoản thành công\", \"status\": 200}");
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Không tìm thấy tài khoản để xóa\", \"status\": 400}");
            }
            out.flush();
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().print("{\"message\": \"Thiếu hoặc sai định dạng ID\"}");
        }
    }
}