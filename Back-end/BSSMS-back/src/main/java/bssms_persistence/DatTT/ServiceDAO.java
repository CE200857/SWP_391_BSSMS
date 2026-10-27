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
        value.setCategory(rs.getString("category"));value.setRequiredRoomType(rs.getString("required_room_type"));return value;
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

    public int updateService(Service service) throws SQLException {
        requireConnection();
        String sql = "UPDATE Service SET service_name = ?, description = ?, price = ?, duration = ?, status = ?, category=COALESCE(?,category), required_room_type=NULLIF(COALESCE(?,required_room_type),'') WHERE service_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            bindService(ps, service);
            ps.setInt(8, service.getServiceId());
            return ps.executeUpdate();
        }
    }

    public int deleteService(int id) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("UPDATE Service SET status='Inactive' WHERE service_id = ?")) {
            ps.setInt(1, id);
            return ps.executeUpdate();
        }
    }

    @Override
    public void close() throws SQLException {
        if (conn != null) conn.close();
    }
}
