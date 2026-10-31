package bssms_controller.HienLNM;

import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import com.google.gson.Gson;
import bssms_persistence.HienLNM.VoucherDAO;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
public class VoucherController extends ControllerSupport {

    private final Gson gson = new Gson();

    public void get(ActionRequest request, ActionResult response)
            throws IOException {
        bind(request);

        VoucherDAO dao = use(new VoucherDAO());
        PrintWriter out = response.writer();

        String idParam = request.parameter("id");

        try {
            if (idParam != null && !idParam.trim().isEmpty()) {
                int voucherId = Integer.parseInt(idParam);
                Map<String, Object> voucher = dao.getVoucherById(voucherId);
                out.print(this.gson.toJson(voucher));
            } else {
                List<Map<String, Object>> vouchers = dao.getAllVouchers();
                out.print(this.gson.toJson(vouchers));
            }
        } catch (NumberFormatException e) {
            response.status(400);
            out.print("{\"message\": \"ID không hợp lệ\"}");
        }
        out.flush();
    }

    public void post(ActionRequest request, ActionResult response)
            throws IOException {
        bind(request);

        PrintWriter out = response.writer();
        try {
            com.google.gson.JsonObject jsonObject = gson.fromJson(request.bodyReader(), com.google.gson.JsonObject.class);
            VoucherDAO dao = use(new VoucherDAO());

            String action = jsonObject.has("action") ? jsonObject.get("action").getAsString() : null;

            if ("update".equals(action)) {
                int voucherId = jsonObject.get("voucherId").getAsInt();
                Integer customerId = jsonObject.has("customerId") && !jsonObject.get("customerId").isJsonNull() 
                                    ? jsonObject.get("customerId").getAsInt() : null;
                String voucherCode = jsonObject.get("voucherCode").getAsString();
                String voucherName = jsonObject.get("voucherName").getAsString();
                String discountType = jsonObject.get("discountType").getAsString();
                double discountValue = jsonObject.get("discountValue").getAsDouble();
                String startDate = jsonObject.get("startDate").getAsString();
                String endDate = jsonObject.get("endDate").getAsString();
                String status = jsonObject.has("status") ? jsonObject.get("status").getAsString() : "Active";

                if (dao.isVoucherCodeExists(voucherCode, voucherId)) {
                    response.status(409);
                    out.print("{\"message\": \"Mã voucher đã tồn tại!\"}");
                    out.flush();
                    return;
                }

                boolean success = dao.updateVoucher(voucherId, customerId, voucherCode, voucherName, 
                                                    discountType, discountValue, startDate, endDate, status);
                if (success) {
                    out.print("{\"message\": \"Cập nhật voucher thành công!\"}");
                } else {
                    response.status(500);
                    out.print("{\"message\": \"Cập nhật voucher thất bại!\"}");
                }
            } else {
                // Create voucher
                Integer customerId = jsonObject.has("customerId") && !jsonObject.get("customerId").isJsonNull() 
                                    ? jsonObject.get("customerId").getAsInt() : null;
                String voucherCode = jsonObject.get("voucherCode").getAsString();
                String voucherName = jsonObject.get("voucherName").getAsString();
                String discountType = jsonObject.get("discountType").getAsString();
                double discountValue = jsonObject.get("discountValue").getAsDouble();
                String startDate = jsonObject.get("startDate").getAsString();
                String endDate = jsonObject.get("endDate").getAsString();

                if (dao.isVoucherCodeExists(voucherCode, null)) {
                    response.status(409);
                    out.print("{\"message\": \"Mã voucher đã tồn tại!\"}");
                    out.flush();
                    return;
                }

                boolean success = dao.createVoucher(customerId, voucherCode, voucherName, 
                                                   discountType, discountValue, startDate, endDate);
                if (success) {
                    out.print("{\"message\": \"Tạo voucher thành công!\"}");
                } else {
                    response.status(500);
                    out.print("{\"message\": \"Tạo voucher thất bại!\"}");
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

    public void delete(ActionRequest request, ActionResult response)
            throws IOException {
        bind(request);

        PrintWriter out = response.writer();
        try {
            int voucherId = Integer.parseInt(request.parameter("id"));
            VoucherDAO dao = use(new VoucherDAO());
            boolean success = dao.deleteVoucher(voucherId);

            if (success) {
                out.print("{\"message\": \"Xóa voucher thành công!\"}");
            } else {
                response.status(400);
                out.print("{\"message\": \"Không tìm thấy voucher để xóa!\"}");
            }
        } catch (NumberFormatException e) {
            response.status(400);
            out.print("{\"message\": \"ID không hợp lệ!\"}");
        }
        out.flush();
    }
}
