package bssms_persistence.DatTT;

import bssms_catalog.Service;
import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ServiceDAO extends DBContext implements AutoCloseable {
    private void requireConnection() throws SQLException {
        if (conn == null || conn.isClosed()) {
            throw new SQLException("Database connection is unavailable");
        }
    }

    private Service readService(ResultSet rs) throws SQLException {
        Service value=new Service(rs.getInt("service_id"),rs.getString("service_name"),rs.getString("description"),rs.getDouble("price"),rs.getInt("duration"),rs.getString("status"));
        value.setCategory(rs.getString("category"));value.setRequiredRoomType(rs.getString("required_room_type"));
        value.setTourCount(rs.getBigDecimal("tour_count") == null ? null : rs.getBigDecimal("tour_count").doubleValue());
        try {
            String key = rs.getString("image_key");
            if (key != null && !key.isBlank()) value.setImageUrl("/api/service-image/" + value.getServiceId() + "?v=" + Integer.toHexString(key.hashCode()));
        } catch (SQLException ignored) {
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
        ps.setBigDecimal(8, java.math.BigDecimal.valueOf(service.getTourCount() == null ? proposedTours(service.getDuration()) : service.getTourCount()));
    }

    public static double proposedTours(int duration) {
        return Math.max(1, (int) Math.ceil(duration / 60.0));
    }

    public void saveTechnicians(int serviceId, java.util.List<Integer> technicianIds) throws SQLException {
        if (technicianIds == null) return;
        try (PreparedStatement ps = conn.prepareStatement("DELETE FROM StaffService WHERE service_id=?")) { ps.setInt(1, serviceId); ps.executeUpdate(); }
        for (Integer staff : new java.util.LinkedHashSet<>(technicianIds)) {
            try (PreparedStatement ps = conn.prepareStatement("INSERT INTO StaffService(staff_id,service_id) SELECT staff_id,? FROM Staff WHERE staff_id=? AND role='Technician'")) {
                ps.setInt(1, serviceId); ps.setInt(2, staff); ps.executeUpdate();
            }
        }
    }

    public java.util.List<java.util.Map<String,Object>> technicians(int serviceId) throws SQLException {
        return new bssms_persistence.common.Workflow(conn, 0).query("SELECT s.staff_id,s.full_name,CASE WHEN ss.service_id IS NULL THEN 0 ELSE 1 END AS qualified FROM Staff s LEFT JOIN StaffService ss ON ss.staff_id=s.staff_id AND ss.service_id=? WHERE s.role='Technician' AND s.status='Active' ORDER BY s.full_name", serviceId);
    }

    public int addService(Service service) throws SQLException {
        requireConnection();
        String sql = "INSERT INTO Service (service_name, description, price, duration, status, category, required_room_type, tour_count) VALUES (?, ?, ?, ?, ?, COALESCE(?,'General'), ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            bindService(ps, service);
            return ps.executeUpdate();
        }
    }

    public int addServiceReturningId(Service service) throws SQLException {
        requireConnection();
        String sql = "INSERT INTO Service (service_name, description, price, duration, status, category, required_room_type, tour_count) VALUES (?, ?, ?, ?, ?, COALESCE(?,'General'), ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS)) {
            bindService(ps, service);
            if (ps.executeUpdate() != 1) return 0;
            try (ResultSet keys = ps.getGeneratedKeys()) { return keys.next() ? keys.getInt(1) : 0; }
        }
    }

    public int updateService(Service service) throws SQLException {
        requireConnection();
        String sql = "UPDATE Service SET service_name = ?, description = ?, price = ?, duration = ?, status = ?, category=COALESCE(?,category), required_room_type=COALESCE(?,required_room_type), tour_count=? WHERE service_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            bindService(ps, service);
            ps.setInt(9, service.getServiceId());
            return ps.executeUpdate();
        }
    }

    public int deleteService(int id) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("UPDATE Service SET status='Inactive' WHERE service_id=?")) {
            ps.setInt(1, id);
            return ps.executeUpdate();
        }
    }
    public int futureAppointments(int id) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(DISTINCT a.appointment_id) FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id WHERE l.service_id=? AND a.status IN ('Pending','Confirmed') AND a.appointment_date>=CAST(SYSDATETIME() AS date)")) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getInt(1) : 0; }
        }
    }

    @Override
    public void close() throws SQLException {
        if (conn != null) conn.close();
    }
}
