package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import bssms_persistence.common.WorkflowException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** 4.6: before/after treatment photos. Files live on disk; the database keeps only the storage key. */
public class TreatmentPhotoDAO extends DBContext implements AutoCloseable {
    public static final int MAX_BYTES = 3 * 1024 * 1024;
    public static final int MAX_PHOTOS_PER_APPOINTMENT = 20;

    public static final class Stored {
        public final Path path;
        public final String contentType;
        Stored(Path path, String contentType) { this.path = path; this.contentType = contentType; }
    }

    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    /** Directory is configurable with -Dbssms.photo.dir or BSSMS_PHOTO_DIR; default is ~/bssms-photos. */
    public static Path root() {
        String dir = System.getProperty("bssms.photo.dir");
        if (dir == null || dir.isBlank()) dir = System.getenv("BSSMS_PHOTO_DIR");
        if (dir == null || dir.isBlank()) dir = Paths.get(System.getProperty("user.home"), "bssms-photos").toString();
        return Paths.get(dir).toAbsolutePath().normalize();
    }

    private static String extensionFor(String contentType) {
        String type = contentType == null ? "" : contentType.trim().toLowerCase();
        switch (type) {
            case "image/jpeg": return "jpg";
            case "image/png": return "png";
            case "image/webp": return "webp";
            default: throw new IllegalArgumentException("Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.");
        }
    }

    private static boolean magicMatches(String ext, byte[] b) {
        if (b.length < 12) return false;
        switch (ext) {
            case "jpg": return (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF;
            case "png": return (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G';
            case "webp": return b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                    && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P';
            default: return false;
        }
    }

    public List<Map<String, Object>> list(int appointmentId) throws SQLException {
        workflow().appointmentAccess(appointmentId);
        return workflow().query(
                "SELECT photo_id,photo_type,created_at FROM TreatmentPhoto WHERE appointment_id=? ORDER BY photo_id",
                appointmentId);
    }

    public List<Map<String, Object>> add(int appointmentId, String photoType, String contentType, String base64) throws Exception {
        workflow().roles("Technician");
        workflow().appointmentAccess(appointmentId);
        if (!"Before".equals(photoType) && !"After".equals(photoType))
            throw new IllegalArgumentException("Loại ảnh phải là Before hoặc After.");
        String ext = extensionFor(contentType);
        if (base64 == null || base64.isBlank()) throw new IllegalArgumentException("Thiếu dữ liệu ảnh.");
        // Reject oversized payloads before decoding (4 base64 chars carry 3 bytes).
        if (base64.length() > (long) MAX_BYTES * 4 / 3 + 16) throw new IllegalArgumentException("Ảnh tối đa 3 MB.");
        byte[] bytes;
        try { bytes = Base64.getDecoder().decode(base64.replaceAll("\\s", "")); }
        catch (IllegalArgumentException e) { throw new IllegalArgumentException("Dữ liệu ảnh không hợp lệ."); }
        if (bytes.length == 0 || bytes.length > MAX_BYTES) throw new IllegalArgumentException("Ảnh tối đa 3 MB.");
        if (!magicMatches(ext, bytes)) throw new IllegalArgumentException("Nội dung tệp không phải ảnh " + ext.toUpperCase() + " hợp lệ.");

        String status = String.valueOf(workflow().one("SELECT status FROM Appointment WHERE appointment_id=?", appointmentId).get("status"));
        if (!Arrays.asList("Checked-in", "In-progress", "Completed").contains(status))
            throw new IllegalStateException("Chỉ được tải ảnh sau khi khách đã check-in.");
        Number count = (Number) workflow().one("SELECT COUNT(*) AS total FROM TreatmentPhoto WHERE appointment_id=?", appointmentId).get("total");
        if (count.intValue() >= MAX_PHOTOS_PER_APPOINTMENT)
            throw new IllegalStateException("Mỗi lịch hẹn tối đa " + MAX_PHOTOS_PER_APPOINTMENT + " ảnh.");

        String key = UUID.randomUUID() + "." + ext;
        Path target = root().resolve(key).normalize();
        Files.createDirectories(root());
        Files.write(target, bytes);
        try {
            workflow().update("INSERT TreatmentPhoto(appointment_id,photo_type,storage_key) VALUES(?,?,?)", appointmentId, photoType, key);
        } catch (SQLException | RuntimeException e) {
            try { Files.deleteIfExists(target); } catch (IOException ignored) { }
            throw e;
        }
        return list(appointmentId);
    }

    /** Resolves a stored photo after checking that the caller may see its appointment. */
    public Stored file(int photoId) throws SQLException {
        Map<String, Object> row = workflow().one("SELECT appointment_id,storage_key FROM TreatmentPhoto WHERE photo_id=?", photoId);
        workflow().appointmentAccess(((Number) row.get("appointmentId")).intValue());
        String key = String.valueOf(row.get("storageKey"));
        Path path = root().resolve(key).normalize();
        if (!path.startsWith(root()) || !Files.isRegularFile(path)) throw new WorkflowException(404, "Không tìm thấy tệp ảnh.");
        String lower = key.toLowerCase();
        String type = lower.endsWith(".png") ? "image/png" : lower.endsWith(".webp") ? "image/webp" : "image/jpeg";
        return new Stored(path, type);
    }
}
