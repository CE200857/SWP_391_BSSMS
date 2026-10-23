/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package bssms_api.KhanhLTQ;


import bssms_billing.Commission;
import bssms_persistence.KhanhLTQ.CommissionDAO;
import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@WebServlet(name = "CommissionServlet", urlPatterns = {"/api/technician/commission"})
public class CommissionServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        // 1. Cấu hình header trả về JSON
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        PrintWriter out = response.getWriter();
        Gson gson = new Gson();

        try {
            // 2. Lấy staff_id của người dùng đang đăng nhập từ Session
            // Lưu ý: Đoạn này bạn thay bằng tên Attribute session thực tế của hệ thống
            /*
            HttpSession session = request.getSession();
            Integer staffId = (Integer) session.getAttribute("accountId");
            if (staffId == null) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                out.print("{\"status\": 401, \"message\": \"Chưa đăng nhập!\"}");
                return;
            }
            */
            
            // Tạm fix cứng staffId = 1 để kiểm thử DAO
            int staffId = 1; 

            CommissionDAO dao = new CommissionDAO();
            List<Commission> commissionList = dao.getCommissionsByStaffId(staffId);

            // 3. Convert danh sách hoa hồng thành chuỗi JSON
            String jsonResponse = gson.toJson(commissionList);
            
            // 4. Trả về HTTP 200 OK kèm data JSON
            response.setStatus(HttpServletResponse.SC_OK);
            out.print(jsonResponse);

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\": 500, \"message\": \"Lỗi hệ thống: " + e.getMessage() + "\"}");
        } finally {
            out.flush();
        }
    }
}