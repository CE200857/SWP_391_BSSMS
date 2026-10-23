/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package bssms_api.KhanhLTQ;

import bssms_persistence.KhanhLTQ.CommissionDAO;
import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@WebServlet(name = "CommissionReportServlet", urlPatterns = {"/api/manager/commission/report"})
public class CommissionReportServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        // 1. Cấu hình header để trả về định dạng JSON
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        PrintWriter out = response.getWriter();
        Gson gson = new Gson();

        String startDate = request.getParameter("startDate");
        String endDate = request.getParameter("endDate");

        try {
            // 2. Kiểm tra tham số đầu vào
            if (startDate != null && endDate != null && !startDate.trim().isEmpty() && !endDate.trim().isEmpty()) {
                
                CommissionDAO dao = new CommissionDAO();
                List<CommissionReportDTO> reportList = dao.getCommissionReport(startDate, endDate);
                
                // 3. Chuyển List DTO thành chuỗi JSON và trả về HTTP 200 OK
                String jsonResponse = gson.toJson(reportList);
                response.setStatus(HttpServletResponse.SC_OK);
                out.print(jsonResponse);
                
            } else {
                // Trả về lỗi HTTP 400 nếu thiếu tham số ngày tháng
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"status\": 400, \"message\": \"Thiếu tham số startDate hoặc endDate!\"}");
            }
        } catch (Exception e) {
            // Trả về lỗi HTTP 500 nếu catch được Exception
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\": 500, \"message\": \"Lỗi server: " + e.getMessage() + "\"}");
        } finally {
            out.flush();
        }
    }
}