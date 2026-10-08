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
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();
        try {
            com.google.gson.JsonObject jsonObject = gson.fromJson(request.getReader(), com.google.gson.JsonObject.class);
            String fullName = jsonObject.get("fullName").getAsString().trim();
            String email = jsonObject.get("email").getAsString().trim();
            String phone = jsonObject.get("phone").getAsString().trim();
            String dob = jsonObject.get("dob").getAsString();
            String gender = jsonObject.get("gender").getAsString();
            String username = jsonObject.get("username").getAsString();
            String password = jsonObject.get("password").getAsString();

            CustomerDAO dao = new CustomerDAO();
            boolean success = dao.createWalkInCustomer(username, password, email, phone, fullName, dob, gender);

            if (success) {
                response.setStatus(HttpServletResponse.SC_CREATED);
                out.print("{\"message\": \"Tạo tài khoản khách hàng thành công!\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_CONFLICT);
                out.print("{\"message\": \"Lỗi: Tên đăng nhập hoặc Email/SĐT đã được sử dụng.\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
        }
        out.flush();
    }
}