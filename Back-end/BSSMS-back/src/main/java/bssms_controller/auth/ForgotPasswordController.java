package bssms_controller.auth;

import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import bssms_persistence.DatNT.RegisterDAO;
import bssms_security.EmailUtil;
import bssms_security.PasswordUtil;

import java.io.IOException;
import java.io.PrintWriter;
public class ForgotPasswordController extends ControllerSupport {

    private final Gson gson = new Gson();

    public void post(ActionRequest request, ActionResult response)
            throws IOException {
        bind(request);

        PrintWriter out = response.writer();
        String uri = request.uri();

        try {
            JsonObject jsonObject = gson.fromJson(request.bodyReader(), JsonObject.class);
            String email = jsonObject.get("email").getAsString().trim();
            RegisterDAO dao = use(new RegisterDAO());

            if (uri.endsWith("/reset")) {
                SessionState verified=request.session(false);
                Object expiry=verified==null?null:verified.get("passwordResetExpires");
                if(verified==null || !email.equalsIgnoreCase(String.valueOf(verified.get("passwordResetEmail")))
                        || !(expiry instanceof Long) || ((Long)expiry) < System.currentTimeMillis()) {
                    response.error(403,"Vui lòng xác thực OTP của email này trước khi đặt lại mật khẩu.");
                    return;
                }

                String newPassword = jsonObject.get("newPassword").getAsString();

                if (newPassword == null || newPassword.length() < 6) {
                    response.status(400);
                    out.print("{\"message\": \"Mật khẩu phải có ít nhất 6 ký tự!\"}");
                    out.flush();
                    return;
                }

                String newPasswordHashed = PasswordUtil.hashMD5(newPassword);

                if (dao.isSameOldPasswordByEmail(email, newPasswordHashed)) {
                    response.status(400);
                    out.print("{\"message\": \"Mật khẩu mới không được trùng với mật khẩu cũ!\"}");
                    out.flush();
                    return;
                }

                if (dao.resetPasswordByEmail(email, newPasswordHashed)) {
                    verified.remove("passwordResetEmail");
                    verified.remove("passwordResetExpires");
                    response.status(200);
                    out.print("{\"message\": \"Đặt lại mật khẩu thành công.\"}");
                } else {
                    response.status(500);
                    out.print("{\"message\": \"Không thể đặt lại mật khẩu do lỗi hệ thống!\"}");
                }
                out.flush();
                return;
            }

            String action = jsonObject.has("action") ? jsonObject.get("action").getAsString() : "send-code";

            if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                response.status(400);
                out.print("{\"message\": \"Email không đúng định dạng!\"}");
                out.flush();
                return;
            }

            if ("verify-code".equals(action)) {
                String code = jsonObject.has("code") ? jsonObject.get("code").getAsString().trim() : "";

                if (dao.verifyCode(email, code, "PasswordReset")) {
                    dao.deleteVerificationCode(email);
                    SessionState verified=request.session(true);
                    verified.set("passwordResetEmail",email);
                    verified.set("passwordResetExpires",System.currentTimeMillis()+5*60*1000L);
                    response.status(200);
                    out.print("{\"message\": \"Xác thực thành công!\"}");
                } else {
                    response.status(400);
                    out.print("{\"message\": \"Mã xác thực không chính xác hoặc đã hết hạn!\"}");
                }
                out.flush();
                return;
            }

            String duplicateField = dao.checkDuplicate(null, email, null, null);
            if (duplicateField != null) {
                String otp = EmailUtil.generateOTP();
                if (!dao.saveVerificationCode(email, otp, "PasswordReset")) {
                    response.status(500);
                    out.print("{\"message\": \"Không thể lưu mã OTP (Hãy kiểm tra bảng VerificationCode trong Database)!\"}");
                    out.flush();
                    return;
                }

                if (!EmailUtil.sendOTP(email, otp, "[BSSMS] Mã xác thực khôi phục mật khẩu")) { response.error(503,"Không gửi được email. Vui lòng thử lại sau."); return; }
                response.status(200);
                out.print("{\"message\": \"Mã xác thực đã được gửi đến email của bạn.\"}");
            } else {
                response.status(404);
                out.print("{\"message\": \"Email này không tồn tại trong hệ thống!\"}");
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