package bssms_controller.DatNT;

import bssms_account.Customer;
import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import com.google.gson.Gson;
import bssms_persistence.DatNT.CustomerDAO;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

public class CustomerController extends ControllerSupport {

    private final Gson gson = new Gson();

    public void get(ActionRequest request, ActionResult response)
            throws IOException {
        bind(request);

        CustomerDAO dao = use(new CustomerDAO());
        PrintWriter out = response.writer();

        String idParam = request.parameter("id");

        if (idParam != null && !idParam.trim().isEmpty()) {
            try {
                int customerId = Integer.parseInt(idParam);
                Customer customer = dao.getCustomerById(customerId);
                out.print(this.gson.toJson(customer));
            } catch (NumberFormatException e) {
                response.status(400);
                out.print("{\"message\": \"Invalid ID\"}");
            }
        } else {
            List<Customer> customers = dao.getAllCustomerDetails();
            out.print(this.gson.toJson(customers));
        }

        out.flush();
    }

    public void delete(ActionRequest request, ActionResult response)
            throws IOException {
        bind(request);

        try {
            int customerId = Integer.parseInt(request.parameter("id"));
            CustomerDAO dao = use(new CustomerDAO());
            dao.deleteCustomer(customerId);

            PrintWriter out = response.writer();
            out.print("{\"message\": \"Customer deleted. Their history is kept.\", \"status\": 200}");
            out.flush();
        } catch (NumberFormatException e) {
            response.status(400);
            response.writer().print("{\"message\": \"Missing or invalid ID\"}");
        }
    }

    public void post(ActionRequest request, ActionResult response)
            throws IOException {
        bind(request);

        PrintWriter out = response.writer();
        try {
            com.google.gson.JsonObject jsonObject = gson.fromJson(request.bodyReader(), com.google.gson.JsonObject.class);
            CustomerDAO dao = use(new CustomerDAO());

            String action = jsonObject.has("action") ? jsonObject.get("action").getAsString() : null;

            if ("walkInProfile".equals(action)) {
                String fullName = InputValidation.text(
                        jsonObject.has("fullName") ? jsonObject.get("fullName").getAsString() : null,
                        "Full name");
                String phone = InputValidation.text(
                        jsonObject.has("phone") ? jsonObject.get("phone").getAsString() : null,
                        "Phone number");
                String gender = InputValidation.text(
                        jsonObject.has("gender") ? jsonObject.get("gender").getAsString() : null,
                        "Gender");

                if (fullName.length() > 100) {
                    throw new IllegalArgumentException("Full name must not exceed 100 characters.");
                }
                if (!phone.matches("0[1-9]\\d{8}")) {
                    throw new IllegalArgumentException("Phone number must have 10 digits and start with 0.");
                }
                if (!java.util.Arrays.asList("Female", "Male", "Other").contains(gender)) {
                    throw new IllegalArgumentException("Invalid gender.");
                }

                int customerId = dao.createWalkInProfile(fullName, phone, gender);
                response.status(201);
                out.print(gson.toJson(java.util.Map.of(
                        "customerId", customerId,
                        "fullName", fullName,
                        "phone", phone)));
            } else if ("update-status".equals(action)) {
                // Bấm nhãn trạng thái ở danh sách khách: chỉ đổi Active <-> Inactive
                int customerId = jsonObject.get("customerId").getAsInt();
                String status = jsonObject.get("status").getAsString();
                if (!"Active".equals(status) && !"Inactive".equals(status)) {
                    response.status(400);
                    out.print("{\"message\": \"Invalid status.\"}");
                } else if (dao.updateCustomerStatus(customerId, status)) {
                    response.status(200);
                    out.print("{\"message\": \"Customer status changed to " + status + ".\"}");
                } else {
                    response.status(404);
                    out.print("{\"message\": \"Customer not found.\"}");
                }
            } else if ("update".equals(action)) {
                int accountId = jsonObject.get("accountId").getAsInt();
                String fullName = jsonObject.get("fullName").getAsString().trim();
                String phone = jsonObject.get("phone").getAsString().trim();
                String email = jsonObject.has("email") ? jsonObject.get("email").getAsString().trim() : "";
                String gender = jsonObject.has("gender") ? jsonObject.get("gender").getAsString() : "";
                String dob = jsonObject.has("dob") ? jsonObject.get("dob").getAsString() : null;
                { String dobError = bssms_controller.common.InputValidation.birthDateError(dob); if (dobError != null) { response.error(400, dobError); return; } }
                String address = jsonObject.has("address") ? jsonObject.get("address").getAsString() : "";
                String status = jsonObject.has("status") ? jsonObject.get("status").getAsString() : "Active";

                String duplicateField = dao.checkDuplicate(null, email, phone, accountId);

                if (duplicateField != null) {
                    response.status(409);
                    out.print("{\"message\": \"" + duplicateField + " already exists in the system. Please check again!\"}");
                    out.flush();
                    return;
                }

                boolean success = dao.updateCustomer(accountId, fullName, phone, email, gender, dob, address, status);

                if (success) {
                    response.status(200);
                    out.print("{\"message\": \"Information updated successfully!\"}");
                } else {
                    response.status(500);
                    out.print("{\"message\": \"Update failed.\"}");
                }

            } else {
                String fullName = jsonObject.get("fullName").getAsString().trim();
                String email = jsonObject.has("email") ? jsonObject.get("email").getAsString().trim() : "";
                String phone = jsonObject.get("phone").getAsString().trim();
                String dob = jsonObject.has("dob") ? jsonObject.get("dob").getAsString() : null;
                { String dobError = bssms_controller.common.InputValidation.birthDateError(dob); if (dobError != null) { response.error(400, dobError); return; } }
                String gender = jsonObject.get("gender").getAsString();
                String username = jsonObject.get("username").getAsString();
                String password = jsonObject.get("password").getAsString();

                String duplicateField = dao.checkDuplicate(null, email, phone, null);

                if (duplicateField != null) {
                    response.status(409);
                    out.print("{\"message\": \"" + duplicateField + " already exists in the system. Please check again!\"}");
                    out.flush();
                    return;
                }

                boolean success = dao.createWalkInCustomer(username, password, email, phone, fullName, dob, gender);

                if (success) {
                    response.status(201);
                    out.print("{\"message\": \"Customer account created successfully!\"}");
                } else {
                    response.status(500);
                    out.print("{\"message\": \"Error: Could not save to the database.\"}");
                }
            }

        } catch (bssms_persistence.common.WorkflowException e) {
            response.status(e.status);
            out.print(gson.toJson(java.util.Map.of("message", e.getMessage())));
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            response.status(400);
            out.print("{\"message\": \"Invalid input data!\"}");
            
        }
        out.flush();
    }
}
