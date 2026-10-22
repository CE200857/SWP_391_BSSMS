package bssms_controller.auth;

import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import bssms_persistence.DatNT.RegisterDAO;
import bssms_security.PasswordUtil;
import bssms_security.EmailUtil;
import java.io.IOException;
import java.io.PrintWriter;
public class RegisterController extends ControllerSupport {

    private final Gson gson = new Gson();

    public void post(ActionRequest request, ActionResult response)
            throws IOException {

        PrintWriter out = response.writer();

        try {
            JsonObject jsonObject = gson.fromJson(request.bodyReader(), JsonObject.class);
            String action = jsonObject.has("action") ? jsonObject.get("action").getAsString() : "register";
            RegisterDAO dao = use(new RegisterDAO());

            if ("send-code".equals(action)) {
                String email = jsonObject.get("email").getAsString().trim();
                String username = jsonObject.has("username") ? jsonObject.get("username").getAsString().trim() : null;

                if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                    response.status(400);
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
                    response.status(409);
                    out.print("{\"message\": \"" + duplicateField + " này đã được sử dụng. Vui lòng chọn thông tin khác!\"}");
                    out.flush();
                    return;
                }

                String otp = EmailUtil.generateOTP();
                boolean isSaved = dao.saveVerificationCode(email, otp);
                if (!isSaved) {
                    response.status(500);
                    out.print("{\"message\": \"Không thể lưu mã OTP (Hãy kiểm tra bảng VerificationCode trong Database)!\"}");
                    out.flush();
                    return;
                }

                EmailUtil.sendOTP(email, otp, "[BSSMS] Mã xác thực đăng ký tài khoản");

                response.status(200);
                out.print("{\"message\": \"Mã xác thực đã được gửi đến email của bạn!\"}");
                out.flush();
                return;
            }

            String username = jsonObject.get("username").getAsString().trim();
            String email = jsonObject.get("email").getAsString().trim();
            String rawPassword = jsonObject.get("password").getAsString();
            String verificationCode = jsonObject.has("verificationCode") ? jsonObject.get("verificationCode").getAsString().trim() : "";

            if (username.length() < 3 || username.contains(" ")) {
                response.status(400);
                out.print("{\"message\": \"Tên đăng nhập phải có ít nhất 3 ký tự và không chứa khoảng trắng!\"}");
                out.flush();
                return;
            }

            if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                response.status(400);
                out.print("{\"message\": \"Email không đúng định dạng!\"}");
                out.flush();
                return;
            }

            if (rawPassword.length() < 6) {
                response.status(400);
                out.print("{\"message\": \"Mật khẩu phải có ít nhất 6 ký tự!\"}");
                out.flush();
                return;
            }

            String duplicateField = dao.checkDuplicate(username, email, null, null);
            if (duplicateField != null) {
                response.status(409);
                out.print("{\"message\": \"" + duplicateField + " này đã được sử dụng. Vui lòng chọn thông tin khác!\"}");
                out.flush();
                return;
            }

            if (!dao.verifyCode(email, verificationCode)) {
                response.status(400);
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
                    SessionState session = request.session(true);
                    session.set("user", user);
                }

                response.status(201);
                out.print("{\"message\": \"Đăng ký thành công!\"}");
            } else {
                response.status(409);
                out.print("{\"message\": \"Tên đăng nhập này đã tồn tại. Vui lòng chọn tên khác!\"}");
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            
            response.status(500);
            out.print("{\"message\": \"Lỗi xử lý tại máy chủ: " + e.getClass().getSimpleName() + "\"}");
        }
        out.flush();
    }
}