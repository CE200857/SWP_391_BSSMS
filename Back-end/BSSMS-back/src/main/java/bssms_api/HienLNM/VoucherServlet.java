package bssms_api.HienLNM;

import com.google.gson.Gson;
import bssms_persistence.HienLNM.VoucherDAO;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(name = "VoucherServlet", urlPatterns = {"/api/vouchers"})
public class VoucherServlet extends HttpServlet {

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

        VoucherDAO dao = new VoucherDAO();
        PrintWriter out = response.getWriter();

        String idParam = request.getParameter("id");

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
            VoucherDAO dao = new VoucherDAO();

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
                    response.setStatus(HttpServletResponse.SC_CONFLICT);
                    out.print("{\"message\": \"Mã voucher đã tồn tại!\"}");
                    out.flush();
                    return;
                }

                boolean success = dao.updateVoucher(voucherId, customerId, voucherCode, voucherName, 
                                                    discountType, discountValue, startDate, endDate, status);
                if (success) {
                    out.print("{\"message\": \"Cập nhật voucher thành công!\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
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
                    response.setStatus(HttpServletResponse.SC_CONFLICT);
                    out.print("{\"message\": \"Mã voucher đã tồn tại!\"}");
                    out.flush();
                    return;
                }

                boolean success = dao.createVoucher(customerId, voucherCode, voucherName, 
                                                   discountType, discountValue, startDate, endDate);
                if (success) {
                    out.print("{\"message\": \"Tạo voucher thành công!\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"message\": \"Tạo voucher thất bại!\"}");
                }
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
            VoucherDAO dao = new VoucherDAO();
            boolean success = dao.deleteVoucher(voucherId);

            if (success) {
                out.print("{\"message\": \"Xóa voucher thành công!\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Không tìm thấy voucher để xóa!\"}");
            }
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"ID không hợp lệ!\"}");
        }
        out.flush();
    }
}
