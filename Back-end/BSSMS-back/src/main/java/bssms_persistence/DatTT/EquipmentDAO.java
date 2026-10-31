package bssms_persistence.DatTT;
import bssms_catalog.Equipment;
import bssms_persistence.DBContext;
import java.sql.*;
import java.util.*;

public class EquipmentDAO extends DBContext implements AutoCloseable {
    private void requireConnection() throws SQLException {
        if (conn == null || conn.isClosed()) throw new SQLException("Database connection unavailable");
    }
    public List<Equipment> getAllEquipments() throws SQLException {
        requireConnection();
        List<Equipment> result = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM Equipment ORDER BY equipment_id DESC");
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Equipment value = new Equipment();
                    value.setEquipmentId(rs.getInt("equipment_id"));
                    value.setEquipmentName(rs.getString("equipment_name"));
                    value.setDescription(rs.getString("description"));
                    value.setStatus(rs.getString("status"));
                result.add(value);
            }
        }
        return result;
    }
    public boolean addEquipment(Equipment value) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("INSERT INTO Equipment (equipment_name, description, status) VALUES (?, ?, ?)")) {
            ps.setString(1, value.getEquipmentName());
            ps.setString(2, value.getDescription());
            ps.setString(3, value.getStatus());
            return ps.executeUpdate() > 0;
        }
    }
    public boolean updateEquipment(Equipment value) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("UPDATE Equipment SET equipment_name = ?, description = ?, status = ? WHERE equipment_id = ?")) {
            ps.setString(1, value.getEquipmentName());
            ps.setString(2, value.getDescription());
            ps.setString(3, value.getStatus());
            ps.setInt(4, value.getEquipmentId());
            return ps.executeUpdate() > 0;
        }
    }
    public boolean deleteEquipment(int id) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Equipment WHERE equipment_id = ?")) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }
}
