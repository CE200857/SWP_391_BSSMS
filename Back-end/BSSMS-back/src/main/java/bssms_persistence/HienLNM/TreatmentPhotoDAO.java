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

public class TreatmentPhotoDAO extends DBContext implements AutoCloseable {
    public static final int MAX_BYTES = 3 * 1024 * 1024;
    public static final int MAX_PHOTOS_PER_APPOINTMENT = 10;

    public static final class Stored {
        public final Path path;
        public final String contentType;
        Stored(Path path, String contentType) { this.path = path; this.contentType = contentType; }
    }

    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

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
            default: throw new IllegalArgumentException("Only JPEG, PNG or WebP images are accepted.");
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

    private int appointmentOf(int lineId) throws SQLException {
        int appointmentId = ((Number) workflow().one("SELECT appointment_id FROM AppointmentService WHERE appointment_service_id=?", lineId).get("appointmentId")).intValue();
        workflow().appointmentAccess(appointmentId);
        return appointmentId;
    }

    public List<Map<String, Object>> list(int lineId) throws SQLException {
        appointmentOf(lineId);
        return workflow().query(
                "SELECT photo_id,appointment_service_id,photo_type,created_at FROM TreatmentPhoto WHERE appointment_service_id=? ORDER BY photo_id",
                lineId);
    }

    public List<Map<String, Object>> add(int lineId, String photoType, String contentType, String base64) throws Exception {
        workflow().roles("Technician");
        appointmentOf(lineId);
        if (workflow().query("SELECT appointment_service_id FROM AppointmentService WHERE appointment_service_id=? AND technician_id=?", lineId, workflow().staffId()).isEmpty())
            throw new WorkflowException(403, "This service is not assigned to you.");
        if (!"Before".equals(photoType) && !"After".equals(photoType))
            throw new IllegalArgumentException("Photo type must be Before or After.");
        String ext = extensionFor(contentType);
        if (base64 == null || base64.isBlank()) throw new IllegalArgumentException("Missing image data.");
        if (base64.length() > (long) MAX_BYTES * 4 / 3 + 16) throw new IllegalArgumentException("Images can be at most 3 MB.");
        byte[] bytes;
        try { bytes = Base64.getDecoder().decode(base64.replaceAll("\\s", "")); }
        catch (IllegalArgumentException e) { throw new IllegalArgumentException("Invalid image data."); }
        if (bytes.length == 0 || bytes.length > MAX_BYTES) throw new IllegalArgumentException("Images can be at most 3 MB.");
        if (!magicMatches(ext, bytes)) throw new IllegalArgumentException("The file content is not a valid " + ext.toUpperCase() + " image.");

        String status = String.valueOf(workflow().one("SELECT a.status FROM Appointment a JOIN AppointmentService l ON l.appointment_id=a.appointment_id WHERE l.appointment_service_id=?", lineId).get("status"));
        if (!Arrays.asList("Checked-in", "In-progress", "Completed").contains(status))
            throw new IllegalStateException("Photos can only be uploaded after the customer has checked in.");
        Number count = (Number) workflow().one("SELECT COUNT(*) AS total FROM TreatmentPhoto WHERE appointment_service_id=?", lineId).get("total");
        if (count.intValue() >= MAX_PHOTOS_PER_APPOINTMENT)
            throw new IllegalStateException("Each appointment can have at most " + MAX_PHOTOS_PER_APPOINTMENT + " photos.");

        String key = UUID.randomUUID() + "." + ext;
        Path target = root().resolve(key).normalize();
        Files.createDirectories(root());
        Files.write(target, bytes);
        try {
            workflow().update("INSERT TreatmentPhoto(appointment_service_id,photo_type,storage_key,created_at) VALUES(?,?,?,SYSDATETIME())", lineId, photoType, key);
        } catch (SQLException | RuntimeException e) {
            try { Files.deleteIfExists(target); } catch (IOException ignored) { }
            throw e;
        }
        return list(lineId);
    }

    public List<Map<String, Object>> delete(int photoId) throws Exception {
        workflow().roles("Technician");
        Map<String, Object> row = workflow().one("SELECT appointment_service_id,storage_key FROM TreatmentPhoto WHERE photo_id=?", photoId);
        int lineId = ((Number) row.get("appointmentServiceId")).intValue();
        int appointmentId = appointmentOf(lineId);
        String status = String.valueOf(workflow().one("SELECT status FROM Appointment WHERE appointment_id=?", appointmentId).get("status"));
        if (!Arrays.asList("Checked-in", "In-progress", "Completed").contains(status))
            throw new IllegalStateException("Photos cannot be deleted in the current appointment status.");
        if (workflow().update("DELETE FROM TreatmentPhoto WHERE photo_id=?", photoId) != 1)
            throw new WorkflowException(404, "Photo not found.");
        try {
            Path path = root().resolve(String.valueOf(row.get("storageKey"))).normalize();
            if (path.startsWith(root())) Files.deleteIfExists(path);
        } catch (IOException ignored) {
        }
        return list(lineId);
    }

    public Stored file(int photoId) throws SQLException {
        Map<String, Object> row = workflow().one("SELECT appointment_service_id,storage_key FROM TreatmentPhoto WHERE photo_id=?", photoId);
        appointmentOf(((Number) row.get("appointmentServiceId")).intValue());
        String key = String.valueOf(row.get("storageKey"));
        Path path = root().resolve(key).normalize();
        if (!path.startsWith(root()) || !Files.isRegularFile(path)) throw new WorkflowException(404, "Image file not found.");
        String lower = key.toLowerCase();
        String type = lower.endsWith(".png") ? "image/png" : lower.endsWith(".webp") ? "image/webp" : "image/jpeg";
        return new Stored(path, type);
    }
}
