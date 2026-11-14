package bssms_api.KhanhND;

import bssms_account.Account;
import bssms_api.common.BaseApiServlet;
import bssms_controller.DatTT.ControllerException;
import bssms_persistence.KhanhND.MembershipTierDAO;
import bssms_common.LoginIdentity;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.Map;

@WebServlet(name = "MembershipTierServlet", urlPatterns = {"/api/membership-tiers"})
public class MembershipTierServlet extends BaseApiServlet {

    private static void allow(Account user, String... roles) {
        if (user == null) throw new ControllerException(401, "Vui lòng đăng nhập lại.");
        for (String r : roles) if (r.equals(user.getRole())) return;
        throw new ControllerException(403, "Bạn không có quyền thực hiện thao tác này.");
    }

    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            Account user = user(request);
            allow(user, "Customer", "Receptionist", "Manager");
            try (MembershipTierDAO dao = new MembershipTierDAO()) {
                Integer customerId = null;
                if ("1".equals(request.getParameter("mine"))) {
                    allow(user, "Customer");
                    customerId = LoginIdentity.customerId(user.getAccountId());
                } else if (request.getParameter("customerId") != null) {
                    allow(user, "Receptionist", "Manager");
                    customerId = id(request, "customerId");
                }
                if (customerId == null) return dao.getAllMembershipTiers();
                Map<String, Object> result = dao.getCustomerMembership(customerId);
                if (result == null) throw new ControllerException(404, "Không tìm thấy khách hàng.");
                return result;
            }
        });
    }

    @Override protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            allow(user(request), "Manager");
            int tierId = id(request, "id");
            DescriptionInput input = body(request, DescriptionInput.class);
            String description = input == null || input.description == null ? null : input.description.trim();
            if (description != null && description.length() > 500)
                throw new IllegalArgumentException("Mô tả quyền lợi tối đa 500 ký tự.");
            try (MembershipTierDAO dao = new MembershipTierDAO()) {
                if (!dao.updateDescription(tierId, description == null || description.isEmpty() ? null : description))
                    throw new ControllerException(404, "Không tìm thấy hạng thành viên.");
                return message("Đã cập nhật mô tả quyền lợi.");
            }
        });
    }

    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 405, () -> { throw new ControllerException(405, "Hạng thành viên cố định theo BR-15, không thể thêm mới."); });
    }

    @Override protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 405, () -> { throw new ControllerException(405, "Hạng thành viên cố định theo BR-15, không thể xóa."); });
    }

    public static class DescriptionInput { public String description; }
}
