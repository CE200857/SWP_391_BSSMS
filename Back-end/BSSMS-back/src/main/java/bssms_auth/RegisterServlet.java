package bssms_auth;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import bssms_persistence.DatNT.RegisterDAO;
import bssms_security.PasswordUtil;
import bssms_security.EmailUtil;
import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(name = "RegisterServlet", urlPatterns = {"/api/register"})
public class RegisterServlet extends HttpServlet {

    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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
            String action = jsonObject.has("action") ? jsonObject.get("action").getAsString() : "register";
            RegisterDAO dao = new RegisterDAO();

            if ("send-code".equals(action)) {
                String email = jsonObject.get("email").getAsString().trim();
                String username = jsonObject.has("username") ? jsonObject.get("username").getAsString().trim() : null;

                if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"message\": \"Email không đúng định dạng!\"}");
                    out.flush();
                    return;
                }

                String duplicateField = dao.checkDuplicate(
                        (username != null && !username.isEmpty()) ? username : null,
                        email,
                        null,
                        null
                );
                if (duplicateField != null) {
                    response.setStatus(HttpServletResponse.SC_CONFLICT);
                    out.print("{\"message\": \"" + duplicateField + " này đã được sử dụng. Vui lòng chọn thông tin khác!\"}");
                    out.flush();
                    return;
                }

                String otp = EmailUtil.generateOTP();
                boolean isSaved = dao.saveVerificationCode(email, otp);
                if (!isSaved) {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"message\": \"Không thể lưu mã OTP (Hãy kiểm tra bảng VerificationCode trong Database)!\"}");
                    out.flush();
                    return;
                }

                EmailUtil.sendOTP(email, otp, "[BSSMS] Mã xác thực đăng ký tài khoản");

                response.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\": \"Mã xác thực đã được gửi đến email của bạn!\"}");
                out.flush();
                return;
            }

            String username = jsonObject.get("username").getAsString().trim();
            String email = jsonObject.get("email").getAsString().trim();
            String rawPassword = jsonObject.get("password").getAsString();
            String verificationCode = jsonObject.has("verificationCode") ? jsonObject.get("verificationCode").getAsString().trim() : "";

            if (username.length() < 3 || username.contains(" ")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Tên đăng nhập phải có ít nhất 3 ký tự và không chứa khoảng trắng!\"}");
                out.flush();
                return;
            }

            if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Email không đúng định dạng!\"}");
                out.flush();
                return;
            }

            if (rawPassword.length() < 6) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Mật khẩu phải có ít nhất 6 ký tự!\"}");
                out.flush();
                return;
            }

            String duplicateField = dao.checkDuplicate(username, email, null, null);
            if (duplicateField != null) {
                response.setStatus(HttpServletResponse.SC_CONFLICT);
                out.print("{\"message\": \"" + duplicateField + " này đã được sử dụng. Vui lòng chọn thông tin khác!\"}");
                out.flush();
                return;
            }

            if (!dao.verifyCode(email, verificationCode)) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Mã xác thực không chính xác hoặc đã hết hạn!\"}");
                out.flush();
                return;
            }

            String hashedPassword = PasswordUtil.hashMD5(rawPassword);
            boolean isCreated = dao.createAccount(username, hashedPassword, email);

            if (isCreated) {
                dao.deleteVerificationCode(email);

                java.util.Map<String, Object> user = dao.authenticateUser(email, hashedPassword);
                if (user != null) {
                    jakarta.servlet.http.HttpSession session = request.getSession(true);
                    session.setAttribute("user", user);
                }

                response.setStatus(HttpServletResponse.SC_CREATED);
                out.print("{\"message\": \"Đăng ký thành công!\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_CONFLICT);
                out.print("{\"message\": \"Tên đăng nhập này đã tồn tại. Vui lòng chọn tên khác!\"}");
            }
        } catch (Throwable e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"message\": \"Lỗi xử lý tại máy chủ: " + e.getClass().getSimpleName() + "\"}");
        }
        out.flush();
    }
}