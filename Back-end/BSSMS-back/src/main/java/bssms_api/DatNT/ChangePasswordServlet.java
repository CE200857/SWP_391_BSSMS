package bssms_api.DatNT;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import bssms_persistence.DatNT.PasswordDAO;
import bssms_security.PasswordUtil;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet(name = "ChangePasswordServlet", urlPatterns = {"/api/change-password"})
public class ChangePasswordServlet extends HttpServlet {

    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173"); 
        resp.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setHeader("Access-Control-Allow-Credentials", "true");
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

        // 1. Kiểm tra Session (Chỉ người đã đăng nhập mới được đổi mật khẩu)
        if (session == null || session.getAttribute("user") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"message\": \"Bạn chưa đăng nhập!\"}");
            out.flush();
            return;
        }

        try {
            // Lấy ID người dùng từ Session
            @SuppressWarnings("unchecked")
            Map<String, Object> user = (Map<String, Object>) session.getAttribute("user");
            int accountId = -1;
            if (user.containsKey("account_id")) {
                accountId = ((Number) user.get("account_id")).intValue();
            } else if (user.containsKey("accountId")) {
                accountId = ((Number) user.get("accountId")).intValue();
            }

            // Đọc dữ liệu gửi lên
            JsonObject jsonObject = gson.fromJson(request.getReader(), JsonObject.class);
            String oldPassword = jsonObject.get("oldPassword").getAsString();
            String newPassword = jsonObject.get("newPassword").getAsString();

            // Mã hóa MD5 cả 2 mật khẩu
            String oldPasswordHashed = PasswordUtil.hashMD5(oldPassword);
            String newPasswordHashed = PasswordUtil.hashMD5(newPassword);

            // Gọi Database
            PasswordDAO dao = new PasswordDAO();
            boolean isChanged = dao.changePassword(accountId, oldPasswordHashed, newPasswordHashed);

            if (isChanged) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\": \"Đổi mật khẩu thành công!\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Mật khẩu hiện tại không chính xác!\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"message\": \"Dữ liệu không hợp lệ hoặc lỗi server!\"}");
            e.printStackTrace();
        }
        out.flush();
    }
}