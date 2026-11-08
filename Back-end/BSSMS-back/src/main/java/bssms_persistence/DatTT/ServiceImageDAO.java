package bssms_persistence.DatTT;

import bssms_persistence.DBContext;
import bssms_persistence.HienLNM.TreatmentPhotoDAO;
import bssms_persistence.common.WorkflowException;
import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Base64;
import java.util.UUID;

/** Ảnh đại diện của dịch vụ: lưu tệp trong thư mục ảnh của hệ thống (thư mục con "services"), tên tệp lưu ở Service.image_key. */
public class ServiceImageDAO extends DBContext implements AutoCloseable {
    public static final int MAX_BYTES = 3 * 1024 * 1024;

    public static Path dir() { return TreatmentPhotoDAO.root().resolve("services"); }

    private static String extensionFor(String contentType) {
        if ("image/jpeg".equals(contentType)) return "jpg";
        if ("image/png".equals(contentType)) return "png";
        if ("image/webp".equals(contentType)) return "webp";
        throw new IllegalArgumentException("Chỉ nhận ảnh JPEG, PNG hoặc WebP.");
    }

    private static boolean magicMatches(String ext, byte[] b) {
        if (b.length < 12) return false;
        switch (ext) {
            case "jpg": return (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF;
            case "png": return (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G';
            default: return b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P';
        }
    }

    public static String mimeOf(String key) {
        String k = key == null ? "" : key.toLowerCase();
        return k.endsWith(".png") ? "image/png" : k.endsWith(".webp") ? "image/webp" : "image/jpeg";
    }

    /** Xóa mọi tệp ảnh của một dịch vụ (dùng khi xóa dịch vụ hoặc thay ảnh). */
    public static void deleteFiles(int serviceId) {
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir(), "service-" + serviceId + "-*")) {
            for (Path p : stream) Files.deleteIfExists(p);
        } catch (IOException ignored) {
            // thư mục chưa tồn tại hoặc không xóa được: không ảnh hưởng nghiệp vụ
        }
    }

    private void requireService(int serviceId) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT 1 FROM Service WHERE service_id=?")) {
            ps.setInt(1, serviceId);
            try (ResultSet rs = ps.executeQuery()) { if (!rs.next()) throw new WorkflowException(404, "Không tìm thấy dịch vụ."); }
        }
    }

    /** Lưu (thay) ảnh dịch vụ; trả về tên tệp đã lưu. */
    public String save(int serviceId, String contentType, String base64) throws Exception {
        if (conn == null) throw new SQLException("Database connection unavailable");
        requireService(serviceId);
        if (contentType == null || base64 == null || base64.isBlank()) throw new IllegalArgumentException("Thiếu dữ liệu ảnh.");
        String ext = extensionFor(contentType);
        if (base64.length() > (long) MAX_BYTES * 4 / 3 + 16) throw new IllegalArgumentException("Ảnh tối đa 3 MB.");
        byte[] bytes;
        try { bytes = Base64.getDecoder().decode(base64.replaceAll("\\s", "")); }
        catch (IllegalArgumentException e) { throw new IllegalArgumentException("Dữ liệu ảnh không hợp lệ."); }
        if (bytes.length == 0 || bytes.length > MAX_BYTES) throw new IllegalArgumentException("Ảnh tối đa 3 MB.");
        if (!magicMatches(ext, bytes)) throw new IllegalArgumentException("Nội dung tệp không phải ảnh " + ext.toUpperCase() + " hợp lệ.");
        Files.createDirectories(dir());
        String key = "service-" + serviceId + "-" + UUID.randomUUID() + "." + ext;
        Path target = dir().resolve(key).normalize();
        if (!target.startsWith(dir())) throw new IllegalArgumentException("Tên tệp không hợp lệ.");
        deleteFiles(serviceId);
        Files.write(target, bytes);
        try (PreparedStatement ps = conn.prepareStatement("UPDATE Service SET image_key=? WHERE service_id=?")) {
            ps.setString(1, key);
            ps.setInt(2, serviceId);
            ps.executeUpdate();
        }
        return key;
    }

    public void remove(int serviceId) throws SQLException {
        if (conn == null) throw new SQLException("Database connection unavailable");
        requireService(serviceId);
        try (PreparedStatement ps = conn.prepareStatement("UPDATE Service SET image_key=NULL WHERE service_id=?")) {
            ps.setInt(1, serviceId);
            ps.executeUpdate();
        }
        deleteFiles(serviceId);
    }

    /** Đường dẫn tệp ảnh hiện tại của dịch vụ, hoặc null nếu chưa có ảnh. */
    public Path file(int serviceId) throws SQLException {
        if (conn == null) throw new SQLException("Database connection unavailable");
        try (PreparedStatement ps = conn.prepareStatement("SELECT image_key FROM Service WHERE service_id=?")) {
            ps.setInt(1, serviceId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next() || rs.getString(1) == null) return null;
                Path path = dir().resolve(rs.getString(1)).normalize();
                return path.startsWith(dir()) && Files.isRegularFile(path) ? path : null;
            }
        }
    }

    @Override public void close() throws SQLException { if (conn != null) conn.close(); }
}
