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

@WebServlet(name = "ProfileServlet", urlPatterns = {"/api/profile"})
public class ProfileServlet extends HttpServlet {

    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173"); 
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); // Thêm POST
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setHeader("Access-Control-Allow-Credentials", "true"); // Thêm dòng này để xử lý Session
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    // XỬ LÝ LẤY DỮ LIỆU (Xem Profile)
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        try {
            int accountId = Integer.parseInt(request.getParameter("accountId"));
            String role = request.getParameter("role");

            ProfileDAO dao = new ProfileDAO();
            Map<String, Object> profile = dao.getProfileByAccountId(accountId, role);
            
            PrintWriter out = response.getWriter();
            if (profile != null && !profile.isEmpty()) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.print(gson.toJson(profile));
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"message\": \"Không tìm thấy hồ sơ!\"}");
            }
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
        }
    }

    // XỬ LÝ LƯU DỮ LIỆU (Tạo Profile mới)
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();
        HttpSession session = request.getSession(false);

        // Bắt buộc phải có Session từ bước Register thì mới cho tạo Profile
        if (session == null || session.getAttribute("user") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"message\": \"Phiên làm việc không hợp lệ! Vui lòng đăng nhập lại.\"}");
            out.flush();
            return;
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> user = (Map<String, Object>) session.getAttribute("user");
            
            // Lấy ID từ Session (đảm bảo đồng nhất key account_id hoặc accountId)
            int accountId = -1;
            if (user.containsKey("account_id")) {
                accountId = ((Number) user.get("account_id")).intValue();
            } else if (user.containsKey("accountId")) {
                accountId = ((Number) user.get("accountId")).intValue();
            }

            // Đọc dữ liệu từ form React gửi lên
            JsonObject jsonObject = gson.fromJson(request.getReader(), JsonObject.class);
            String fullName = jsonObject.get("fullName").getAsString();
            String dob = jsonObject.get("dob").getAsString();
            String gender = jsonObject.get("gender").getAsString();
            String phone = jsonObject.get("phone").getAsString();
            String address = jsonObject.get("address").getAsString();

            ProfileDAO dao = new ProfileDAO();
            boolean isCreated = dao.createCustomerProfile(accountId, fullName, dob, gender, phone, address);

            if (isCreated) {
                // Cập nhật Role và FullName vào Session hiện tại
                user.put("role", "Customer");
                user.put("fullName", fullName);
                session.setAttribute("user", user);

                response.setStatus(HttpServletResponse.SC_OK);
                out.print(gson.toJson(user)); // Trả về object user mới
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