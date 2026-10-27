package bssms_controller.HienLNM;

import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import com.google.gson.Gson;
import bssms_persistence.HienLNM.BirthdayMonthPromotionDAO;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
public class BirthdayMonthPromotionController extends ControllerSupport {

    private final Gson gson = new Gson();

    public void get(ActionRequest request, ActionResult response)
            throws IOException {
        bind(request);

        BirthdayMonthPromotionDAO dao = use(new BirthdayMonthPromotionDAO());
        PrintWriter out = response.writer();

        String idParam = request.parameter("id");
        String action = request.parameter("action");

        // DEBUG: In ra tất cả parameters

        try {
            if ("birthday-customers".equals(action)) {
                // Lấy danh sách khách hàng có sinh nhật trong tháng hiện tại (chưa có voucher sinh nhật năm nay)
                List<Map<String, Object>> customers = dao.getBirthdayCustomersThisMonth();
                out.print(this.gson.toJson(customers));
            } else if ("all-customers".equals(action)) {
                // Lấy tất cả khách hàng (để chọn tạo voucher sinh nhật)
                List<Map<String, Object>> customers = dao.getAllCustomersForBirthdayVoucher();
                out.print(this.gson.toJson(customers));
            } else if (idParam != null && !idParam.trim().isEmpty()) {
                // Lấy voucher sinh nhật theo ID
                int voucherId = Integer.parseInt(idParam);
                Map<String, Object> voucher = dao.getBirthdayVoucherById(voucherId);
                out.print(this.gson.toJson(voucher));
            } else {
                // Lấy tất cả voucher sinh nhật
                List<Map<String, Object>> vouchers = dao.getAllBirthdayVouchers();
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
            BirthdayMonthPromotionDAO dao = use(new BirthdayMonthPromotionDAO());

            String action = jsonObject.has("action") ? jsonObject.get("action").getAsString() : null;

            if ("bulk".equals(action)) {
                // Tạo voucher sinh nhật hàng loạt
                double discountPercent = 10;
                InputValidation.percent(discountPercent);
                int count = dao.createBulkBirthdayVouchers(discountPercent);
                out.print("{\"message\": \"Đã tạo " + count + " voucher sinh nhật thành công!\", \"count\": " + count + "}");
            } else if ("create".equals(action)) {
                // Tạo voucher sinh nhật cho 1 khách hàng
                int customerId = jsonObject.get("customerId").getAsInt();
                String voucherName = jsonObject.get("voucherName").getAsString();
                double discountPercent = 10;
                String startDate = jsonObject.get("startDate").getAsString();
                String endDate = jsonObject.get("endDate").getAsString();

                InputValidation.percent(discountPercent);
                InputValidation.dates(startDate,endDate);
                InputValidation.positive(customerId,"customerId");
                boolean success = dao.createBirthdayVoucher(customerId, voucherName, discountPercent, startDate, endDate);
                if (success) {
                    out.print("{\"message\": \"Tạo voucher sinh nhật thành công!\"}");
                } else {
                    response.status(500);
                    out.print("{\"message\": \"Tạo voucher sinh nhật thất bại!\"}");
                }
            } else {
                response.status(400);
                out.print("{\"message\": \"Action không hợp lệ!\"}");
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            response.status(400);
            out.print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
            
        }
        out.flush();
    }

    public void put(ActionRequest request, ActionResult response)
            throws IOException {
        bind(request);

        PrintWriter out = response.writer();
        try {
            com.google.gson.JsonObject jsonObject = gson.fromJson(request.bodyReader(), com.google.gson.JsonObject.class);
            BirthdayMonthPromotionDAO dao = use(new BirthdayMonthPromotionDAO());

            int voucherId = jsonObject.get("voucherId").getAsInt();
            String voucherName = jsonObject.get("voucherName").getAsString();
            double discountPercent = 10;
            String startDate = jsonObject.get("startDate").getAsString();
            String endDate = jsonObject.get("endDate").getAsString();
            String status = jsonObject.has("status") ? jsonObject.get("status").getAsString() : "Active";

            InputValidation.percent(discountPercent);
            InputValidation.dates(startDate,endDate);
            InputValidation.positive(voucherId,"voucherId");
            boolean success = dao.updateBirthdayVoucher(voucherId, voucherName, discountPercent, startDate, endDate, status);
            if (success) {
                out.print("{\"message\": \"Cập nhật voucher sinh nhật thành công!\"}");
            } else {
                response.status(500);
                out.print("{\"message\": \"Cập nhật voucher sinh nhật thất bại!\"}");
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
            BirthdayMonthPromotionDAO dao = use(new BirthdayMonthPromotionDAO());
            boolean success = dao.deleteBirthdayVoucher(voucherId);

            if (success) {
                out.print("{\"message\": \"Xóa voucher sinh nhật thành công!\"}");
            } else {
                response.status(400);
                out.print("{\"message\": \"Không tìm thấy voucher sinh nhật để xóa!\"}");
            }
        } catch (NumberFormatException e) {
            response.status(400);
            out.print("{\"message\": \"ID không hợp lệ!\"}");
        }
        out.flush();
    }
}
