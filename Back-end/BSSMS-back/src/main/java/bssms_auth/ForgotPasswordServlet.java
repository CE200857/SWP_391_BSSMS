package bssms_auth;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import bssms_persistence.DatNT.RegisterDAO;
import bssms_security.EmailUtil;
import bssms_security.PasswordUtil;

import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(name = "ForgotPasswordServlet", urlPatterns = {
    "/api/forgot-password/check-email",
    "/api/forgot-password/reset"
})
public class ForgotPasswordServlet extends HttpServlet {

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
        String uri = request.getRequestURI();

        try {
            JsonObject jsonObject = gson.fromJson(request.getReader(), JsonObject.class);
            String email = jsonObject.get("email").getAsString().trim();
            RegisterDAO dao = new RegisterDAO();

            if (uri.endsWith("/reset")) {
                String newPassword = jsonObject.get("newPassword").getAsString();

                if (newPassword == null || newPassword.length() < 6) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"message\": \"Mật khẩu phải có ít nhất 6 ký tự!\"}");
                    out.flush();
                    return;
                }

                String newPasswordHashed = PasswordUtil.hashMD5(newPassword);

                if (dao.isSameOldPasswordByEmail(email, newPasswordHashed)) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"message\": \"Mật khẩu mới không được trùng với mật khẩu cũ!\"}");
                    out.flush();
                    return;
                }

                if (dao.resetPasswordByEmail(email, newPasswordHashed)) {
                    response.setStatus(HttpServletResponse.SC_OK);
                    out.print("{\"message\": \"Đặt lại mật khẩu thành công.\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"message\": \"Không thể đặt lại mật khẩu do lỗi hệ thống!\"}");
                }
                out.flush();
                return;
            }

            String action = jsonObject.has("action") ? jsonObject.get("action").getAsString() : "send-code";

            if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Email không đúng định dạng!\"}");
                out.flush();
                return;
            }

            if ("verify-code".equals(action)) {
                String code = jsonObject.has("code") ? jsonObject.get("code").getAsString().trim() : "";

                if (dao.verifyCode(email, code)) {
                    dao.deleteVerificationCode(email);
                    response.setStatus(HttpServletResponse.SC_OK);
                    out.print("{\"message\": \"Xác thực thành công!\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"message\": \"Mã xác thực không chính xác hoặc đã hết hạn!\"}");
                }
                out.flush();
                return;
            }

            String duplicateField = dao.checkDuplicate(null, email, null, null);
            if (duplicateField != null) {
                String otp = EmailUtil.generateOTP();
                if (!dao.saveVerificationCode(email, otp)) {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"message\": \"Không thể lưu mã OTP (Hãy kiểm tra bảng VerificationCode trong Database)!\"}");
                    out.flush();
                    return;
                }

                EmailUtil.sendOTP(email, otp, "[BSSMS] Mã xác thực khôi phục mật khẩu");
                response.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\": \"Mã xác thực đã được gửi đến email của bạn.\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"message\": \"Email này không tồn tại trong hệ thống!\"}");
            }
        } catch (Throwable e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"message\": \"Lỗi xử lý tại máy chủ: " + e.getClass().getSimpleName() + "\"}");
        }
        out.flush();
    }
}