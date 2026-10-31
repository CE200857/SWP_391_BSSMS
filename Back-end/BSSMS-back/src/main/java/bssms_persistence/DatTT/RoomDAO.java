package bssms_persistence.DatTT;
import bssms_catalog.Room;
import bssms_persistence.DBContext;
import java.sql.*;
import java.util.*;

public class RoomDAO extends DBContext implements AutoCloseable {
    private void requireConnection() throws SQLException {
        if (conn == null || conn.isClosed()) throw new SQLException("Database connection unavailable");
    }
    public List<Room> getAllRooms() throws SQLException {
        requireConnection();
        List<Room> result = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM Room ORDER BY room_id DESC");
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Room value = new Room();
                    value.setRoomId(rs.getInt("room_id"));
                    value.setRoomName(rs.getString("room_name"));
                    value.setRoomType(rs.getString("room_type"));
                    value.setStatus(rs.getString("status"));
                result.add(value);
            }
        }
        return result;
    }
    public boolean addRoom(Room value) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("INSERT INTO Room (room_name, room_type, status) VALUES (?, ?, ?)")) {
            ps.setString(1, value.getRoomName());
            ps.setString(2, value.getRoomType());
            ps.setString(3, value.getStatus());
            return ps.executeUpdate() > 0;
        }
    }
    public boolean updateRoom(Room value) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("UPDATE Room SET room_name = ?, room_type = ?, status = ? WHERE room_id = ?")) {
            ps.setString(1, value.getRoomName());
            ps.setString(2, value.getRoomType());
            ps.setString(3, value.getStatus());
            ps.setInt(4, value.getRoomId());
            return ps.executeUpdate() > 0;
        }
    }
    public boolean deleteRoom(int id) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Room WHERE room_id = ?")) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }
}
