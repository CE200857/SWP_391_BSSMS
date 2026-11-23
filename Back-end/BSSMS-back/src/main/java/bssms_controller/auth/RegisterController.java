package bssms_controller.auth;

import bssms_account.Account;
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
        bind(request);

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
                    out.print("{\"message\": \"Invalid email format!\"}");
                    out.flush();
                    return;
                }

                // Step 1 of sign-up only needs the email; the profile is saved when the account is created.
                if (username != null && !username.isEmpty() && (username.length() < 3 || username.contains(" "))) {
                    response.error(400, "The username must have at least 3 characters and no spaces!");
                    return;
                }
                String phone = null;
                String duplicateField = dao.checkDuplicate(
                        (username != null && !username.isEmpty()) ? username : null,
                        email,
                        phone,
                        null
                );
                if (duplicateField != null) {
                    response.status(409);
                    out.print("{\"message\": \"" + duplicateField + " is already in use. Please choose different information!\"}");
                    out.flush();
                    return;
                }

                String otp = EmailUtil.generateOTP();
                boolean isSaved = dao.saveRegistrationCode(email, otp, null, null, null, null, null);
                if (!isSaved) {
                    response.status(500);
                    out.print("{\"message\": \"Could not save the OTP. Please try again!\"}");
                    out.flush();
                    return;
                }

                if (!EmailUtil.sendOTP(email, otp, "[BSSMS] Account registration verification code")) { response.error(503,"Could not send the email. Please try again later."); return; }

                response.status(200);
                out.print("{\"message\": \"A verification code has been sent to your email!\"}");
                out.flush();
                return;
            }

            if ("verify-code".equals(action)) {
                String email = text(jsonObject, "email");
                String code = text(jsonObject, "verificationCode");
                if (email == null || code == null || code.isEmpty()) { response.error(400, "Please enter the verification code!"); return; }
                if (!dao.verifyRegistrationCode(email, code)) { response.error(400, "The verification code is incorrect or has expired!"); return; }
                response.status(200);
                out.print("{\"message\": \"Email verified!\", \"verified\": true}");
                out.flush();
                return;
            }

            String username = jsonObject.get("username").getAsString().trim();
            String email = jsonObject.get("email").getAsString().trim();
            String rawPassword = jsonObject.get("password").getAsString();
            String verificationCode = jsonObject.has("verificationCode") ? jsonObject.get("verificationCode").getAsString().trim() : "";

            if (username.length() < 3 || username.contains(" ")) {
                response.status(400);
                out.print("{\"message\": \"The username must have at least 3 characters and no spaces!\"}");
                out.flush();
                return;
            }

            if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                response.status(400);
                out.print("{\"message\": \"Invalid email format!\"}");
                out.flush();
                return;
            }

            if (rawPassword.length() < 6) {
                response.status(400);
                out.print("{\"message\": \"The password must have at least 6 characters!\"}");
                out.flush();
                return;
            }

            String duplicateField = dao.checkDuplicate(username, email, null, null);
            if (duplicateField != null) {
                response.status(409);
                out.print("{\"message\": \"" + duplicateField + " is already in use. Please choose different information!\"}");
                out.flush();
                return;
            }

            String fullName = text(jsonObject, "fullName");
            String phone = text(jsonObject, "phone");
            String dateOfBirth = text(jsonObject, "dateOfBirth");
            String gender = text(jsonObject, "gender");
            String address = text(jsonObject, "address");
            if (fullName == null || fullName.isEmpty()) { response.error(400, "Please enter your full name!"); return; }
            if (fullName.length() > 100) { response.error(400, "Full name can be at most 100 characters!"); return; }
            if (phone == null || !phone.matches("^0\\d{9,10}$")) { response.error(400, "Invalid phone number (10-11 digits, starting with 0)!"); return; }
            if (gender != null && !gender.isEmpty() && !java.util.Arrays.asList("Male", "Female", "Other").contains(gender)) { response.error(400, "Invalid gender!"); return; }
            if (address == null || address.isBlank()) { response.error(400, "Please select a province/city!"); return; }
            if (address.length() > 255) { response.error(400, "Address can be at most 255 characters!"); return; }
            String dobError = InputValidation.birthDateError(dateOfBirth);
            if (dobError != null) { response.error(400, dobError); return; }
            String phoneTaken = dao.checkDuplicate(null, null, phone, null);
            if (phoneTaken != null) { response.error(409, "Phone number is already in use. Please choose different information!"); return; }

            // Older clients may still send the code with the final request.
            if (!verificationCode.isEmpty()) dao.verifyRegistrationCode(email, verificationCode);

            String hashedPassword = PasswordUtil.hashMD5(rawPassword);
            boolean isCreated = dao.completeRegistration(username, hashedPassword, email, fullName, phone, dateOfBirth, gender, address);

            if (isCreated) {

                Account user = dao.authenticateUser(email, hashedPassword);
                if (user != null) {
                    SessionState session = request.session(true);
                    session.set("user", user);
                }

                response.status(201);
                out.print("{\"message\": \"Registration successful!\"}");
            } else {
                response.status(409);
                out.print("{\"message\": \"Email verification has expired. Please go back to step 1 and verify your email again.\"}");
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            
            response.status(500);
            out.print("{\"message\": \"Server error: " + e.getClass().getSimpleName() + "\"}");
        }
        out.flush();
    }

    private static String text(JsonObject o, String key) {
        return o.has(key) && !o.get(key).isJsonNull() ? o.get(key).getAsString().trim() : null;
    }
}
