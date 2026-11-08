package bssms_integration;

import bssms_common.AppConfig;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Access token của Zalo OA hết hạn sau khoảng 25 giờ; refresh token đổi mới sau MỖI lần làm mới (dùng một lần).
 * Lớp này tự làm mới access token trước khi hết hạn và lưu token mới vào ~/.bssms/zalo-token.json.
 * Cấu hình (tệp config.properties hoặc biến môi trường): BSSMS_ZALO_APP_ID, BSSMS_ZALO_APP_SECRET, BSSMS_ZALO_REFRESH_TOKEN,
 * (tùy chọn) BSSMS_ZALO_ACCESS_TOKEN. Nếu bạn dán refresh token MỚI vào cấu hình, token đã lưu cũ sẽ được bỏ qua.
 */
public final class ZaloTokenStore {
    private static final Logger LOG = Logger.getLogger(ZaloTokenStore.class.getName());
    private static final long REFRESH_BEFORE_MS = 10L * 60 * 1000;
    private static String access, refresh, seedRefresh;
    private static long expiresAtMs;
    private static boolean loaded;

    private ZaloTokenStore() {}

    private static Path file() { return AppConfig.dir().resolve("zalo-token.json"); }

    private static synchronized void load() {
        String configRefresh = AppConfig.get("BSSMS_ZALO_REFRESH_TOKEN");
        if (loaded && java.util.Objects.equals(configRefresh, seedRefresh)) return;
        loaded = true;
        seedRefresh = configRefresh;
        access = AppConfig.get("BSSMS_ZALO_ACCESS_TOKEN");
        refresh = configRefresh;
        expiresAtMs = 0;
        Path path = file();
        try {
            if (Files.isRegularFile(path)) {
                JsonObject saved = JsonParser.parseString(Files.readString(path, StandardCharsets.UTF_8)).getAsJsonObject();
                String savedSeed = saved.has("seed_refresh_token") && !saved.get("seed_refresh_token").isJsonNull() ? saved.get("seed_refresh_token").getAsString() : null;
                if (java.util.Objects.equals(savedSeed, configRefresh)) {
                    access = saved.get("access_token").getAsString();
                    refresh = saved.get("refresh_token").getAsString();
                    expiresAtMs = saved.get("expires_at").getAsLong();
                }
            }
        } catch (Exception e) {
            LOG.log(Level.WARNING, "Không đọc được tệp token Zalo đã lưu", e);
        }
    }

    private static boolean hasRefreshCredentials() {
        return refresh != null && AppConfig.get("BSSMS_ZALO_APP_ID") != null && AppConfig.get("BSSMS_ZALO_APP_SECRET") != null;
    }

    public static synchronized boolean canRefresh() { load(); return hasRefreshCredentials(); }

    /** Access token còn hiệu lực (tự làm mới khi sắp hết hạn); null nếu chưa cấu hình. */
    public static synchronized String accessToken() {
        load();
        if (hasRefreshCredentials() && (access == null || System.currentTimeMillis() > expiresAtMs - REFRESH_BEFORE_MS)) {
            try { return refreshNow(); } catch (Exception e) { LOG.log(Level.WARNING, "Làm mới token Zalo thất bại", e); }
        }
        return access;
    }

    /** Số phút còn lại của access token, hoặc null nếu không rõ. */
    public static synchronized Long minutesLeft() {
        load();
        return expiresAtMs <= 0 ? null : Math.max(0, (expiresAtMs - System.currentTimeMillis()) / 60000);
    }

    public static synchronized String refreshNow() throws IOException, InterruptedException {
        load();
        if (!hasRefreshCredentials()) throw new IOException("Chưa cấu hình BSSMS_ZALO_APP_ID, BSSMS_ZALO_APP_SECRET và BSSMS_ZALO_REFRESH_TOKEN.");
        String form = "refresh_token=" + URLEncoder.encode(refresh, StandardCharsets.UTF_8)
                + "&app_id=" + URLEncoder.encode(AppConfig.get("BSSMS_ZALO_APP_ID"), StandardCharsets.UTF_8)
                + "&grant_type=refresh_token";
        HttpRequest request = HttpRequest.newBuilder(URI.create("https://oauth.zaloapp.com/v4/oa/access_token"))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("secret_key", AppConfig.get("BSSMS_ZALO_APP_SECRET"))
                .POST(HttpRequest.BodyPublishers.ofString(form)).build();
        HttpResponse<String> response = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build()
                .send(request, HttpResponse.BodyHandlers.ofString());
        JsonObject json = JsonParser.parseString(response.body()).getAsJsonObject();
        if (!json.has("access_token")) throw new IOException("Zalo không cấp token mới: " + response.body());
        access = json.get("access_token").getAsString();
        if (json.has("refresh_token")) refresh = json.get("refresh_token").getAsString();
        long seconds = json.has("expires_in") ? Long.parseLong(json.get("expires_in").getAsString()) : 90000L;
        expiresAtMs = System.currentTimeMillis() + seconds * 1000;
        JsonObject saved = new JsonObject();
        saved.addProperty("access_token", access);
        saved.addProperty("refresh_token", refresh);
        saved.addProperty("expires_at", expiresAtMs);
        if (seedRefresh != null) saved.addProperty("seed_refresh_token", seedRefresh);
        Files.createDirectories(file().getParent());
        Files.writeString(file(), saved.toString(), StandardCharsets.UTF_8);
        return access;
    }
}
