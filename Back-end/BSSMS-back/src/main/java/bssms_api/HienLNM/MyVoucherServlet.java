package bssms_api.HienLNM;

import bssms_account.Account;
import bssms_api.common.BaseApiServlet;
import bssms_common.LoginIdentity;
import bssms_persistence.HienLNM.VoucherDAO;
import bssms_persistence.common.WorkflowException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/** 3.7: a customer sees only their own vouchers and birthday-benefit status. */
@WebServlet(name = "MyVoucherServlet", urlPatterns = {"/api/my-vouchers"})
public class MyVoucherServlet extends BaseApiServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            Account user = user(request);
            if (user == null || user.getAccountId() == null || !"Customer".equals(user.getRole()))
                throw new WorkflowException(403, "Chỉ khách hàng mới xem được voucher của mình.");
            try (VoucherDAO dao = new VoucherDAO()) {
                dao.setActorAccountId(user.getAccountId());
                return dao.myBenefits(LoginIdentity.customerId(user.getAccountId()));
            }
        });
    }
}
