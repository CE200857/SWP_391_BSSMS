package bssms_controller.DatNT;

import bssms_account.Customer;
import bssms_controller.common.ActionRequest;
import bssms_controller.common.ActionResult;
import bssms_controller.common.ControllerSupport;
import bssms_controller.common.InputValidation;
import bssms_persistence.DatNT.CustomerDAO;
import bssms_persistence.common.DataAccessException;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import java.io.IOException;
import java.util.List;

// Manage Customer Accounts (view, create, update, delete)
public class CustomerController extends ControllerSupport {

    private static final String PHONE_REGEX = "^0[1-9]\\d{8}$";

    private final Gson gson = new Gson();

    // View customer list, or one customer if ?id= is given
    public void get(ActionRequest request, ActionResult response) throws IOException {
        bind(request);
        CustomerDAO dao = use(new CustomerDAO());

        String idParam = request.parameter("id"); // Get the id at the end of url
        if (idParam == null || idParam.trim().isEmpty()) { // If there's no id, return entire list
            List<Customer> customers = dao.getAllCustomerDetails();
            response.writer().print(gson.toJson(customers));
            return;
        }

        try { // Return the only account with that id
            int customerId = Integer.parseInt(idParam);
            Customer customer = dao.getCustomerById(customerId);
            response.writer().print(gson.toJson(customer));
        } catch (NumberFormatException e) {
            sendMessage(response, 400, "Invalid ID");
        }
    }

    // Soft delete customer (history is kept)
    public void delete(ActionRequest request, ActionResult response) throws IOException {
        bind(request);

        try {
            int customerId = Integer.parseInt(request.parameter("id"));
            CustomerDAO dao = use(new CustomerDAO());
            dao.deleteCustomer(customerId);

            JsonObject result = new JsonObject();
            result.addProperty("message", "Customer deleted. Their history is kept.");
            result.addProperty("status", 200);
            response.writer().print(result.toString());
        } catch (NumberFormatException e) {
            sendMessage(response, 400, "Missing or invalid ID");
        }
    }

    // Create / update customer based on "action"
    public void post(ActionRequest request, ActionResult response) throws IOException {
        bind(request);

        try {
            JsonObject json = gson.fromJson(request.bodyReader(), JsonObject.class);
            CustomerDAO dao = use(new CustomerDAO());

            String action = "";
            if (json.has("action")) {
                action = json.get("action").getAsString();
            }

            if (action.equals("update-status")) {
                updateStatus(json, dao, response);
            } else if (action.equals("update")) {
                updateCustomer(json, dao, response);
            } else {
                createCustomer(json, dao, response);
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            sendMessage(response, 400, "Invalid input data!");
        }
    }

    // Status toggle in customer list: Active <-> Inactive only
    private void updateStatus(JsonObject json, CustomerDAO dao, ActionResult response) {
        int customerId = json.get("customerId").getAsInt();
        String status = json.get("status").getAsString();

        if (!isValidStatus(status)) {
            sendMessage(response, 400, "Invalid status.");
            return;
        }
        
        if (!dao.updateCustomerStatus(customerId, status)) {
            sendMessage(response, 404, "Customer not found.");
            return;
        }

        sendMessage(response, 200, "Customer status changed to " + status + ".");
    }

    // Update Customer Account
    private void updateCustomer(JsonObject json, CustomerDAO dao, ActionResult response) {
        int accountId = json.get("accountId").getAsInt();
        String fullName = json.get("fullName").getAsString().trim();
        String phone = json.get("phone").getAsString().trim();
        String email = getText(json, "email");
        String gender = getText(json, "gender");
        String dob = getText(json, "dob");
        String address = getText(json, "address");
        String status = getText(json, "status");

        String dobError = InputValidation.birthDateError(dob);
        if (dobError != null) {
            sendMessage(response, 400, dobError);
            return;
        }
        if (status != null && !isValidStatus(status)) {
            sendMessage(response, 400, "Invalid status.");
            return;
        }

        String duplicateField = dao.checkDuplicate(null, email, phone, accountId);
        if (duplicateField != null) {
            sendMessage(response, 409, duplicateField + " already exists in the system. Please check again!");
            return;
        }

        if (!dao.updateCustomer(accountId, fullName, phone, email, gender, dob, address, status)) {
            sendMessage(response, 404, "Customer not found.");
            return;
        }

        sendMessage(response, 200, "Information updated successfully!");
    }

    // Create Customer Account
    private void createCustomer(JsonObject json, CustomerDAO dao, ActionResult response) {
        String fullName = json.get("fullName").getAsString().trim();
        String phone = json.get("phone").getAsString().trim();
        String email = getText(json, "email");
        String dob = getText(json, "dob");
        String gender = json.get("gender").getAsString();
        String username = json.get("username").getAsString();
        String password = json.get("password").getAsString();

        String dobError = InputValidation.birthDateError(dob);
        if (dobError != null) {
            sendMessage(response, 400, dobError);
            return;
        }

        if (fullName.isEmpty() || fullName.length() > 100) {
            sendMessage(response, 400, "Full name is required and must not exceed 100 characters.");
            return;
        }

        if (!phone.matches(PHONE_REGEX)) {
            sendMessage(response, 400, "Phone number must have 10 digits and start with 0.");
            return;
        }

        if (!isValidGender(gender)) {
            sendMessage(response, 400, "Invalid gender.");
            return;
        }

        String duplicateField = dao.checkDuplicate(null, email, phone, null);
        if (duplicateField != null) {
            sendMessage(response, 409, duplicateField + " already exists in the system. Please check again!");
            return;
        }

        if (!dao.createWalkInCustomer(username, password, email, phone, fullName, dob, gender)) {
            sendMessage(response, 500, "Error: Could not save to the database.");
            return;
        }

        sendMessage(response, 201, "Customer account created successfully!");
    }

    private boolean isValidGender(String gender) {
        return gender.equals("Male") || gender.equals("Female") || gender.equals("Other");
    }

    private boolean isValidStatus(String status) {
        return status.equals("Active") || status.equals("Inactive");
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
