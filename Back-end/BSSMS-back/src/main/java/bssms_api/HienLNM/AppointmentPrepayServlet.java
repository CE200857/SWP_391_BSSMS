package bssms_api.HienLNM;

import bssms_account.Account;
import bssms_api.common.BaseApiServlet;
import bssms_persistence.HienLNM.AppointmentPrepayDAO;
import bssms_persistence.common.WorkflowException;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;

/** POST /api/appointment-prepay {appointmentId} -> {invoiceId}; khách rồi trả hóa đơn đó qua /api/payments/vnpay/create. */
@WebServlet(name = "AppointmentPrepayServlet", urlPatterns = {"/api/appointment-prepay"})
public class AppointmentPrepayServlet extends BaseApiServlet {
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 201, () -> {
            Account user = user(request);
            if (user == null || user.getAccountId() == null || !"Customer".equals(user.getRole()))
                throw new WorkflowException(403, "Chỉ khách hàng mới tự thanh toán trước trên web.");
            JsonObject body = body(request, JsonObject.class);
            if (!body.has("appointmentId") || body.get("appointmentId").isJsonNull())
                throw new IllegalArgumentException("Thiếu mã lịch hẹn.");
            try (AppointmentPrepayDAO dao = new AppointmentPrepayDAO()) {
                dao.setActorAccountId(user.getAccountId());
                return Map.of("invoiceId", dao.prepay(body.get("appointmentId").getAsInt()));
            }
        });
    }
}
