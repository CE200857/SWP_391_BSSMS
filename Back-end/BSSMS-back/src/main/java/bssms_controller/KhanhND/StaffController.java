package bssms_controller.KhanhND;

import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import bssms_persistence.KhanhND.StaffDAO;
import com.google.gson.Gson;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
public class StaffController extends ControllerSupport {

    private final Gson gson = new Gson();

    public void get(ActionRequest request, ActionResult response)
            throws IOException {

        StaffDAO dao = use(new StaffDAO());
        PrintWriter out = response.writer();

        String idParam = request.parameter("id");

        if (idParam != null && !idParam.trim().isEmpty()) {
            try {
                int staffId = Integer.parseInt(idParam);
                Map<String, Object> staff = dao.getStaffById(staffId);

                if (staff.isEmpty()) {
                    response.status(404);
                    out.print("{\"message\": \"Không tìm thấy nhân viên này\"}");
                } else {
                    out.print(gson.toJson(staff));
                }
            } catch (NumberFormatException e) {
                response.status(400);
                out.print("{\"message\": \"ID nhân viên không hợp lệ\"}");
            }
        } else {
            List<Map<String, Object>> staffList = dao.getAllStaffDetails();
            out.print(gson.toJson(staffList));
        }
        out.flush();
    }

    public void delete(ActionRequest request, ActionResult response)
            throws IOException {

        try {
            int staffId = Integer.parseInt(request.parameter("id"));

            StaffDAO dao = use(new StaffDAO());

            boolean isSuccess = dao.deactivateStaff(staffId);

            PrintWriter out = response.writer();

            if (isSuccess) {
                out.print("{\"message\":\"Vô hiệu hóa tài khoản nhân viên thành công\",\"status\":200}");
            } else {
                response.status(400);
                out.print("{\"message\":\"Không tìm thấy nhân viên để xóa\",\"status\":400}");
            }

            out.flush();

        } catch (NumberFormatException e) {

            response.status(400);

            response.writer().print(
                    "{\"message\":\"Thiếu hoặc sai định dạng Staff ID\"}"
            );
        }
    }

    public void post(ActionRequest request, ActionResult response)
            throws IOException {

        String pathInfo = request.uri();
        PrintWriter out = response.writer();

        if (pathInfo != null && pathInfo.contains("/assign-role")) {
            try {
                String accountIdStr = request.parameter("accountId");
                String role = request.parameter("role");

                if (accountIdStr == null || role == null) {
                    response.status(400);
                    out.print("{\"message\": \"Dữ liệu không đầy đủ!\"}");
                    out.flush();
                    return;
                }

                int accountId = Integer.parseInt(accountIdStr);
                StaffDAO dao = use(new StaffDAO());
                boolean isAssigned = dao.assignRole(accountId, role);

                if (isAssigned) {
                    response.status(200);
                    out.print("{\"message\": \"Phân quyền thành công!\"}");
                } else {
                    response.status(500);
                    out.print("{\"message\": \"Lỗi: Không thể phân quyền!\"}");
                }
            } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
                response.status(400);
                out.print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
                
            }
            out.flush();
        } else {
            try {
                com.google.gson.JsonObject jsonObject = gson.fromJson(request.bodyReader(), com.google.gson.JsonObject.class);
                String action = jsonObject.has("action") ? jsonObject.get("action").getAsString() : null;
                
                if ("update".equals(action)) {
                    int accountId = jsonObject.get("accountId").getAsInt();
                    String fullName = jsonObject.get("fullName").getAsString().trim();
                    String email = jsonObject.get("email").getAsString().trim();
                    String phone = jsonObject.get("phone").getAsString().trim();
                    String role = jsonObject.get("role").getAsString();
                    String username = jsonObject.get("username").getAsString().trim();
                    String hireDate = jsonObject.has("hireDate") ? jsonObject.get("hireDate").getAsString() : null;
                    double salary = jsonObject.has("salary") ? jsonObject.get("salary").getAsDouble() : 0;
                    
                    String rawPassword = jsonObject.has("password") ? jsonObject.get("password").getAsString() : "";
                    String hashedPassword = null;
                    if (!rawPassword.isEmpty()) {
                         hashedPassword = bssms_security.PasswordUtil.hashMD5(rawPassword);
                    }
                    
                    StaffDAO dao = use(new StaffDAO());
                    
                    String duplicateField = dao.checkDuplicate(username, email, phone, accountId);
                    if (duplicateField != null) {
                        response.status(409);
                        out.print("{\"message\": \"" + duplicateField + " này đã tồn tại trên hệ thống. Vui lòng chọn thông tin khác!\"}");
                        out.flush();
                        return;
                    }
                    
                    boolean success = dao.updateStaff(accountId, fullName, phone, email, role, hireDate, salary, username, hashedPassword);
                    
                    if (success) {
                        response.status(200);
                        out.print("{\"message\": \"Cập nhật nhân viên thành công!\"}");
                    } else {
                        response.status(500);
                        out.print("{\"message\": \"Lỗi: Không thể lưu cập nhật vào cơ sở dữ liệu.\"}");
                    }
                }

                if ("create".equals(action)) {
                    String fullName = jsonObject.get("fullName").getAsString().trim();
                    String email = jsonObject.get("email").getAsString().trim();
                    String phone = jsonObject.get("phone").getAsString().trim();
                    String role = jsonObject.get("role").getAsString();
                    String username = jsonObject.get("username").getAsString();
                    String password = jsonObject.get("password").getAsString();
                    double salary = jsonObject.has("salary") ? jsonObject.get("salary").getAsDouble() : 0;
                    
                    StaffDAO dao = use(new StaffDAO());
                    
                    String duplicateField = dao.checkDuplicate(null, email, phone, null);
                    
                    if (duplicateField != null) {
                        response.status(409);
                        out.print("{\"message\": \"" + duplicateField + " này đã tồn tại trên hệ thống. Vui lòng chọn thông tin khác!\"}");
                        out.flush();
                        return;
                    }
                    
                    String finalUsername = dao.createStaff(username, password, email, phone, fullName, role, salary);
                    
                    if (finalUsername != null) {
                        response.status(201);
                        out.print("{\"message\": \"Tạo tài khoản nhân viên thành công!\", \"username\": \"" + finalUsername + "\"}");
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
}
