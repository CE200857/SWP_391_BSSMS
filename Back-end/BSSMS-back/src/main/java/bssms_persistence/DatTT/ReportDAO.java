package bssms_persistence.DatTT;
import bssms_persistence.DBContext;
import java.sql.*;
import java.util.*;

public class ReportDAO extends DBContext implements AutoCloseable {
    public Map<String, Object> getDashboardMetrics() throws SQLException {
        if (conn == null || conn.isClosed()) throw new SQLException("Database connection unavailable");
        Map<String, Object> result = new HashMap<>();
        try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM Customer");
                ResultSet rs = ps.executeQuery()) {
            if (rs.next()) result.put("totalCustomers", rs.getInt(1));
        }
        try (PreparedStatement ps = conn.prepareStatement("SELECT SUM(s.price) FROM Appointment a JOIN Service s ON a.service_id = s.service_id WHERE a.status = 'Completed'");
                ResultSet rs = ps.executeQuery()) {
            if (rs.next()) result.put("totalRevenue", rs.getDouble(1));
        }
        try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM Appointment WHERE CAST(appointment_date AS DATE) = CAST(GETDATE() AS DATE)");
                ResultSet rs = ps.executeQuery()) {
            if (rs.next()) result.put("todayAppointments", rs.getInt(1));
        }
        return result;
    }
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }
}
