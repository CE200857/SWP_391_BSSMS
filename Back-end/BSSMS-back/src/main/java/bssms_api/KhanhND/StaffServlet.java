package bssms_api.KhanhND;

import bssms_persistence.KhanhND.StaffDAO;
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

@WebServlet(name = "StaffServlet", urlPatterns = {"/api/staff"})
public class StaffServlet extends HttpServlet {

    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        resp.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        setAccessControlHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        StaffDAO dao = new StaffDAO();

        List<Map<String, Object>> staffList = dao.getAllStaffDetails();

        String jsonString = gson.toJson(staffList);

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
            int staffId = Integer.parseInt(request.getParameter("id"));

            StaffDAO dao = new StaffDAO();

            boolean isSuccess = dao.deactivateStaff(staffId);

            PrintWriter out = response.getWriter();

            if (isSuccess) {
                out.print("{\"message\":\"Vô hiệu hóa tài khoản nhân viên thành công\",\"status\":200}");
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\":\"Không tìm thấy nhân viên để xóa\",\"status\":400}");
            }

            out.flush();

        } catch (NumberFormatException e) {

            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);

            response.getWriter().print(
                    "{\"message\":\"Thiếu hoặc sai định dạng Staff ID\"}"
            );
        }
    }
}