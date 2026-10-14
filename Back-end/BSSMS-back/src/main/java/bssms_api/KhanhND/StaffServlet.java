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

@WebServlet(name = "StaffServlet", urlPatterns = {"/api/staff", "/api/staff/assign-role"})
public class StaffServlet extends HttpServlet {

    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        resp.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setHeader("Access-Control-Allow-Credentials", "true");
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
        PrintWriter out = response.getWriter();

        String idParam = request.getParameter("id");

        if (idParam != null && !idParam.trim().isEmpty()) {
            try {
                int staffId = Integer.parseInt(idParam);
                Map<String, Object> staff = dao.getStaffById(staffId);

                if (staff.isEmpty()) {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"message\": \"Không tìm thấy nhân viên này\"}");
                } else {
                    out.print(gson.toJson(staff));
                }
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"ID nhân viên không hợp lệ\"}");
            }
        } else {
            List<Map<String, Object>> staffList = dao.getAllStaffDetails();
            out.print(gson.toJson(staffList));
        }
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

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getRequestURI();
        PrintWriter out = response.getWriter();

        if (pathInfo != null && pathInfo.contains("/assign-role")) {
            try {
                String accountIdStr = request.getParameter("accountId");
                String role = request.getParameter("role");

                if (accountIdStr == null || role == null) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"message\": \"Dữ liệu không đầy đủ!\"}");
                    out.flush();
                    return;
                }

                int accountId = Integer.parseInt(accountIdStr);
                StaffDAO dao = new StaffDAO();
                boolean isAssigned = dao.assignRole(accountId, role);

                if (isAssigned) {
                    response.setStatus(HttpServletResponse.SC_OK);
                    out.print("{\"message\": \"Phân quyền thành công!\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"message\": \"Lỗi: Không thể phân quyền!\"}");
                }
            } catch (Exception e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
                e.printStackTrace();
            }
            out.flush();
        } else {
            try {
                com.google.gson.JsonObject jsonObject = gson.fromJson(request.getReader(), com.google.gson.JsonObject.class);
                String action = jsonObject.has("action") ? jsonObject.get("action").getAsString() : null;
                
                if ("update".equals(action)) {
                    int accountId = jsonObject.get("accountId").getAsInt();
                    String fullName = jsonObject.get("fullName").getAsString().trim();
                    String email = jsonObject.get("email").getAsString().trim();
                    String phone = jsonObject.get("phone").getAsString().trim();
                    String role = jsonObject.get("role").getAsString();
                    String username = jsonObject.get("username").getAsString().trim();
                    String hireDate = jsonObject.has("hireDate") ? jsonObject.get("hireDate").getAsString() : null;
                    double salary = jsonObject.has("salary") ? jsonObject.get("salary").getAsDouble() : 0;
                    
                    String rawPassword = jsonObject.has("password") ? jsonObject.get("password").getAsString() : "";
                    String hashedPassword = null;
                    if (!rawPassword.isEmpty()) {
                         hashedPassword = bssms_security.PasswordUtil.hashMD5(rawPassword);
                    }
                    
                    StaffDAO dao = new StaffDAO();
                    
                    String duplicateField = dao.checkDuplicate(username, email, phone, accountId);
                    if (duplicateField != null) {
                        response.setStatus(HttpServletResponse.SC_CONFLICT);
                        out.print("{\"message\": \"" + duplicateField + " này đã tồn tại trên hệ thống. Vui lòng chọn thông tin khác!\"}");
                        out.flush();
                        return;
                    }
                    
                    boolean success = dao.updateStaff(accountId, fullName, phone, email, role, hireDate, salary, username, hashedPassword);
                    
                    if (success) {
                        response.setStatus(HttpServletResponse.SC_OK);
                        out.print("{\"message\": \"Cập nhật nhân viên thành công!\"}");
                    } else {
                        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                        out.print("{\"message\": \"Lỗi: Không thể lưu cập nhật vào cơ sở dữ liệu.\"}");
                    }
                }

                if ("create".equals(action)) {
                    String fullName = jsonObject.get("fullName").getAsString().trim();
                    String email = jsonObject.get("email").getAsString().trim();
                    String phone = jsonObject.get("phone").getAsString().trim();
                    String role = jsonObject.get("role").getAsString();
                    String username = jsonObject.get("username").getAsString();
                    String password = jsonObject.get("password").getAsString();
                    double salary = jsonObject.has("salary") ? jsonObject.get("salary").getAsDouble() : 0;
                    
                    StaffDAO dao = new StaffDAO();
                    
                    String duplicateField = dao.checkDuplicate(username, email, phone, null);
                    
                    if (duplicateField != null) {
                        response.setStatus(HttpServletResponse.SC_CONFLICT);
                        out.print("{\"message\": \"" + duplicateField + " này đã tồn tại trên hệ thống. Vui lòng chọn thông tin khác!\"}");
                        out.flush();
                        return;
                    }
                    
                    String finalUsername = dao.createStaff(username, password, email, phone, fullName, role, salary);
                    
                    if (finalUsername != null) {
                        response.setStatus(HttpServletResponse.SC_CREATED);
                        out.print("{\"message\": \"Tạo tài khoản nhân viên thành công!\", \"username\": \"" + finalUsername + "\"}");
                    } else {
                        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                        out.print("{\"message\": \"Lỗi: Không thể lưu vào cơ sở dữ liệu.\"}");
                    }
                }
            } catch (Exception e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
                e.printStackTrace();
            }
            out.flush();
        }
    }
}
