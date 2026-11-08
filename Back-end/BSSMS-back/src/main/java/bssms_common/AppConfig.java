package bssms_common;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Properties;

/**
 * Cấu hình tích hợp (VNPay, Zalo ZNS, email...). Thứ tự tìm (cái đứng trước thắng):
 *   1) biến môi trường, 2) tham số JVM (-DTEN=giatri),
 *   3) tệp riêng của từng máy ~/.bssms/config.properties (đổi thư mục bằng BSSMS_CONFIG_DIR, đổi tệp bằng BSSMS_CONFIG_FILE),
 *   4) tệp DÙNG CHUNG của cả nhóm nằm trong dự án: src/main/resources/bssms-defaults.properties.
 * Nhờ mục 4, không ai trong nhóm phải tự cài đặt; ai cần khác thì ghi đè bằng mục 1 đến 3.
 * Tệp ở mục 3 được tự đọc lại khi bạn sửa (trừ vài giá trị đọc lúc khởi động).
 */
public final class AppConfig {
    private static final Properties FILE = new Properties();
    private static volatile Properties shared; // cấu hình dùng chung đóng gói trong dự án
    private static volatile long checkedAt;
    private static volatile long loadedModified = Long.MIN_VALUE;

    private AppConfig() {}

    public static Path dir() {
        String dir = System.getProperty("bssms.config.dir");
        if (dir == null || dir.isBlank()) dir = System.getenv("BSSMS_CONFIG_DIR");
        return dir == null || dir.isBlank() ? Paths.get(System.getProperty("user.home"), ".bssms") : Paths.get(dir);
    }

    public static Path file() {
        String file = System.getenv("BSSMS_CONFIG_FILE");
        return file == null || file.isBlank() ? dir().resolve("config.properties") : Paths.get(file);
    }

    private static boolean blank(String s) { return s == null || s.isBlank(); }

    private static synchronized String fromFile(String key) {
        long now = System.currentTimeMillis();
        if (now - checkedAt > 3000) {
            checkedAt = now;
            Path path = file();
            try {
                long modified = Files.exists(path) ? Files.getLastModifiedTime(path).toMillis() : -1;
                if (modified != loadedModified) {
                    FILE.clear();
                    if (modified >= 0) {
                        try (InputStream in = Files.newInputStream(path); InputStreamReader reader = new InputStreamReader(in, StandardCharsets.UTF_8)) {
                            FILE.load(reader);
                        }
                    }
                    loadedModified = modified;
                }
            } catch (IOException ignored) {
                // không đọc được tệp: coi như chưa có cấu hình trong tệp
            }
        }
        String value = FILE.getProperty(key);
        return blank(value) ? sharedValue(key) : value;
    }

    private static String sharedValue(String key) {
        Properties loaded = shared;
        if (loaded == null) {
            loaded = new Properties();
            try (InputStream in = AppConfig.class.getResourceAsStream("/bssms-defaults.properties")) {
                if (in != null) {
                    try (InputStreamReader reader = new InputStreamReader(in, StandardCharsets.UTF_8)) { loaded.load(reader); }
                }
            } catch (IOException ignored) {
                // không đọc được tệp dùng chung: coi như chưa có
            }
            shared = loaded;
        }
        return loaded.getProperty(key);
    }

    /** Giá trị cấu hình, hoặc null nếu chưa có. */
    public static String get(String key) {
        String value = System.getenv(key);
        if (blank(value)) value = System.getProperty(key);
        if (blank(value)) value = fromFile(key);
        return blank(value) ? null : value.trim();
    }

    public static String get(String key, String fallback) {
        String value = get(key);
        return value == null ? fallback : value;
    }

    public static boolean flag(String key, boolean fallback) {
        String value = get(key);
        return value == null ? fallback : Boolean.parseBoolean(value);
    }
}
