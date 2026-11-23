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
                    response.error(403,"Please verify the OTP for this email before resetting the password.");
                    return;
                }

                String newPassword = jsonObject.get("newPassword").getAsString();

                if (newPassword == null || newPassword.length() < 6) {
                    response.status(400);
                    out.print("{\"message\": \"The password must have at least 6 characters!\"}");
                    out.flush();
                    return;
                }

                String newPasswordHashed = PasswordUtil.hashMD5(newPassword);

                if (dao.isSameOldPasswordByEmail(email, newPasswordHashed)) {
                    response.status(400);
                    out.print("{\"message\": \"The new password must be different from the old password!\"}");
                    out.flush();
                    return;
                }

                if (dao.resetPasswordByEmail(email, newPasswordHashed)) {
                    verified.remove("passwordResetEmail");
                    verified.remove("passwordResetExpires");
                    response.status(200);
                    out.print("{\"message\": \"Password reset successfully.\"}");
                } else {
                    response.status(500);
                    out.print("{\"message\": \"Could not reset the password due to a system error!\"}");
                }
                out.flush();
                return;
            }

            String action = jsonObject.has("action") ? jsonObject.get("action").getAsString() : "send-code";

            if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                response.status(400);
                out.print("{\"message\": \"Invalid email format!\"}");
                out.flush();
                return;
            }

            if ("verify-code".equals(action)) {
                String code = jsonObject.has("code") ? jsonObject.get("code").getAsString().trim() : "";

                if (dao.verifyPasswordResetCode(email, code)) {
                    dao.clearPasswordResetCode(email);
                    SessionState verified=request.session(true);
                    verified.set("passwordResetEmail",email);
                    verified.set("passwordResetExpires",System.currentTimeMillis()+5*60*1000L);
                    response.status(200);
                    out.print("{\"message\": \"Verification successful!\"}");
                } else {
                    response.status(400);
                    out.print("{\"message\": \"The verification code is incorrect or has expired!\"}");
                }
                out.flush();
                return;
            }

            String duplicateField = dao.checkDuplicate(null, email, null, null);
            if (duplicateField != null) {
                String otp = EmailUtil.generateOTP();
                if (!dao.savePasswordResetCode(email, otp)) {
                    response.status(500);
                    out.print("{\"message\": \"Could not save the OTP. Please try again!\"}");
                    out.flush();
                    return;
                }

                if (!EmailUtil.sendOTP(email, otp, "[BSSMS] Password recovery verification code")) { response.error(503,"Could not send the email. Please try again later."); return; }
                response.status(200);
                out.print("{\"message\": \"A verification code has been sent to your email.\"}");
            } else {
                response.status(404);
                out.print("{\"message\": \"This email does not exist in the system!\"}");
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            
            response.status(500);
            out.print("{\"message\": \"Server error: " + e.getClass().getSimpleName() + "\"}");
        }
        out.flush();
    }
}