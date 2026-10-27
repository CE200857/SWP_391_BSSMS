package bssms_controller.DatNT;

import bssms_account.Customer;
import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import com.google.gson.Gson;
import bssms_persistence.DatNT.CustomerDAO;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

/**
 *
 * @author Nguyen Tien Dat - CE200858
 */

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
                out.print("{\"message\": \"ID không hợp lệ\"}");
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
            boolean isSuccess = dao.deactivateCustomer(customerId);

            PrintWriter out = response.writer();
            if (isSuccess) {
                out.print("{\"message\": \"Hủy/Vô hiệu hóa tài khoản thành công\", \"status\": 200}");
            } else {
                response.status(400);
                out.print("{\"message\": \"Không tìm thấy tài khoản để xóa\", \"status\": 400}");
            }
            out.flush();
        } catch (NumberFormatException e) {
            response.status(400);
            response.writer().print("{\"message\": \"Thiếu hoặc sai định dạng ID\"}");
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

            if ("update".equals(action)) {
                int accountId = jsonObject.get("accountId").getAsInt();
                String fullName = jsonObject.get("fullName").getAsString().trim();
                String phone = jsonObject.get("phone").getAsString().trim();
                String email = jsonObject.has("email") ? jsonObject.get("email").getAsString().trim() : "";
                String gender = jsonObject.has("gender") ? jsonObject.get("gender").getAsString() : "";
                String dob = jsonObject.has("dob") ? jsonObject.get("dob").getAsString() : null;
                String address = jsonObject.has("address") ? jsonObject.get("address").getAsString() : "";
                String status = jsonObject.has("status") ? jsonObject.get("status").getAsString() : "Active";

                String duplicateField = dao.checkDuplicate(null, email, phone, accountId);

                if (duplicateField != null) {
                    response.status(409);
                    out.print("{\"message\": \"" + duplicateField + " này đã tồn tại trên hệ thống. Vui lòng kiểm tra lại!\"}");
                    out.flush();
                    return;
                }

                boolean success = dao.updateCustomer(accountId, fullName, phone, email, gender, dob, address, status);

                if (success) {
                    response.status(200);
                    out.print("{\"message\": \"Cập nhật thông tin thành công!\"}");
                } else {
                    response.status(500);
                    out.print("{\"message\": \"Cập nhật thất bại.\"}");
                }

            } else {
                String fullName = jsonObject.get("fullName").getAsString().trim();
                String email = jsonObject.has("email") ? jsonObject.get("email").getAsString().trim() : "";
                String phone = jsonObject.get("phone").getAsString().trim();
                String dob = jsonObject.has("dob") ? jsonObject.get("dob").getAsString() : null;
                String gender = jsonObject.get("gender").getAsString();
                String username = jsonObject.get("username").getAsString();
                String password = jsonObject.get("password").getAsString();

                String duplicateField = dao.checkDuplicate(null, email, phone, null);

                if (duplicateField != null) {
                    response.status(409);
                    out.print("{\"message\": \"" + duplicateField + " này đã tồn tại trên hệ thống. Vui lòng kiểm tra lại!\"}");
                    out.flush();
                    return;
                }

                boolean success = dao.createWalkInCustomer(username, password, email, phone, fullName, dob, gender);

                if (success) {
                    response.status(201);
                    out.print("{\"message\": \"Tạo tài khoản khách hàng thành công!\"}");
                } else {
                    response.status(500);
                    out.print("{\"message\": \"Lỗi: Không thể lưu vào cơ sở dữ liệu.\"}");
                }
            }

        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            response.status(400);
            out.print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
            
        }
        out.flush();
    }
}
