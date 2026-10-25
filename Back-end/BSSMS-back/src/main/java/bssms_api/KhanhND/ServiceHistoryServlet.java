package bssms_api.KhanhND;

import bssms_persistence.KhanhND.ServiceHistoryDAO;
import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Read-only API for completed service history.
 */
@WebServlet(name = "ServiceHistoryServlet", urlPatterns = {"/api/service-history"})
public class ServiceHistoryServlet extends HttpServlet {

    private final Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setHeader("Access-Control-Allow-Credentials", "true");
    }

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setAccessControlHeaders(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute("user") instanceof Map)) {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "Vui lòng đăng nhập để xem lịch sử dịch vụ.");
            return;
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) session.getAttribute("user");
        Object roleValue = user.get("role");
        String role = roleValue == null ? "" : roleValue.toString();

        ServiceHistoryDAO dao = new ServiceHistoryDAO();

        try {
            List<Map<String, Object>> result;

            if ("Customer".equals(role)) {
                Integer accountId = getPositiveId(user, "accountId", "account_id");
                Integer customerId;

                // Prefer resolving through the account-to-customer relationship.
                if (accountId != null) {
                    customerId = dao.findCustomerIdByAccountId(accountId);
                } else {
                    customerId = getPositiveId(user, "customerId", "customer_id");
                }

                if (customerId == null) {
                    writeError(response, HttpServletResponse.SC_FORBIDDEN,
                            "Tài khoản chưa được liên kết với hồ sơ khách hàng.");
                    return;
                }

                // Customer ID is derived from the authenticated session, not the URL.
                result = dao.getHistoryByCustomer(customerId);

            } else if ("Technician".equals(role)) {
                Integer accountId = getPositiveId(user, "accountId", "account_id");
                Integer staffId;

                if (accountId != null) {
                    staffId = dao.findStaffIdByAccountId(accountId);
                } else {
                    staffId = getPositiveId(user, "staffId", "staff_id");
                }

                if (staffId == null) {
                    writeError(response, HttpServletResponse.SC_FORBIDDEN,
                            "Tài khoản chưa được liên kết với hồ sơ nhân viên.");
                    return;
                }

                // Technician sees only completed appointments assigned to them.
                result = dao.getHistoryByStaff(staffId);

            } else if ("Receptionist".equals(role) || "Manager".equals(role)) {
                String customerIdText = request.getParameter("customerId");
                Integer customerId = null;

                if (customerIdText != null && !customerIdText.trim().isEmpty()) {
                    customerId = parsePositiveId(customerIdText.trim());
                    if (customerId == null) {
                        writeError(response, HttpServletResponse.SC_BAD_REQUEST,
                                "Customer ID phải là số nguyên dương.");
                        return;
                    }
                }

                result = dao.getHistoryForManagerOrReceptionist(customerId);

            } else {
                writeError(response, HttpServletResponse.SC_FORBIDDEN,
                        "Bạn không có quyền xem lịch sử dịch vụ.");
                return;
            }

            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write(gson.toJson(result));

        } catch (Exception e) {
            e.printStackTrace();
            writeError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Không thể tải lịch sử dịch vụ lúc này.");
        }
    }

    private Integer getPositiveId(Map<String, Object> user, String... keys) {
        for (String key : keys) {
            Integer value = parsePositiveId(user.get(key));
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private Integer parsePositiveId(Object value) {
        if (value == null) {
            return null;
        }

        try {
            int parsed;
            if (value instanceof Number) {
                parsed = ((Number) value).intValue();
            } else {
                parsed = Integer.parseInt(value.toString().trim());
            }
            return parsed > 0 ? parsed : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void writeError(HttpServletResponse response, int status, String message)
            throws IOException {
        response.setStatus(status);
        Map<String, String> error = new HashMap<>();
        error.put("message", message);
        response.getWriter().write(gson.toJson(error));
    }
}
