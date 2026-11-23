package bssms_api.KhanhLTQ;

import bssms_account.Account;
import bssms_api.common.BaseApiServlet;
import bssms_persistence.KhanhLTQ.PackagePurchaseDAO;
import bssms_persistence.common.WorkflowException;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;

@WebServlet(name = "PackagePurchaseServlet", urlPatterns = {"/api/package-purchases"})
public class PackagePurchaseServlet extends BaseApiServlet {
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 201, () -> {
            Account user = user(request);
            if (user == null || user.getAccountId() == null || !"Customer".equals(user.getRole()))
                throw new WorkflowException(403, "Only customers can buy packages online.");
            JsonObject body = body(request, JsonObject.class);
            if (!body.has("treatmentPackageId") || body.get("treatmentPackageId").isJsonNull())
                throw new IllegalArgumentException("Missing treatment package ID.");
            int packageId = body.get("treatmentPackageId").getAsInt();
            try (PackagePurchaseDAO dao = new PackagePurchaseDAO()) {
                dao.setActorAccountId(user.getAccountId());
                String voucher = body.has("voucherCode") && !body.get("voucherCode").isJsonNull() ? body.get("voucherCode").getAsString() : null;
                // preview = true: chỉ trả về hóa đơn tạm để khách xác nhận, chưa tạo hóa đơn
                if (body.has("preview") && body.get("preview").getAsBoolean()) return dao.quote(packageId, voucher);
                return Map.of("invoiceId", dao.purchase(packageId, voucher));
            }
        });
    }
}
