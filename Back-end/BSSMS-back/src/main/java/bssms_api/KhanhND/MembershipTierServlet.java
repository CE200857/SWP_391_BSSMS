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
        if (user == null) throw new ControllerException(401, "Please log in again.");
        for (String r : roles) if (r.equals(user.getRole())) return;
        throw new ControllerException(403, "You do not have permission to perform this action.");
    }

    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            Account user = user(request);
            // Danh sách hạng (không tham số) là thông tin công khai, dùng ở trang chi tiết dịch vụ
            if (request.getParameter("mine") != null || request.getParameter("customerId") != null)
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
                if (result == null) throw new ControllerException(404, "Customer not found.");
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
                throw new IllegalArgumentException("The benefit description can be at most 500 characters.");
            try (MembershipTierDAO dao = new MembershipTierDAO()) {
                if (!dao.updateDescription(tierId, description == null || description.isEmpty() ? null : description))
                    throw new ControllerException(404, "Membership tier not found.");
                return message("Benefit description updated.");
            }
        });
    }

    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 405, () -> { throw new ControllerException(405, "Membership tiers are fixed and cannot be added."); });
    }

    @Override protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 405, () -> { throw new ControllerException(405, "Membership tiers are fixed and cannot be deleted."); });
    }

    public static class DescriptionInput { public String description; }
}
