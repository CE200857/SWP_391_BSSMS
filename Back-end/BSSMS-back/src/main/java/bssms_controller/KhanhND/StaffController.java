package bssms_controller.KhanhND;

import bssms_account.Staff;
import bssms_controller.common.ActionRequest;
import bssms_controller.common.ActionResult;
import bssms_controller.common.ControllerSupport;
import bssms_controller.common.InputValidation;
import bssms_persistence.KhanhND.StaffDAO;
import bssms_persistence.common.DataAccessException;
import bssms_security.PasswordUtil;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

// Manage Staff Accounts (view, create, update, delete, assign role)
public class StaffController extends ControllerSupport {

    private static final String PHONE_REGEX = "^0[1-9]\\d{8}$";
    private static final String EMAIL_REGEX = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

    private final Gson gson = new Gson();

    // View Staff Account
    public void get(ActionRequest request, ActionResult response) throws IOException {
        bind(request);
        StaffDAO dao = use(new StaffDAO());

        // get the skill of the technician
        String skillsOf = request.parameter("skillsOf");
        if (skillsOf != null && !skillsOf.isBlank()) {
            int staffId = Integer.parseInt(skillsOf.trim());
            response.writer().print(gson.toJson(dao.getSkills(staffId)));
            return;
        }

        // No id then return all staff
        String idParam = request.parameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            List<Staff> staffList = dao.getAllStaffDetails();
            response.writer().print(gson.toJson(staffList));
            return;
        }

        try {
            int staffId = Integer.parseInt(idParam);
            Staff staff = dao.getStaffById(staffId);
            if (staff.getStaffId() == null) {
                sendMessage(response, 404, "Staff member not found");
                return;
            }
            response.writer().print(gson.toJson(staff));
        } catch (NumberFormatException e) {
            sendMessage(response, 400, "Invalid staff ID");
        }
    }

    // Delete Staff Account (soft delete, history is kept)
    public void delete(ActionRequest request, ActionResult response) throws IOException {
        bind(request);

        try {
            int staffId = Integer.parseInt(request.parameter("id"));
            StaffDAO dao = use(new StaffDAO());

            JsonObject result = new JsonObject();
            if (!dao.deleteStaff(staffId)) {
                result.addProperty("message", "Staff member to delete not found");
                result.addProperty("status", 400);
                response.status(400);
                response.writer().print(result.toString());
                return;
            }

            result.addProperty("message", "Staff member deleted. Their history is kept.");
            result.addProperty("status", 200);
            response.writer().print(result.toString());
        } catch (NumberFormatException e) {
            sendMessage(response, 400, "Missing or invalid Staff ID");
        }
    }

    // Create / update staff based on "action", or assign role (/assign-role)
    public void post(ActionRequest request, ActionResult response) throws IOException {
        bind(request);

        try {
            StaffDAO dao = use(new StaffDAO());

            if (request.uri().contains("/assign-role")) {
                assignRole(request, dao, response);
                return;
            }

            JsonObject json = gson.fromJson(request.bodyReader(), JsonObject.class);
            String action = "";
            if (json.has("action")) {
                action = json.get("action").getAsString();
            }

            if (action.equals("save-skills")) {
                saveSkills(json, dao, response);
            } else if (action.equals("update-status")) {
                updateStatus(json, dao, response);
            } else if (action.equals("update")) {
                updateStaff(json, dao, response);
            } else if (action.equals("create")) {
                createStaff(json, dao, response);
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            sendMessage(response, 400, "Invalid input data!");
        }
    }

    // Assign Role (accountId and role are sent as URL parameters)
    private void assignRole(ActionRequest request, StaffDAO dao, ActionResult response) {
        String accountIdText = request.parameter("accountId");
        String role = request.parameter("role");
        if (accountIdText == null || role == null) {
            sendMessage(response, 400, "Incomplete data!");
            return;
        }

        int accountId = Integer.parseInt(accountIdText);
        if (!dao.assignRole(accountId, role)) {
            sendMessage(response, 500, "Error: Could not assign the role!");
            return;
        }

        sendMessage(response, 200, "Role assigned successfully!");
    }

    // Save services the technician can do
    private void saveSkills(JsonObject json, StaffDAO dao, ActionResult response) {
        int staffId = json.get("staffId").getAsInt();
        List<Integer> serviceIds = new ArrayList<>();
        JsonArray array = json.getAsJsonArray("serviceIds");
        for (JsonElement item : array) {
            serviceIds.add(item.getAsInt());
        }

        dao.saveSkills(staffId, serviceIds);
        sendMessage(response, 200, "Technician skills saved.");
    }

    // Change staff status Active / Inactive
    private void updateStatus(JsonObject json, StaffDAO dao, ActionResult response) {
        int accountId = json.get("accountId").getAsInt();
        String status = json.get("status").getAsString();

        if (!isValidStatus(status)) {
            sendMessage(response, 400, "Invalid status.");
            return;
        }
        if (!dao.updateStaffStatus(accountId, status)) {
            sendMessage(response, 400, "Could not update the staff status!");
            return;
        }

        sendMessage(response, 200, "Status updated successfully!");
    }

    // Update Staff Account
    private void updateStaff(JsonObject json, StaffDAO dao, ActionResult response) {
        int accountId = json.get("accountId").getAsInt();
        String fullName = json.get("fullName").getAsString().trim();
        String email = json.get("email").getAsString().trim();
        String phone = json.get("phone").getAsString().trim();
        String username = json.get("username").getAsString().trim();
        String hireDate = getText(json, "hireDate");

        // Password is not trimmed. Empty password means keep old password
        String password = "";
        if (json.has("password")) {
            password = json.get("password").getAsString();
        }
        String hashedPassword = null;
        if (!password.isEmpty()) { // If new password is enter
            hashedPassword = PasswordUtil.hashMD5(password);
        }

        String infoError = validateStaffInfo(fullName, phone, email);
        if (infoError != null) {
            sendMessage(response, 400, infoError);
            return;
        }

        String duplicateField = dao.checkDuplicate(username, email, phone, accountId);
        if (duplicateField != null) {
            sendMessage(response, 409, duplicateField + " already exists in the system. Please choose different information!");
            return;
        }

        if (!dao.updateStaff(accountId, fullName, phone, email, hireDate, username, hashedPassword)) {
            sendMessage(response, 404, "Staff member not found.");
            return;
        }

        sendMessage(response, 200, "Staff updated successfully!");
    }

    // Create Staff Account
    private void createStaff(JsonObject json, StaffDAO dao, ActionResult response) {
        String fullName = json.get("fullName").getAsString().trim();
        String email = json.get("email").getAsString().trim();
        String phone = json.get("phone").getAsString().trim();
        String role = json.get("role").getAsString();
        String username = json.get("username").getAsString();
        String password = json.get("password").getAsString();
        String hireDate = getText(json, "hireDate");

        List<Integer> serviceIds = new ArrayList<>();
        if (json.has("serviceIds") && json.get("serviceIds").isJsonArray()) {
            JsonArray array = json.getAsJsonArray("serviceIds");
            for (JsonElement item : array) {
                serviceIds.add(item.getAsInt());
            }
        }

        String infoError = validateStaffInfo(fullName, phone, email);
        if (infoError != null) {
            sendMessage(response, 400, infoError);
            return;
        }
        if (!isValidRole(role)) {
            sendMessage(response, 400, "Invalid role.");
            return;
        }

        String duplicateField = dao.checkDuplicate(null, email, phone, null);
        if (duplicateField != null) {
            sendMessage(response, 409, duplicateField + " already exists in the system. Please choose different information!");
            return;
        }

        // Create new staff account and also return final username
        String finalUsername = dao.createStaff(username, password, email, phone, fullName, role, hireDate, serviceIds);

        JsonObject result = new JsonObject();
        result.addProperty("message", "Staff account created successfully!");
        result.addProperty("username", finalUsername);
        response.status(201);
        response.writer().print(result.toString());
    }

    private boolean isValidStatus(String status) {
        return status.equals("Active") || status.equals("Inactive");
    }

    // Check full name, phone and email, return error message or null if all correct
    private String validateStaffInfo(String fullName, String phone, String email) {
        if (fullName.isEmpty() || fullName.length() > 100) {
            return "Full name is required and must not exceed 100 characters.";
        }
        if (!phone.matches(PHONE_REGEX)) {
            return "Phone number must have 10 digits and start with 0.";
        }
        if (!email.matches(EMAIL_REGEX)) {
            return "Invalid email format.";
        }
        return null;
    }

    private boolean isValidRole(String role) {
        return role.equals("Manager") || role.equals("Receptionist") || role.equals("Technician");
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
