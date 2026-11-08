package bssms_persistence.DatTT;

import bssms_catalog.Service;
import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/** One DAO/connection per request. Never store this DAO in a Servlet field. */
public class ServiceDAO extends DBContext implements AutoCloseable {
    private void requireConnection() throws SQLException {
        if (conn == null || conn.isClosed()) {
            throw new SQLException("Database connection is unavailable");
        }
    }

    private Service readService(ResultSet rs) throws SQLException {
        Service value=new Service(rs.getInt("service_id"),rs.getString("service_name"),rs.getString("description"),rs.getDouble("price"),rs.getInt("duration"),rs.getString("status"));
        value.setCategory(rs.getString("category"));value.setRequiredRoomType(rs.getString("required_room_type"));
        try {
            String key = rs.getString("image_key");
            if (key != null && !key.isBlank()) value.setImageUrl("/api/service-image/" + value.getServiceId() + "?v=" + Integer.toHexString(key.hashCode()));
        } catch (SQLException ignored) {
            // cơ sở dữ liệu chưa có cột image_key (chưa chạy 14_Service_Image.sql): bỏ qua ảnh
        }
        return value;
    }

    public List<Service> getAllServices() throws SQLException {
        requireConnection();
        List<Service> services = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM Service");
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) services.add(readService(rs));
        }
        return services;
    }

    public Service getServiceById(int id) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT * FROM Service WHERE service_id = ?")) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? readService(rs) : null;
            }
        }
    }

    private void bindService(PreparedStatement ps, Service service) throws SQLException {
        ps.setString(1, service.getServiceName());
        ps.setString(2, service.getDescription());
        ps.setDouble(3, service.getPrice());
        ps.setInt(4, service.getDuration());
        ps.setString(5, service.getStatus());
        ps.setString(6,service.getCategory());ps.setString(7,service.getRequiredRoomType());
    }

    public int addService(Service service) throws SQLException {
        requireConnection();
        String sql = "INSERT INTO Service (service_name, description, price, duration, status, category, required_room_type) VALUES (?, ?, ?, ?, ?, COALESCE(?,'General'), NULLIF(?,''))";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            bindService(ps, service);
            return ps.executeUpdate();
        }
    }

    /** Thêm dịch vụ và trả về mã mới (để tải ảnh lên ngay sau đó). */
    public int addServiceReturningId(Service service) throws SQLException {
        requireConnection();
        String sql = "INSERT INTO Service (service_name, description, price, duration, status, category, required_room_type) VALUES (?, ?, ?, ?, ?, COALESCE(?,'General'), NULLIF(?,''))";
        try (PreparedStatement ps = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS)) {
            bindService(ps, service);
            if (ps.executeUpdate() != 1) return 0;
            try (ResultSet keys = ps.getGeneratedKeys()) { return keys.next() ? keys.getInt(1) : 0; }
        }
    }

    public int updateService(Service service) throws SQLException {
        requireConnection();
        String sql = "UPDATE Service SET service_name = ?, description = ?, price = ?, duration = ?, status = ?, category=COALESCE(?,category), required_room_type=NULLIF(COALESCE(?,required_room_type),'') WHERE service_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            bindService(ps, service);
            ps.setInt(8, service.getServiceId());
            return ps.executeUpdate();
        }
    }

    /**
     * Xóa vĩnh viễn dịch vụ. Dịch vụ đã có lịch hẹn, hóa đơn, gói liệu trình, đánh giá hoặc hoa hồng thì không xóa được
     * (hãy chuyển sang "Ngừng hoạt động"). Kỹ năng nhân viên, thiết bị và định mức vật tư của dịch vụ được xóa cùng.
     */
    public int deleteService(int id) throws SQLException {
        requireConnection();
        boolean auto = conn.getAutoCommit();
        conn.setAutoCommit(false);
        try {
            // Có dữ liệu nghiệp vụ nào dùng dịch vụ này không? (bảng hoặc cột chưa có trong database cũ thì bỏ qua)
            for (String table : new String[] {"Appointment", "AppointmentService", "InvoiceService", "TreatmentPackage", "ServiceFeedback", "Commission"}) {
                try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM " + table + " WHERE service_id=?")) {
                    ps.setInt(1, id);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next() && rs.getInt(1) > 0)
                            throw new bssms_persistence.common.WorkflowException(409,
                                "Dịch vụ đã có lịch hẹn, hóa đơn, gói liệu trình hoặc đánh giá nên không xóa vĩnh viễn được. Hãy bấm \"Ngừng\" để chuyển sang không hoạt động.");
                    }
                } catch (SQLException e) {
                    if (e.getErrorCode() != 208 && e.getErrorCode() != 207) throw e;
                }
            }
            for (String sql : new String[] {"DELETE FROM StaffService WHERE service_id=?", "DELETE FROM ServiceEquipment WHERE service_id=?", "DELETE FROM ServiceMaterial WHERE service_id=?"}) {
                try (PreparedStatement ps = conn.prepareStatement(sql)) { ps.setInt(1, id); ps.executeUpdate(); }
            }
            int deleted;
            try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Service WHERE service_id = ?")) {
                ps.setInt(1, id);
                deleted = ps.executeUpdate();
            }
            conn.commit();
            if (deleted > 0) ServiceImageDAO.deleteFiles(id);
            return deleted;
        } catch (RuntimeException | SQLException e) {
            conn.rollback();
            throw e;
        } finally {
            conn.setAutoCommit(auto);
        }
    }

    @Override
    public void close() throws SQLException {
        if (conn != null) conn.close();
    }
}
