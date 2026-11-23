package bssms_controller.DatNT;

import bssms_account.Account;
import bssms_common.SessionUsers;
import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import bssms_persistence.DatNT.ProfileDAO;
import bssms_persistence.DatNT.RegisterDAO;
import bssms_security.EmailUtil;
import bssms_security.PasswordUtil;

import java.io.IOException;
import java.io.PrintWriter;

public class ProfileController extends ControllerSupport {

    private final Gson gson = new Gson();

    private String formatFullName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "";
        }
        String[] words = name.trim().split("\\s+");
        StringBuilder formatted = new StringBuilder();
        for (String word : words) {
            if (word.length() > 0) {
                formatted.append(Character.toUpperCase(word.charAt(0)))
                        .append(word.substring(1).toLowerCase())
                        .append(" ");
            }
        }
        return formatted.toString().trim();
    }

    private int extractAccountId(Account user) {
        if (user == null || user.getAccountId() == null || user.getAccountId() <= 0)
            throw new IllegalArgumentException("Invalid login session.");
        return user.getAccountId();
    }

    public void get(ActionRequest request, ActionResult response)
            throws IOException {
        bind(request);

        try {
            SessionState currentSession=request.session(false);
            if(currentSession==null || SessionUsers.from(currentSession.get("user")) == null) {
                response.error(401,"Please log in to view your profile."); return;
            }
            Account currentUser = SessionUsers.from(currentSession.get("user"));
            int accountId=extractAccountId(currentUser);
            String role=currentUser.getRole();

            ProfileDAO dao = use(new ProfileDAO());
            bssms_account.Profile profile = dao.getProfileByAccountId(accountId, role);

            PrintWriter out = response.writer();
            if (profile != null && profile.getUsername() != null) {
                response.status(200);
                out.print(gson.toJson(profile));
            } else {
                response.status(404);
                out.print("{\"message\": \"Profile not found!\"}");
            }
            out.flush();
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            response.status(400);
            response.writer().print("{\"message\": \"Invalid input data!\"}");
        }
    }

    public void post(ActionRequest request, ActionResult response) throws IOException {
        bind(request);

        PrintWriter out = response.writer();
        SessionState session = request.session(false);

        if (session == null || SessionUsers.from(session.get("user")) == null) {
            response.status(401);
            out.print("{\"message\": \"Invalid session! Please log in again.\"}");
            out.flush();
            return;
        }

        try {
            Account user = SessionUsers.from(session.get("user"));
            int accountId = extractAccountId(user);
            String role = user.getRole();
            String uri = request.uri();

            JsonObject jsonObject = gson.fromJson(request.bodyReader(), JsonObject.class);

            if (uri.endsWith("/change-password")) {
                String oldPassword = jsonObject.get("oldPassword").getAsString();
                String newPassword = jsonObject.get("newPassword").getAsString();

                if (newPassword == null || newPassword.length() < 6) {
                    response.status(400);
                    out.print("{\"message\": \"The new password must have at least 6 characters!\"}");
                    out.flush();
                    return;
                }
                if (oldPassword.equals(newPassword)) {
                    response.status(400);
                    out.print("{\"message\": \"The new password must be different from the current password!\"}");
                    out.flush();
                    return;
                }

                RegisterDAO authDao = use(new RegisterDAO());
                boolean isChanged = authDao.changePassword(
                        accountId,
                        PasswordUtil.hashMD5(oldPassword),
                        PasswordUtil.hashMD5(newPassword)
                );

                if (isChanged) {
                    response.status(200);
                    out.print("{\"message\": \"Password changed successfully!\"}");
                } else {
                    response.status(400);
                    out.print("{\"message\": \"The current password is incorrect!\"}");
                }
                out.flush();
                return;
            }

            ProfileDAO dao = use(new ProfileDAO());
            RegisterDAO authDao = use(new RegisterDAO());
            String action = jsonObject.has("action") ? jsonObject.get("action").getAsString() : "";

            if (uri.endsWith("/update-profile") && "send-email-code".equals(action)) {
                if (!"Customer".equals(role)) {
                    response.status(403);
                    out.print("{\"message\": \"Only customers can change their email here!\"}");
                    out.flush();
                    return;
                }

                String newEmail = jsonObject.has("email") ? jsonObject.get("email").getAsString().trim() : "";
                if (!newEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                    response.status(400);
                    out.print("{\"message\": \"Invalid new email format!\"}");
                    out.flush();
                    return;
                }

                String duplicateField = dao.checkDuplicate(null, newEmail, null, accountId);
                if (duplicateField != null) {
                    response.status(409);
                    out.print("{\"message\": \"" + duplicateField + " is already used by another account!\"}");
                    out.flush();
                    return;
                }

                String otp = EmailUtil.generateOTP();
                if (!authDao.saveEmailChangeCode(bssms_common.LoginIdentity.customerId(accountId), newEmail, otp)) {
                    response.status(500);
                    out.print("{\"message\": \"Could not create a verification code. Please try again!\"}");
                    out.flush();
                    return;
                }

                EmailUtil.sendOTP(newEmail, otp, "[BSSMS] Email change verification code");
                response.status(200);
                out.print("{\"message\": \"A verification code has been sent to your new email!\"}");
                out.flush();
                return;
            }

            String fullName = jsonObject.get("fullName").getAsString().trim();
            String phone = jsonObject.get("phone").getAsString().trim();

            if (fullName.split("\\s+").length < 2) {
                response.status(400);
                out.print("{\"message\": \"Full name must have at least 2 words!\"}");
                out.flush();
                return;
            }
            if (!phone.matches("^0[1-9]\\d{8}$")) {
                response.status(400);
                out.print("{\"message\": \"Invalid phone number (10 digits, starting with 0, second digit not 0)!\"}");
                out.flush();
                return;
            }

            String standardizedName = formatFullName(fullName);

            if (uri.endsWith("/update-profile")) {
                String username = jsonObject.has("username") ? jsonObject.get("username").getAsString().trim() : "";
                if (username.length() < 3 || username.contains(" ")) {
                    response.status(400);
                    out.print("{\"message\": \"The username must have at least 3 characters and no spaces!\"}");
                    out.flush();
                    return;
                }

                bssms_account.Profile currentProfile = dao.getProfileByAccountId(accountId, role);
                String currentEmail = currentProfile.getEmail() != null ? currentProfile.getEmail().toString().trim() : "";
                String newEmail = jsonObject.has("email") ? jsonObject.get("email").getAsString().trim() : currentEmail;

                boolean isEmailChanged = "Customer".equals(role) && !newEmail.equalsIgnoreCase(currentEmail);

                if (isEmailChanged) {
                    if (!newEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                        response.status(400);
                        out.print("{\"message\": \"Invalid new email format!\"}");
                        out.flush();
                        return;
                    }
                }

                String duplicateField = dao.checkDuplicate(
                        username,
                        "Customer".equals(role) ? newEmail : null,
                        phone,
                        accountId
                );
                if (duplicateField != null) {
                    response.status(409);
                    out.print("{\"message\": \"" + duplicateField + " is already used by someone else!\"}");
                    out.flush();
                    return;
                }

                if (isEmailChanged) {
                    String verificationCode = jsonObject.has("verificationCode")
                            ? jsonObject.get("verificationCode").getAsString().trim()
                            : "";
                    if (verificationCode.isEmpty() || !authDao.verifyEmailChangeCode(bssms_common.LoginIdentity.customerId(accountId), newEmail, verificationCode)) {
                        response.status(400);
                        out.print("{\"message\": \"The email verification code is incorrect or has expired!\"}");
                        out.flush();
                        return;
                    }
                }

                boolean isUpdated;
                if ("Customer".equals(role)) {
                    String dob = jsonObject.get("dob").getAsString();
                    { String dobError = bssms_controller.common.InputValidation.birthDateError(dob); if (dobError != null) { response.error(400, dobError); return; } }
                    String gender = jsonObject.get("gender").getAsString();
                    String address = jsonObject.get("address").getAsString();
                    isUpdated = dao.updateCustomerProfile(accountId, standardizedName, dob, gender, phone, address, username, newEmail);
                } else {
                    isUpdated = dao.updateStaffProfile(accountId, standardizedName, phone, username);
                }

                if (isUpdated) {
                    if (isEmailChanged) {
                        authDao.clearEmailChangeCode(bssms_common.LoginIdentity.customerId(accountId));
                        user.setEmail(newEmail);
                    }
                    user.setFullName(standardizedName);
                    user.setUsername(username);
                    session.set("user", user);
                    response.status(200);
                    out.print(gson.toJson(user));
                } else {
                    response.status(500);
                    out.print("{\"message\": \"Could not save the information. Please try again!\"}");
                }
                out.flush();
                return;
            }

            String dob = jsonObject.get("dob").getAsString();
            { String dobError = bssms_controller.common.InputValidation.birthDateError(dob); if (dobError != null) { response.error(400, dobError); return; } }
            String gender = jsonObject.get("gender").getAsString();
            String address = jsonObject.get("address").getAsString();

            String duplicateField = dao.checkDuplicate(null, null, phone, accountId);
            if (duplicateField != null) {
                response.status(409);
                out.print("{\"message\": \"" + duplicateField + " is already used by another account!\"}");
                out.flush();
                return;
            }

            boolean isCreated = dao.createCustomerProfile(accountId, standardizedName, dob, gender, phone, address);
            if (isCreated) {
                user.setRole("Customer");
                user.setFullName(standardizedName);
                session.set("user", user);
                response.status(200);
                out.print(gson.toJson(user));
            } else {
                response.status(500);
                out.print("{\"message\": \"Could not save the information. Please try again!\"}");
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            response.status(400);
            out.print("{\"message\": \"Invalid input data!\"}");
            
        }
        out.flush();
    }
}
