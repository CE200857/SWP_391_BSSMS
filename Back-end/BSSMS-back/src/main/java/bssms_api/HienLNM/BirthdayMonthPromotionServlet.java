package bssms_api.HienLNM;

import com.google.gson.Gson;
import bssms_persistence.HienLNM.BirthdayMonthPromotionDAO;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(name = "BirthdayMonthPromotionServlet", urlPatterns = {"/api/birthday-promotions"})
public class BirthdayMonthPromotionServlet extends HttpServlet {

    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setHeader("Access-Control-Allow-Credentials", "true");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        BirthdayMonthPromotionDAO dao = new BirthdayMonthPromotionDAO();
        PrintWriter out = response.getWriter();

        String idParam = request.getParameter("id");
        String action = request.getParameter("action");

        // DEBUG: In ra tất cả parameters
        System.out.println("=== BirthdayMonthPromotionServlet.doGet ===");
        System.out.println("idParam: " + idParam);
        System.out.println("action: " + action);
        System.out.println("requestURI: " + request.getRequestURI());
        System.out.println("queryString: " + request.getQueryString());
        System.out.println("==========================================");

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
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"ID không hợp lệ\"}");
        }
        out.flush();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();
        try {
            com.google.gson.JsonObject jsonObject = gson.fromJson(request.getReader(), com.google.gson.JsonObject.class);
            BirthdayMonthPromotionDAO dao = new BirthdayMonthPromotionDAO();

            String action = jsonObject.has("action") ? jsonObject.get("action").getAsString() : null;

            if ("bulk".equals(action)) {
                // Tạo voucher sinh nhật hàng loạt
                double discountPercent = jsonObject.get("discountPercent").getAsDouble();
                int count = dao.createBulkBirthdayVouchers(discountPercent);
                out.print("{\"message\": \"Đã tạo " + count + " voucher sinh nhật thành công!\", \"count\": " + count + "}");
            } else if ("create".equals(action)) {
                // Tạo voucher sinh nhật cho 1 khách hàng
                int customerId = jsonObject.get("customerId").getAsInt();
                String voucherName = jsonObject.get("voucherName").getAsString();
                double discountPercent = jsonObject.get("discountPercent").getAsDouble();
                String startDate = jsonObject.get("startDate").getAsString();
                String endDate = jsonObject.get("endDate").getAsString();

                boolean success = dao.createBirthdayVoucher(customerId, voucherName, discountPercent, startDate, endDate);
                if (success) {
                    out.print("{\"message\": \"Tạo voucher sinh nhật thành công!\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"message\": \"Tạo voucher sinh nhật thất bại!\"}");
                }
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Action không hợp lệ!\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
            e.printStackTrace();
        }
        out.flush();
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();
        try {
            com.google.gson.JsonObject jsonObject = gson.fromJson(request.getReader(), com.google.gson.JsonObject.class);
            BirthdayMonthPromotionDAO dao = new BirthdayMonthPromotionDAO();

            int voucherId = jsonObject.get("voucherId").getAsInt();
            String voucherName = jsonObject.get("voucherName").getAsString();
            double discountPercent = jsonObject.get("discountPercent").getAsDouble();
            String startDate = jsonObject.get("startDate").getAsString();
            String endDate = jsonObject.get("endDate").getAsString();
            String status = jsonObject.has("status") ? jsonObject.get("status").getAsString() : "Active";

            boolean success = dao.updateBirthdayVoucher(voucherId, voucherName, discountPercent, startDate, endDate, status);
            if (success) {
                out.print("{\"message\": \"Cập nhật voucher sinh nhật thành công!\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"message\": \"Cập nhật voucher sinh nhật thất bại!\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
            e.printStackTrace();
        }
        out.flush();
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();
        try {
            int voucherId = Integer.parseInt(request.getParameter("id"));
            BirthdayMonthPromotionDAO dao = new BirthdayMonthPromotionDAO();
            boolean success = dao.deleteBirthdayVoucher(voucherId);

            if (success) {
                out.print("{\"message\": \"Xóa voucher sinh nhật thành công!\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Không tìm thấy voucher sinh nhật để xóa!\"}");
            }
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"ID không hợp lệ!\"}");
        }
        out.flush();
    }
}
