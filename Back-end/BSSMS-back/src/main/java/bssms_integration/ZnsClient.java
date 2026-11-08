package bssms_integration;

import bssms_common.AppConfig;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Logger;

/** Gửi tin Zalo ZNS theo số điện thoại. Dùng chung cho tiến trình nền và nút "gửi thử". */
public final class ZnsClient {
    private static final Logger LOG = Logger.getLogger(ZnsClient.class.getName());

    private ZnsClient() {}

    /** BSSMS_ZALO_MODE=simulate: không gọi Zalo, chỉ ghi nhận như đã gửi (dùng để chạy thử và trình bày khi chưa có OA/ZNS thật). */
    public static boolean simulate() { return "simulate".equalsIgnoreCase(AppConfig.get("BSSMS_ZALO_MODE")); }

    private static JsonObject defaultTemplates() {
        return JsonParser.parseString("{"
            + "\"INVOICE_PAID\":{\"id\":\"SIMULATED\",\"fields\":{\"customer_name\":\"customerName\",\"invoice_id\":\"invoiceId\",\"total_amount\":\"totalAmount\"}},"
            + "\"APPOINTMENT_BOOKED\":{\"id\":\"SIMULATED\",\"fields\":{\"customer_name\":\"customerName\",\"service_name\":\"serviceName\",\"appointment_time\":\"appointmentTime\"}},"
            + "\"APPOINTMENT_REMINDER\":{\"id\":\"SIMULATED\",\"fields\":{\"customer_name\":\"customerName\",\"service_name\":\"serviceName\",\"appointment_time\":\"appointmentTime\"}},"
            + "\"PACKAGE_REMINDER\":{\"id\":\"SIMULATED\",\"fields\":{\"customer_name\":\"customerName\",\"package_name\":\"packageName\",\"remaining_sessions\":\"remainingSessions\",\"expiry_date\":\"expiryDate\"}}"
            + "}").getAsJsonObject();
    }

    /** Số điện thoại về dạng Zalo yêu cầu: 84xxxxxxxxx (không có dấu +, không có số 0 đầu). */
    public static String normalizePhone(String raw) {
        String phone = raw == null ? "" : raw.replaceAll("[^0-9]", "");
        if (phone.startsWith("0")) phone = "84" + phone.substring(1);
        if (!phone.matches("84[0-9]{9}")) throw new IllegalArgumentException("Số điện thoại không hợp lệ");
        return phone;
    }

    /** Mẫu tin: JSON trong BSSMS_ZALO_TEMPLATES hoặc tệp ~/.bssms/zalo-templates.json; null nếu chưa cấu hình. */
    public static JsonObject templates() {
        try {
            String json = AppConfig.get("BSSMS_ZALO_TEMPLATES");
            if (json == null) {
                Path file = AppConfig.dir().resolve("zalo-templates.json");
                if (Files.isRegularFile(file)) json = Files.readString(file, StandardCharsets.UTF_8);
            }
            if (json == null || json.isBlank()) return simulate() ? defaultTemplates() : null;
            return JsonParser.parseString(json).getAsJsonObject();
        } catch (Exception e) {
            return simulate() ? defaultTemplates() : null;
        }
    }

    public static boolean configured() { return templates() != null && (simulate() || ZaloTokenStore.accessToken() != null); }

    private static boolean tokenError(JsonObject result) {
        if (!result.has("error")) return false;
        int code = result.get("error").getAsInt();
        String message = result.has("message") && !result.get("message").isJsonNull() ? result.get("message").getAsString().toLowerCase() : "";
        return code == -216 || code == -124 || message.contains("access token") || message.contains("access_token");
    }

    private static JsonObject post(String token, JsonObject body) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create("https://business.openapi.zalo.me/message/template"))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/json")
                .header("access_token", token)
                .POST(HttpRequest.BodyPublishers.ofString(body.toString())).build();
        HttpResponse<String> response = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build()
                .send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 401) {
            JsonObject expired = new JsonObject();
            expired.addProperty("error", -216);
            expired.addProperty("message", "HTTP 401 (access token)");
            return expired;
        }
        if (response.statusCode() != 200) throw new IOException("HTTP " + response.statusCode());
        return JsonParser.parseString(response.body()).getAsJsonObject();
    }

    /** Gửi một tin ZNS. Token hết hạn thì tự làm mới và gửi lại một lần. Ném IOException khi không rõ kết quả. */
    public static JsonObject send(JsonObject body) throws IOException, InterruptedException {
        if (simulate()) {
            LOG.info("[ZNS mô phỏng] gửi tới " + body.get("phone") + " mẫu " + body.get("template_id") + " dữ liệu " + body.get("template_data"));
            JsonObject data = new JsonObject();
            data.addProperty("msg_id", "SIM-" + UUID.randomUUID());
            JsonObject fake = new JsonObject();
            fake.addProperty("error", 0);
            fake.addProperty("message", "Success (mô phỏng, chưa gửi tới Zalo)");
            fake.add("data", data);
            return fake;
        }
        // Chế độ thử nghiệm (BSSMS_ZALO_MODE=development) cho phép gửi trước khi mẫu tin được Zalo duyệt.
        if ("development".equalsIgnoreCase(AppConfig.get("BSSMS_ZALO_MODE"))) body.addProperty("mode", "development");
        String token = ZaloTokenStore.accessToken();
        if (token == null) throw new IOException("Chưa cấu hình token Zalo");
        JsonObject result = post(token, body);
        if (tokenError(result) && ZaloTokenStore.canRefresh()) result = post(ZaloTokenStore.refreshNow(), body);
        return result;
    }

    /** Gửi thử một mẫu tin tới một số điện thoại với dữ liệu mẫu (Manager dùng để kiểm tra cấu hình). */
    public static JsonObject sendTest(String rawPhone, String templateCode) throws IOException, InterruptedException {
        String phone = normalizePhone(rawPhone);
        JsonObject templates = templates();
        if (templates == null || !templates.has(templateCode)) throw new IllegalArgumentException("Chưa cấu hình mẫu tin " + templateCode);
        JsonObject template = templates.getAsJsonObject(templateCode);
        JsonObject sample = new JsonObject();
        for (Map.Entry<String, String> e : Map.of(
                "customerName", "Khách hàng thử", "invoiceId", "0", "totalAmount", "100000",
                "serviceName", "Dịch vụ thử", "appointmentTime", "09:00 01/01/2030",
                "packageName", "Gói thử", "remainingSessions", "1", "expiryDate", "01/01/2030").entrySet()) {
            sample.addProperty(e.getKey(), e.getValue());
        }
        JsonObject data = new JsonObject();
        for (Map.Entry<String, JsonElement> field : template.getAsJsonObject("fields").entrySet()) {
            JsonElement value = sample.get(field.getValue().getAsString());
            data.addProperty(field.getKey(), value == null ? "Thử nghiệm" : value.getAsString());
        }
        JsonObject body = new JsonObject();
        body.addProperty("phone", phone);
        body.add("template_id", template.get("id"));
        body.add("template_data", data);
        body.addProperty("tracking_id", "BSSMS-TEST-" + System.currentTimeMillis());
        return send(body);
    }
}
