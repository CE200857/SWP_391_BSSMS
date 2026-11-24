package bssms_controller.auth;

import bssms_account.Account;
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

// Register Account
// 3 Step: Send OTP -> Verify OTP -> Register
public class RegisterController extends ControllerSupport {

    private static final String EMAIL_REGEX = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
    private static final String PHONE_REGEX = "^0[1-9]\\d{8}$";

    private final Gson gson = new Gson();

    public void post(ActionRequest request, ActionResult response) throws IOException {
        bind(request);

        try {
            JsonObject json = gson.fromJson(request.bodyReader(), JsonObject.class);
            RegisterDAO dao = use(new RegisterDAO());

            String action = "register";
            if (json.has("action")) {
                action = json.get("action").getAsString();
            }

            if (action.equals("send-code")) {
                sendCode(json, dao, response);
            } else if (action.equals("verify-code")) {
                verifyCode(json, dao, response);
            } else {
                register(json, dao, request, response);
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            sendMessage(response, 400, "Invalid input data!");
        }
    }

    // Step 1: Check email and send OTP
    private void sendCode(JsonObject json, RegisterDAO dao, ActionResult response) {
        String email = json.get("email").getAsString().trim();
        String username = null;
        if (json.has("username")) {
            username = json.get("username").getAsString().trim();
        }

        if (!email.matches(EMAIL_REGEX)) {
            sendMessage(response, 400, "Invalid email format!");
            return;
        }

        // Username is optional but need to be correct if have
        if (username != null && username.isEmpty()) {
            username = null;
        }
        if (username != null && (username.length() < 3 || username.contains(" "))) {
            sendMessage(response, 400, "The username must have at least 3 characters and no spaces!");
            return;
        }

        String duplicateField = dao.checkDuplicate(username, email, null, null);
        if (duplicateField != null) { // Return error if have duplicate
            sendMessage(response, 409, duplicateField + " is already in use. Please choose different information!");
            return;
        }

        String otp = EmailUtil.generateOTP();
        if (!dao.saveRegistrationCode(email, otp)) {
            sendMessage(response, 500, "Could not save the OTP. Please try again!");
            return;
        }

        if (!EmailUtil.sendOTP(email, otp, "[BSSMS] Account registration verification code")) {
            sendMessage(response, 503, "Could not send the email. Please try again later.");
            return;
        }

        sendMessage(response, 200, "A verification code has been sent to your email!");
    }

    // Step 2: Check user input OTP
    private void verifyCode(JsonObject json, RegisterDAO dao, ActionResult response) {
        String email = getText(json, "email");
        String code = getText(json, "verificationCode");

        if (email == null || code == null || code.isEmpty()) {
            sendMessage(response, 400, "Please enter the verification code!");
            return;
        }
        if (!dao.verifyRegistrationCode(email, code)) {
            sendMessage(response, 400, "The verification code is incorrect or has expired!");
            return;
        }

        JsonObject result = new JsonObject();
        result.addProperty("message", "Email verified!");
        result.addProperty("verified", true);
        response.status(200);
        response.writer().print(result.toString());
    }

    // Step 3: Validate information and create account
    private void register(JsonObject json, RegisterDAO dao, ActionRequest request, ActionResult response) {
        String username = json.get("username").getAsString().trim();
        String email = json.get("email").getAsString().trim();
        String password = json.get("password").getAsString();

        if (username.length() < 3 || username.contains(" ")) {
            sendMessage(response, 400, "The username must have at least 3 characters and no spaces!");
            return;
        }
        if (!email.matches(EMAIL_REGEX)) {
            sendMessage(response, 400, "Invalid email format!");
            return;
        }
        if (password.length() < 6) {
            sendMessage(response, 400, "The password must have at least 6 characters!");
            return;
        }

        String duplicateField = dao.checkDuplicate(username, email, null, null);
        if (duplicateField != null) {
            sendMessage(response, 409, duplicateField + " is already in use. Please choose different information!");
            return;
        }

        String fullName = getText(json, "fullName");
        String phone = getText(json, "phone");
        String dateOfBirth = getText(json, "dateOfBirth");
        String gender = getText(json, "gender");
        String address = getText(json, "address");

        if (fullName == null || fullName.isEmpty()) {
            sendMessage(response, 400, "Please enter your full name!");
            return;
        }
        if (fullName.length() > 100) {
            sendMessage(response, 400, "Full name can be at most 100 characters!");
            return;
        }
        if (phone == null || !phone.matches(PHONE_REGEX)) {
            sendMessage(response, 400, "Invalid phone number (10 digits, starting with 0, second digit not 0)!");
            return;
        }
        if (gender != null && !gender.isEmpty() && !isValidGender(gender)) {
            sendMessage(response, 400, "Invalid gender!");
            return;
        }
        if (address == null || address.isBlank()) {
            sendMessage(response, 400, "Please select a province/city!");
            return;
        }
        if (address.length() > 255) {
            sendMessage(response, 400, "Address can be at most 255 characters!");
            return;
        }

        String dobError = InputValidation.birthDateError(dateOfBirth);
        if (dobError != null) {
            sendMessage(response, 400, dobError);
            return;
        }

        String phoneTaken = dao.checkDuplicate(null, null, phone, null);
        if (phoneTaken != null) {
            sendMessage(response, 409, "Phone number is already in use. Please choose different information!");
            return;
        }

        String hashedPassword = PasswordUtil.hashMD5(password);
        boolean isCreated = dao.completeRegistration(username, hashedPassword, email,
                fullName, phone, dateOfBirth, gender, address);

        if (!isCreated) {
            sendMessage(response, 409, "Email verification has expired. Please go back to step 1 and verify your email again.");
            return;
        }

        // Login right after register
        Account user = dao.authenticateUser(email, hashedPassword);
        if (user != null) {
            SessionState session = request.session(true);
            session.set("user", user);
        }
        sendMessage(response, 201, "Registration successful!");
    }

    private boolean isValidGender(String gender) {
        return gender.equals("Male") || gender.equals("Female") || gender.equals("Other");
    }

    // Retrieve string from JSON
    private String getText(JsonObject json, String key) {
        if (!json.has(key) || json.get(key).isJsonNull()) {
            return null;
        }
        return json.get(key).getAsString().trim();
    }

    // Send message back to frontend JSON
    private void sendMessage(ActionResult response, int status, String message) {
        JsonObject json = new JsonObject();
        json.addProperty("message", message);
        response.status(status);
        response.writer().print(json.toString());
    }
}
