package bssms_controller.DatNT;

import bssms_account.Account;
import bssms_account.Profile;
import bssms_common.LoginIdentity;
import bssms_common.SessionUsers;
import bssms_controller.common.ActionRequest;
import bssms_controller.common.ActionResult;
import bssms_controller.common.ControllerSupport;
import bssms_controller.common.InputValidation;
import bssms_controller.common.SessionState;
import bssms_persistence.DatNT.ProfileDAO;
import bssms_persistence.DatNT.RegisterDAO;
import bssms_persistence.common.DataAccessException;
import bssms_security.EmailUtil;
import bssms_security.PasswordUtil;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import java.io.IOException;

// Manage Profile: view, create, update profile and change password
public class ProfileController extends ControllerSupport {

    private static final String EMAIL_REGEX = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
    private static final String PHONE_REGEX = "^0[1-9]\\d{8}$";

    private final Gson gson = new Gson();

    // View Profile
    public void get(ActionRequest request, ActionResult response) throws IOException {
        bind(request);

        try {
            SessionState session = request.session(false);
            Account user = getLoggedInUser(session);
            if (user == null) {
                sendMessage(response, 401, "Please log in to view your profile.");
                return;
            }

            ProfileDAO dao = use(new ProfileDAO());
            if (!isActive(dao, user.getAccountId())) {
                sendMessage(response, 403, "Your account is locked or not activated.");
                return;
            }

            Profile profile = dao.getProfileByAccountId(user.getAccountId(), user.getRole());
            if (profile.getUsername() == null) {
                sendMessage(response, 404, "Profile not found!");
                return;
            }

            response.status(200);
            response.writer().print(gson.toJson(profile));
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            sendMessage(response, 400, "Invalid input data!");
        }
    }

    // URLs: /change-password, /update-profile
    public void post(ActionRequest request, ActionResult response) throws IOException {
        bind(request);

        SessionState session = request.session(false);
        Account user = getLoggedInUser(session);
        if (user == null) {
            sendMessage(response, 401, "Invalid session! Please log in again.");
            return;
        }

        try {
            JsonObject json = gson.fromJson(request.bodyReader(), JsonObject.class);
            ProfileDAO dao = use(new ProfileDAO());
            RegisterDAO authDao = use(new RegisterDAO());
            int accountId = user.getAccountId();
            String uri = request.uri();

            // Account may be locked after login, so check status in database every time
            if (!isActive(dao, accountId)) {
                sendMessage(response, 403, "Your account is locked or not activated.");
                return;
            }

            if (uri.endsWith("/change-password")) {
                changePassword(json, accountId, authDao, response);
                return;
            }

            // Only /update-profile is left, other URLs are not supported
            if (!uri.endsWith("/update-profile")) {
                sendMessage(response, 404, "Not found.");
                return;
            }

            String action = "";
            if (json.has("action")) {
                action = json.get("action").getAsString();
            }

            if (action.equals("send-email-code")) {
                sendEmailChangeCode(json, accountId, user.getRole(), authDao, response);
                return;
            }

            // Check full name and phone
            String fullName = json.get("fullName").getAsString().trim();
            String phone = json.get("phone").getAsString().trim();

            if (fullName.split("\\s+").length < 2) {
                sendMessage(response, 400, "Full name must have at least 2 words!");
                return;
            }
            if (!phone.matches(PHONE_REGEX)) {
                sendMessage(response, 400, "Invalid phone number (10 digits, starting with 0, second digit not 0)!");
                return;
            }

            String standardizedName = formatFullName(fullName);
            updateProfile(json, user, accountId, standardizedName, phone, dao, authDao, session, response);
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            sendMessage(response, 400, "Invalid input data!");
        }
    }

    // Change Password
    private void changePassword(JsonObject json, int accountId, RegisterDAO authDao, ActionResult response) {
        String oldPassword = json.get("oldPassword").getAsString();
        String newPassword = json.get("newPassword").getAsString();

        if (newPassword.length() < 6) {
            sendMessage(response, 400, "The new password must have at least 6 characters!");
            return;
        }
        if (oldPassword.equals(newPassword)) {
            sendMessage(response, 400, "The new password must be different from the current password!");
            return;
        }

        String oldPasswordHashed = PasswordUtil.hashMD5(oldPassword);
        String newPasswordHashed = PasswordUtil.hashMD5(newPassword);
        if (!authDao.changePassword(accountId, oldPasswordHashed, newPasswordHashed)) {
            sendMessage(response, 400, "The current password is incorrect!");
            return;
        }

        sendMessage(response, 200, "Password changed successfully!");
    }

    // Customer changes email: send OTP to new email
    private void sendEmailChangeCode(JsonObject json, int accountId, String role,
            RegisterDAO authDao, ActionResult response) {
        if (!"Customer".equals(role)) {
            sendMessage(response, 403, "Only customers can change their email here!");
            return;
        }

        String newEmail = getText(json, "email");
        if (newEmail == null || !newEmail.matches(EMAIL_REGEX)) {
            sendMessage(response, 400, "Invalid new email format!");
            return;
        }

        String duplicateField = authDao.checkDuplicate(null, newEmail, null, accountId);
        if (duplicateField != null) {
            sendMessage(response, 409, duplicateField + " is already used by another account!");
            return;
        }

        String otp = EmailUtil.generateOTP();
        int customerId = LoginIdentity.customerId(accountId);
        if (!authDao.saveEmailChangeCode(customerId, newEmail, otp)) {
            sendMessage(response, 500, "Could not create a verification code. Please try again!");
            return;
        }

        if (!EmailUtil.sendOTP(newEmail, otp, "[BSSMS] Email change verification code")) {
            sendMessage(response, 503, "Could not send the email. Please try again later.");
            return;
        }

        sendMessage(response, 200, "A verification code has been sent to your new email!");
    }

    // Update Profile
    private void updateProfile(JsonObject json, Account user, int accountId, String standardizedName,
            String phone, ProfileDAO dao, RegisterDAO authDao, SessionState session, ActionResult response) {
        String role = user.getRole();
        boolean isCustomer = "Customer".equals(role);

        String username = getText(json, "username");
        if (username == null || username.length() < 3 || username.contains(" ")) {
            sendMessage(response, 400, "The username must have at least 3 characters and no spaces!");
            return;
        }

        // Get current email to know if user changed it
        Profile currentProfile = dao.getProfileByAccountId(accountId, role);
        String currentEmail = "";
        if (currentProfile.getEmail() != null) {
            currentEmail = currentProfile.getEmail().trim();
        }
        String newEmail = getText(json, "email");
        if (newEmail == null) {
            newEmail = currentEmail;
        }

        boolean isEmailChanged = isCustomer && !newEmail.equalsIgnoreCase(currentEmail);
        if (isEmailChanged && !newEmail.matches(EMAIL_REGEX)) {
            sendMessage(response, 400, "Invalid new email format!");
            return;
        }

        // Staff cannot change email here so no need to check email
        String emailToCheck = null;
        if (isCustomer) {
            emailToCheck = newEmail;
        }
        String duplicateField = authDao.checkDuplicate(username, emailToCheck, phone, accountId);
        if (duplicateField != null) {
            sendMessage(response, 409, duplicateField + " is already used by someone else!");
            return;
        }

        // Customer: read and check other fields BEFORE verifying OTP,
        // so the OTP is not used up when another field is wrong
        String dob = null;
        String gender = null;
        String address = null;
        if (isCustomer) {
            dob = json.get("dob").getAsString();
            String dobError = InputValidation.birthDateError(dob);
            if (dobError != null) {
                sendMessage(response, 400, dobError);
                return;
            }
            gender = json.get("gender").getAsString();
            address = json.get("address").getAsString();
        }

        // Changing email requires the OTP sent to new email
        if (isEmailChanged) {
            String verificationCode = getText(json, "verificationCode");
            int customerId = LoginIdentity.customerId(accountId);
            if (verificationCode == null || verificationCode.isEmpty()
                    || !authDao.verifyEmailChangeCode(customerId, newEmail, verificationCode)) {
                sendMessage(response, 400, "The email verification code is incorrect or has expired!");
                return;
            }
        }

        // Save new information to database
        boolean isUpdated;
        if (isCustomer) {
            isUpdated = dao.updateCustomerProfile(accountId, standardizedName, dob, gender, phone, address, username, newEmail);
        } else {
            isUpdated = dao.updateStaffProfile(accountId, standardizedName, phone, username);
        }
        if (!isUpdated) {
            sendMessage(response, 500, "Could not save the information. Please try again!");
            return;
        }

        // Save new information to session
        if (isEmailChanged) {
            authDao.clearEmailChangeCode(LoginIdentity.customerId(accountId));
            user.setEmail(newEmail);
        }
        user.setFullName(standardizedName);
        user.setUsername(username);
        user.setPhone(phone);
        session.set("user", user);

        response.status(200);
        response.writer().print(gson.toJson(user));
    }

    // Only Active accounts can use profile (same rule as Login)
    private boolean isActive(ProfileDAO dao, int accountId) {
        return "Active".equals(dao.getStatus(accountId));
    }

    // Get logged in user from session, null if not logged in
    private Account getLoggedInUser(SessionState session) {
        if (session == null) {
            return null;
        }
        return SessionUsers.from(session.get("user"));
    }

    // Capitalize first letter of each word, e.g. "nguyen van a" -> "Nguyen Van A"
    private String formatFullName(String name) {
        String[] words = name.trim().split("\\s+");
        String result = "";
        for (String word : words) {
            char first = Character.toUpperCase(word.charAt(0));
            String rest = word.substring(1).toLowerCase();
            result = result + first + rest + " ";
        }
        return result.trim();
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
