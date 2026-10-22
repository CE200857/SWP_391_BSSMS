package bssms_persistence.DatTT;
import bssms_catalog.Bed;
import bssms_persistence.DBContext;
import java.sql.*;
import java.util.*;

public class BedDAO extends DBContext implements AutoCloseable {
    private void requireConnection() throws SQLException {
        if (conn == null || conn.isClosed()) throw new SQLException("Database connection unavailable");
    }
    public List<Bed> getAllBeds() throws SQLException {
        requireConnection();
        List<Bed> result = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM Bed ORDER BY bed_id DESC");
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Bed value = new Bed();
                    value.setBedId(rs.getInt("bed_id"));
                    value.setRoomId(rs.getInt("room_id"));
                    value.setBedNumber(rs.getString("bed_number"));
                    value.setStatus(rs.getString("status"));
                result.add(value);
            }
        }
        return result;
    }
    public boolean addBed(Bed value) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("INSERT INTO Bed (room_id, bed_number, status) VALUES (?, ?, ?)")) {
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
