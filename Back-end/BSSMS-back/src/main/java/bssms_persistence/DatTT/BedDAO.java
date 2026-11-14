package bssms_persistence.DatTT;
import bssms_catalog.Bed;
import bssms_persistence.DBContext;
import java.sql.*;
import java.util.*;

public class BedDAO extends DBContext implements AutoCloseable {
    private void requireConnection() throws SQLException {
        if (conn == null || conn.isClosed()) throw new SQLException("Database connection unavailable");
    }
    public List<Bed> getAllBeds(Integer roomId) throws SQLException {
        requireConnection();
        List<Bed> result = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement("SELECT b.*,r.room_name,r.room_type FROM Bed b JOIN Room r ON r.room_id=b.room_id "
                + "WHERE (? IS NULL OR b.room_id=?) ORDER BY r.room_name,b.bed_number")) {
            ps.setObject(1, roomId); ps.setObject(2, roomId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Bed value = new Bed();
                    value.setBedId(rs.getInt("bed_id"));
                    value.setRoomId(rs.getInt("room_id"));
                    value.setBedNumber(rs.getString("bed_number"));
                    value.setStatus(rs.getString("status"));
                    value.setUseState(rs.getString("use_state"));
                    value.setRoomName(rs.getString("room_name"));
                    value.setRoomType(rs.getString("room_type"));
                    result.add(value);
                }
            }
        }
        return result;
    }
    public boolean numberExists(int roomId, String number, int excludeId) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT 1 FROM Bed WHERE room_id=? AND bed_number=? AND bed_id<>?")) {
            ps.setInt(1, roomId); ps.setString(2, number); ps.setInt(3, excludeId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next(); }
        }
    }
    public String roomStatus(int roomId) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT status FROM Room WHERE room_id=?")) {
            ps.setInt(1, roomId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getString(1) : null; }
        }
    }
    public String useState(int bedId) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT use_state FROM Bed WHERE bed_id=?")) {
            ps.setInt(1, bedId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getString(1) : null; }
        }
    }
    public boolean everUsed(int bedId) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT TOP 1 1 FROM AppointmentService WHERE bed_id=?")) {
            ps.setInt(1, bedId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next(); }
        }
    }
    public boolean addBed(Bed value) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("INSERT INTO Bed (room_id, bed_number, status, use_state) VALUES (?, ?, ?, 'Free')")) {
            ps.setInt(1, value.getRoomId());
            ps.setString(2, value.getBedNumber());
            ps.setString(3, value.getStatus());
            return ps.executeUpdate() > 0;
        }
    }
    public boolean updateBed(Bed value) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("UPDATE Bed SET room_id = ?, bed_number = ?, status = ? WHERE bed_id = ?")) {
            ps.setInt(1, value.getRoomId());
            ps.setString(2, value.getBedNumber());
            ps.setString(3, value.getStatus());
            ps.setInt(4, value.getBedId());
            return ps.executeUpdate() > 0;
        }
    }
    public boolean deleteBed(int id) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Bed WHERE bed_id = ?")) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }
}
