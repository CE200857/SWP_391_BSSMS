package bssms_integration;

import bssms_api.common.BaseApiServlet;
import bssms_common.AppConfig;
import bssms_persistence.common.WorkflowException;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Manager kiểm tra cấu hình tích hợp và gửi thử Zalo ZNS.
 *   GET  /api/integrations/status      trạng thái cấu hình VNPay, Zalo ZNS, email (không lộ giá trị bí mật)
 *   POST /api/integrations/zalo-test   body {phone, templateCode?}  gửi thử một tin ZNS
 */
@WebServlet(name = "IntegrationServlet", urlPatterns = {"/api/integrations/status", "/api/integrations/zalo-test"})
public class IntegrationServlet extends BaseApiServlet {
    private void requireManager(HttpServletRequest request) {
        if (user(request) == null) throw new WorkflowException(401, "Vui lòng đăng nhập.");
        if (!"Manager".equals(user(request).getRole())) throw new WorkflowException(403, "Chỉ Manager được xem cấu hình tích hợp.");
    }

    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            requireManager(request);
            Map<String, Object> vnpay = new LinkedHashMap<>();
            vnpay.put("tmnCode", AppConfig.get("VNPAY_TMN_CODE") != null);
            vnpay.put("hashSecret", AppConfig.get("VNPAY_HASH_SECRET") != null);
            vnpay.put("returnUrl", AppConfig.get("VNPAY_RETURN_URL") != null ? "đã cấu hình" : "tự suy ra từ địa chỉ máy chủ");
            vnpay.put("paymentUrl", AppConfig.get("VNPAY_PAYMENT_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"));
            vnpay.put("confirmOnReturn", AppConfig.flag("VNPAY_CONFIRM_ON_RETURN", true));
            vnpay.put("refundServerIp", AppConfig.get("VNPAY_SERVER_IP") != null);
            Map<String, Object> zalo = new LinkedHashMap<>();
            zalo.put("jobsEnabled", AppConfig.flag("BSSMS_JOBS_ENABLED", false));
            zalo.put("accessToken", ZaloTokenStore.accessToken() != null);
            zalo.put("canRefresh", ZaloTokenStore.canRefresh());
            zalo.put("tokenMinutesLeft", ZaloTokenStore.minutesLeft());
            zalo.put("mode", "development".equalsIgnoreCase(AppConfig.get("BSSMS_ZALO_MODE")) ? "development" : "production");
            List<String> codes = new ArrayList<>();
            JsonObject templates = ZnsClient.templates();
            if (templates != null) for (Map.Entry<String, JsonElement> e : templates.entrySet()) codes.add(e.getKey());
            zalo.put("templates", codes);
            Map<String, Object> email = new LinkedHashMap<>();
            email.put("smtpUser", AppConfig.get("BSSMS_SMTP_USER") != null);
            email.put("smtpPassword", AppConfig.get("BSSMS_SMTP_PASSWORD") != null);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("configFile", AppConfig.file().toString());
            result.put("vnpay", vnpay);
            result.put("zalo", zalo);
            result.put("email", email);
            return result;
        });
    }

    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            requireManager(request);
            JsonObject body = body(request, JsonObject.class);
            String phone = body.has("phone") ? body.get("phone").getAsString() : "";
            String code = body.has("templateCode") ? body.get("templateCode").getAsString() : "INVOICE_PAID";
            JsonObject result = ZnsClient.sendTest(phone, code);
            boolean ok = result.has("error") && result.get("error").getAsInt() == 0;
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("ok", ok);
            out.put("zaloError", result.has("error") ? result.get("error").getAsInt() : null);
            out.put("zaloMessage", result.has("message") && !result.get("message").isJsonNull() ? result.get("message").getAsString() : "");
            return out;
        });
    }
}
