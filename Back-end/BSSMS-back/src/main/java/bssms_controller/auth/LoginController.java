package bssms_controller.auth;

import bssms_account.Account;
import bssms_controller.common.ActionRequest;
import bssms_controller.common.ActionResult;
import bssms_controller.common.ControllerSupport;
import bssms_controller.common.InputValidation;
import bssms_controller.common.SessionState;
import bssms_persistence.DatNT.RegisterDAO;
import bssms_persistence.common.DataAccessException;
import bssms_security.PasswordUtil;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import java.io.IOException;

// Login and Logout
public class LoginController extends ControllerSupport {

    private static final String EMAIL_REGEX = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
    private static final String PHONE_REGEX = "^0[1-9]\\d{8}$";

    private final Gson gson = new Gson();

    public void post(ActionRequest request, ActionResult response) throws IOException {
        bind(request);

        // Logout: delete session and return success
        if (request.uri().endsWith("/logout")) {
            SessionState session = request.session(false);
            if (session != null) {
                session.invalidate();
            }
            sendMessage(response, 200, "Logged out successfully");
            return;
        }

        // Login
        try {
            JsonObject json = gson.fromJson(request.bodyReader(), JsonObject.class);
            String identifier = json.get("email").getAsString().trim(); // Get email and phone also
            String password = json.get("password").getAsString();

            boolean isEmail = identifier.matches(EMAIL_REGEX);
            boolean isPhone = identifier.matches(PHONE_REGEX);
            if (!isEmail && !isPhone) {
                sendMessage(response, 400, "Please enter a valid email or phone number!");
                return;
            }

            String hashedPassword = PasswordUtil.hashMD5(password);
            RegisterDAO dao = use(new RegisterDAO());
            Account user = dao.authenticateUser(identifier, hashedPassword);

            if (user == null) {
                sendMessage(response, 401, "Incorrect email or password!");
                return;
            }
            // Only Active accounts can log in (block Inactive and Locked)
            if (!"Active".equals(user.getStatus())) {
                sendMessage(response, 403, "Your account is locked or not activated.");
                return;
            }

            // Save user to session
            SessionState session = request.session(true);
            session.set("user", user);

            response.status(200);
            response.writer().print(gson.toJson(user));
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            sendMessage(response, 400, "Invalid input data!");
        }
    }

    // Send message back to frontend JSON
    private void sendMessage(ActionResult response, int status, String message) {
        JsonObject json = new JsonObject();
        json.addProperty("message", message);
        response.status(status);
        response.writer().print(json.toString());
    }
}
