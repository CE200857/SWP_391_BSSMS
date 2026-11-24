package bssms_controller.auth;

import bssms_controller.common.ActionRequest;
import bssms_controller.common.ActionResult;
import bssms_controller.common.ControllerSupport;
import bssms_controller.common.InputValidation;
import bssms_controller.common.SessionState;
import bssms_persistence.DatNT.RegisterDAO;
import bssms_persistence.common.DataAccessException;
import bssms_security.EmailUtil;
import bssms_security.PasswordUtil;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import java.io.IOException;

// Forgot Password
// Step: send OTP -> verify OTP -> reset password
public class ForgotPasswordController extends ControllerSupport {

    private static final String EMAIL_REGEX = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
    private static final long FIVE_MINUTES = 5 * 60 * 1000L;

    private final Gson gson = new Gson();

    public void post(ActionRequest request, ActionResult response) throws IOException {
        bind(request);

        try {
            JsonObject json = gson.fromJson(request.bodyReader(), JsonObject.class);
            String email = json.get("email").getAsString().trim();
            RegisterDAO dao = use(new RegisterDAO());

            // url /reset: enter new password
            if (request.uri().endsWith("/reset")) {
                resetPassword(json, email, dao, request, response);
                return;
            }

            if (!email.matches(EMAIL_REGEX)) {
                sendMessage(response, 400, "Invalid email format!");
                return;
            }

            String action = "send-code";
            if (json.has("action")) {
                action = json.get("action").getAsString();
            }

            if (action.equals("verify-code")) {
                verifyCode(json, email, dao, request, response);
            } else {
                sendCode(email, dao, response);
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            sendMessage(response, 400, "Invalid input data!");
        }
    }

    // send OTP to email
    private void sendCode(String email, RegisterDAO dao, ActionResult response) {
        String foundField = dao.checkDuplicate(null, email, null, null); // Check for email, email must have in db
        if (foundField == null) {
            sendMessage(response, 404, "This email does not exist in the system!");
            return;
        }

        String otp = EmailUtil.generateOTP();
        if (!dao.savePasswordResetCode(email, otp)) {
            sendMessage(response, 500, "Could not save the OTP. Please try again!");
            return;
        }

        if (!EmailUtil.sendOTP(email, otp, "[BSSMS] Password recovery verification code")) {
            sendMessage(response, 503, "Could not send the email. Please try again later.");
            return;
        }

        sendMessage(response, 200, "A verification code has been sent to your email.");
    }

    // Verify OTP, memorize in session 5m if true
    private void verifyCode(JsonObject json, String email, RegisterDAO dao,
            ActionRequest request, ActionResult response) {
        String code = "";
        if (json.has("code")) {
            code = json.get("code").getAsString().trim();
        }

        if (!dao.verifyPasswordResetCode(email, code)) {
            sendMessage(response, 400, "The verification code is incorrect or has expired!");
            return;
        }

        dao.clearPasswordResetCode(email);
        SessionState session = request.session(true);
        session.set("passwordResetEmail", email);
        session.set("passwordResetExpires", System.currentTimeMillis() + FIVE_MINUTES);
        sendMessage(response, 200, "Verification successful!");
    }

    // Reset Password
    private void resetPassword(JsonObject json, String email, RegisterDAO dao,
            ActionRequest request, ActionResult response) {
        SessionState session = request.session(false);
        if (!isVerified(session, email)) {
            sendMessage(response, 403, "Please verify the OTP for this email before resetting the password.");
            return;
        }

        String newPassword = json.get("newPassword").getAsString();
        if (newPassword.length() < 6) {
            sendMessage(response, 400, "The password must have at least 6 characters!");
            return;
        }

        String newPasswordHashed = PasswordUtil.hashMD5(newPassword);
        if (dao.isSameOldPasswordByEmail(email, newPasswordHashed)) {
            sendMessage(response, 400, "The new password must be different from the old password!");
            return;
        }

        if (!dao.resetPasswordByEmail(email, newPasswordHashed)) {
            sendMessage(response, 500, "Could not reset the password due to a system error!");
            return;
        }

        session.remove("passwordResetEmail");
        session.remove("passwordResetExpires");
        sendMessage(response, 200, "Password reset successfully.");
    }

    // Check session that verified OTP for this email and not expired
    private boolean isVerified(SessionState session, String email) {
        if (session == null) {
            return false;
        }
        String verifiedEmail = String.valueOf(session.get("passwordResetEmail"));
        if (!email.equalsIgnoreCase(verifiedEmail)) {
            return false;
        }
        Object expiry = session.get("passwordResetExpires");
        if (!(expiry instanceof Long)) {
            return false;
        }
        long expiryTime = (Long) expiry;
        return expiryTime >= System.currentTimeMillis();
    }

    // Send message back to frontend JSON
    private void sendMessage(ActionResult response, int status, String message) {
        JsonObject json = new JsonObject();
        json.addProperty("message", message);
        response.status(status);
        response.writer().print(json.toString());
    }
}
