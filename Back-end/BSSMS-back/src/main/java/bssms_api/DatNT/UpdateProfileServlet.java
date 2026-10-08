package bssms_api.DatNT;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import bssms_persistence.DatNT.ProfileDAO;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet(name = "UpdateProfileServlet", urlPatterns = {"/api/update-profile"})
public class UpdateProfileServlet extends HttpServlet {

    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173"); 
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS"); 
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setHeader("Access-Control-Allow-Credentials", "true"); 
    }
    
    private String formatFullName(String name) {
        if (name == null || name.trim().isEmpty()) return "";
        String[] words = name.trim().split("\\s+");
        StringBuilder formatted = new StringBuilder();
        for (String word : words) {
            if (word.length() > 0) {
                formatted.append(Character.toUpperCase(word.charAt(0)))
                         .append(word.substring(1).toLowerCase())
                         .append(" ");
            }
        }
        return formatted.toString().trim();
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();
        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("user") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"message\": \"Phiên làm việc không hợp lệ! Vui lòng đăng nhập lại.\"}");
            out.flush();
            return;
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> user = (Map<String, Object>) session.getAttribute("user");
            
            int accountId = -1;
            if (user.containsKey("account_id")) {
                accountId = ((Number) user.get("account_id")).intValue();
            } else if (user.containsKey("accountId")) {
                accountId = ((Number) user.get("accountId")).intValue();
            }
            
            String role = (String) user.get("role");

            JsonObject jsonObject = gson.fromJson(request.getReader(), JsonObject.class);
            String fullName = jsonObject.get("fullName").getAsString().trim();
            String phone = jsonObject.get("phone").getAsString().trim();
            String username = jsonObject.has("username") ? jsonObject.get("username").getAsString().trim() : "";
            
            if (username.length() < 3 || username.contains(" ")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Tên đăng nhập phải có ít nhất 3 ký tự và không chứa khoảng trắng!\"}");
                out.flush();
                return;
            }
            
            if (fullName.split("\\s+").length < 2) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Họ và tên bắt buộc phải có từ 2 từ trở lên!\"}");
                out.flush();
                return;
            }

            if (!phone.matches("^0[1-9]\\d{8}$")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0, số thứ hai khác 0)!\"}");
                out.flush();
                return;
            }

            String standardizedName = formatFullName(fullName);
            ProfileDAO dao = new ProfileDAO();
            
            if (dao.isUsernameTaken(username, accountId)) {
                response.setStatus(HttpServletResponse.SC_CONFLICT);
                out.print("{\"message\": \"Tên đăng nhập này đã được người khác sử dụng!\"}");
                out.flush();
                return;
            }
            
            boolean isUpdated = false;

            if ("Customer".equals(role)) {
                String dob = jsonObject.get("dob").getAsString();
                String gender = jsonObject.get("gender").getAsString();
                String address = jsonObject.get("address").getAsString();
                isUpdated = dao.updateCustomerProfile(accountId, standardizedName, dob, gender, phone, address, username);
            } else {
                isUpdated = dao.updateStaffProfile(accountId, standardizedName, phone, username);
            }

            if (isUpdated) {
                user.put("fullName", standardizedName);
                user.put("username", username);
                session.setAttribute("user", user);

                response.setStatus(HttpServletResponse.SC_OK);
                out.print(gson.toJson(user));
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"message\": \"Không thể lưu thông tin. Vui lòng thử lại!\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
            e.printStackTrace();
        }
        out.flush();
    }
}