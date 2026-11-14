package bssms_persistence.DatTT;
import bssms_catalog.Room;
import bssms_persistence.DBContext;
import bssms_persistence.common.SchemaSql;
import java.sql.*;
import java.util.*;

public class RoomDAO extends DBContext implements AutoCloseable {
    private void requireConnection() throws SQLException {
        if (conn == null || conn.isClosed()) throw new SQLException("Database connection unavailable");
    }
    public List<Room> getAllRooms() throws SQLException {
        requireConnection();
        List<Room> result = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement("SELECT r.*,(SELECT COUNT(*) FROM Bed b WHERE b.room_id=r.room_id) AS bed_count,"
                + "(SELECT COUNT(*) FROM Bed b WHERE b.room_id=r.room_id AND b.status='Active') AS active_bed_count FROM Room r ORDER BY r.room_name");
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Room value = new Room();
                value.setRoomId(rs.getInt("room_id"));
                value.setRoomName(rs.getString("room_name"));
                value.setRoomType(rs.getString("room_type"));
                value.setStatus(rs.getString("status"));
                value.setBedCount(rs.getInt("bed_count"));
                value.setActiveBedCount(rs.getInt("active_bed_count"));
                result.add(value);
            }
        }
        return result;
    }
    public boolean nameExists(String name, int excludeId) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT 1 FROM Room WHERE room_name=? AND room_id<>?")) {
            ps.setString(1, name); ps.setInt(2, excludeId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next(); }
        }
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
    public boolean typeChangeBlocked(Room value) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT 1 FROM Room WHERE room_id=? AND room_type<>?")) {
            ps.setInt(1, value.getRoomId()); ps.setString(2, value.getRoomType());
            try (ResultSet rs = ps.executeQuery()) { if (!rs.next()) return false; }
        }
        return !affectedByRoom(value.getRoomId()).isEmpty();
    }
    public boolean updateRoom(Room value) throws SQLException {
        requireConnection();
        boolean auto = conn.getAutoCommit();
        conn.setAutoCommit(false);
        try {
            int n;
            try (PreparedStatement ps = conn.prepareStatement("UPDATE Room SET room_name = ?, room_type = ?, status = ? WHERE room_id = ?")) {
                ps.setString(1, value.getRoomName());
                ps.setString(2, value.getRoomType());
                ps.setString(3, value.getStatus());
                ps.setInt(4, value.getRoomId());
                n = ps.executeUpdate();
            }
            if (n > 0 && "Maintenance".equals(value.getStatus())) {
                try (PreparedStatement ps = conn.prepareStatement("UPDATE Bed SET status='Maintenance' WHERE room_id=? AND use_state='Free'")) {
                    ps.setInt(1, value.getRoomId()); ps.executeUpdate();
                }
            }
            conn.commit();
            return n > 0;
        } catch (SQLException e) { conn.rollback(); throw e; }
        finally { conn.setAutoCommit(auto); }
    }
    public boolean hasBedInUse(int roomId) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT 1 FROM Bed WHERE room_id=? AND use_state='InUse'")) {
            ps.setInt(1, roomId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next(); }
        }
    }
    public List<Map<String, Object>> affectedByRoom(int roomId) throws SQLException {
        return affected("b.room_id=?", roomId);
    }
    public List<Map<String, Object>> affectedByBed(int bedId) throws SQLException {
        return affected("l.bed_id=?", bedId);
    }
    private List<Map<String, Object>> affected(String where, int id) throws SQLException {
        requireConnection();
        List<Map<String, Object>> rows = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement("SELECT a.appointment_id,a.appointment_date,l.start_time,l.end_time,c.full_name,c.phone,s.service_name,b.bed_number,r.room_name "
                + "FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id JOIN Customer c ON c.customer_id=a.customer_id "
                + "JOIN Service s ON s.service_id=l.service_id JOIN Bed b ON b.bed_id=l.bed_id JOIN Room r ON r.room_id=b.room_id "
                + "WHERE " + where + " AND l.status<>'Done' AND a.appointment_date>=CAST(SYSDATETIME() AS DATE) AND " + SchemaSql.BUSY_APPOINTMENT
                + " ORDER BY a.appointment_date,l.start_time")) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("appointmentId", rs.getInt("appointment_id"));
                    r.put("appointmentDate", String.valueOf(rs.getDate("appointment_date")));
                    r.put("startTime", String.valueOf(rs.getTime("start_time")).substring(0, 5));
                    r.put("endTime", String.valueOf(rs.getTime("end_time")).substring(0, 5));
                    r.put("customerName", rs.getString("full_name"));
                    r.put("customerPhone", rs.getString("phone"));
                    r.put("serviceName", rs.getString("service_name"));
                    r.put("roomName", rs.getString("room_name"));
                    r.put("bedNumber", rs.getString("bed_number"));
                    rows.add(r);
                }
            }
        }
        return rows;
    }
    public boolean everUsed(int roomId) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT TOP 1 1 FROM AppointmentService l JOIN Bed b ON b.bed_id=l.bed_id WHERE b.room_id=?")) {
            ps.setInt(1, roomId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next(); }
        }
    }
    public boolean deleteRoom(int id) throws SQLException {
        requireConnection();
        boolean auto = conn.getAutoCommit();
        conn.setAutoCommit(false);
        try {
            try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Bed WHERE room_id = ?")) { ps.setInt(1, id); ps.executeUpdate(); }
            int n;
            try (PreparedStatement ps = conn.prepareStatement("DELETE FROM Room WHERE room_id = ?")) { ps.setInt(1, id); n = ps.executeUpdate(); }
            conn.commit();
            return n > 0;
        } catch (SQLException e) { conn.rollback(); throw e; }
        finally { conn.setAutoCommit(auto); }
    }
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }
}
