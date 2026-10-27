package bssms_persistence.DatTT;
import bssms_catalog.TreatmentPackage;
import bssms_persistence.DBContext;
import java.sql.*;
import java.util.*;

public class TreatmentPackageDAO extends DBContext implements AutoCloseable {
    private void requireConnection() throws SQLException {
        if (conn == null || conn.isClosed()) throw new SQLException("Database connection unavailable");
    }
    public List<TreatmentPackage> getAllTreatmentPackages() throws SQLException {
        requireConnection();
        List<TreatmentPackage> result = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM TreatmentPackage ORDER BY treatment_package_id DESC");
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                TreatmentPackage value = new TreatmentPackage();
                    value.setTreatmentPackageId(rs.getInt("treatment_package_id"));
                    value.setServiceId(rs.getInt("service_id"));
                    value.setPackageName(rs.getString("package_name"));
                    value.setDescription(rs.getString("description"));
                    value.setPrice(rs.getDouble("price"));
                    value.setNumberOfSessions(rs.getInt("number_of_sessions"));
                value.setValidityDays(rs.getInt("validity_days"));value.setStatus(rs.getString("status"));
                result.add(value);
            }
        }
        return result;
    }
    public boolean createTreatmentPackage(TreatmentPackage value) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("INSERT INTO TreatmentPackage (service_id, package_name, description, price, number_of_sessions, validity_days, status) VALUES (?, ?, ?, ?, ?, COALESCE(?,180),COALESCE(?,'Active'))")) {
            ps.setInt(1, value.getServiceId());
            ps.setString(2, value.getPackageName());
            ps.setString(3, value.getDescription());
            ps.setDouble(4, value.getPrice());
            ps.setInt(5, value.getNumberOfSessions());
            ps.setObject(6,value.getValidityDays());ps.setString(7,value.getStatus());
            return ps.executeUpdate() > 0;
        }
    }
    public boolean updateTreatmentPackage(TreatmentPackage value) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("UPDATE TreatmentPackage SET service_id = ?, package_name = ?, description = ?, price = ?, number_of_sessions = ?, validity_days=COALESCE(?,validity_days), status=COALESCE(?,status) WHERE treatment_package_id = ?")) {
            ps.setInt(1, value.getServiceId());
            ps.setString(2, value.getPackageName());
            ps.setString(3, value.getDescription());
            ps.setDouble(4, value.getPrice());
            ps.setInt(5, value.getNumberOfSessions());
            ps.setObject(6,value.getValidityDays());ps.setString(7,value.getStatus());
            ps.setInt(8, value.getTreatmentPackageId());
            return ps.executeUpdate() > 0;
        }
    }
    public boolean deleteTreatmentPackage(int id) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("UPDATE TreatmentPackage SET status='Inactive' WHERE treatment_package_id = ?")) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }
}
