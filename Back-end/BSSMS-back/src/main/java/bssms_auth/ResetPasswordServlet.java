package bssms_auth;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import bssms_persistence.DatNT.PasswordDAO;
import bssms_security.PasswordUtil;

import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(name = "ResetPasswordServlet", urlPatterns = {"/api/forgot-password/reset"})
public class ResetPasswordServlet extends HttpServlet {

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
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        PrintWriter out = response.getWriter();
        
        try {
            JsonObject jsonObject = gson.fromJson(request.getReader(), JsonObject.class);
            String email = jsonObject.get("email").getAsString().trim();
            String newPassword = jsonObject.get("newPassword").getAsString();
            
            if (newPassword == null || newPassword.length() < 6) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Mật khẩu phải có ít nhất 6 ký tự!\"}");
                out.flush();
                return;
            }

            String newPasswordHashed = PasswordUtil.hashMD5(newPassword);

            PasswordDAO dao = new PasswordDAO();
            boolean isReset = dao.resetPasswordByEmail(email, newPasswordHashed);
            
            if (isReset) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\": \"Đặt lại mật khẩu thành công.\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"message\": \"Không thể đặt lại mật khẩu do lỗi hệ thống!\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
        }
        out.flush();
    }
}