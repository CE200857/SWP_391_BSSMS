package bssms_persistence.DatTT;
import bssms_catalog.TreatmentPackage;
import bssms_persistence.DBContext;
import java.sql.*;
import java.util.*;

public class TreatmentPackageDAO extends DBContext implements AutoCloseable {
    private void requireConnection() throws SQLException {
        if (conn == null || conn.isClosed()) throw new SQLException("Database connection unavailable");
    }
    public List<TreatmentPackage> getAllTreatmentPackages(boolean activeOnly) throws SQLException {
        requireConnection();
        List<TreatmentPackage> result = new ArrayList<>();
        Map<Integer, TreatmentPackage> byId = new HashMap<>();
        try (PreparedStatement ps = conn.prepareStatement("SELECT tp.*,(SELECT COUNT(*) FROM CustomerPackage cp WHERE cp.treatment_package_id=tp.treatment_package_id AND cp.status='Active') AS customer_count "
                + "FROM TreatmentPackage tp WHERE (?=0 OR tp.status='Active') ORDER BY tp.treatment_package_id DESC")) {
            ps.setInt(1, activeOnly ? 1 : 0);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    TreatmentPackage value = new TreatmentPackage();
                    value.setTreatmentPackageId(rs.getInt("treatment_package_id"));
                    value.setPackageName(rs.getString("package_name"));
                    value.setDescription(rs.getString("description"));
                    value.setPrice(rs.getDouble("price"));
                    value.setNumberOfSessions(rs.getInt("number_of_sessions"));
                    value.setValidityDays(rs.getInt("validity_days"));
                    value.setStatus(rs.getString("status"));
                    value.setCustomerCount(rs.getInt("customer_count"));
                    value.setServiceIds(new ArrayList<>());
                    value.setServices(new ArrayList<>());
                    result.add(value);
                    byId.put(value.getTreatmentPackageId(), value);
                }
            }
        }
        try (PreparedStatement ps = conn.prepareStatement("SELECT ps.treatment_package_id,s.service_id,s.service_name,s.price,s.duration,s.status FROM TreatmentPackageService ps JOIN Service s ON s.service_id=ps.service_id ORDER BY s.service_name");
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                TreatmentPackage p = byId.get(rs.getInt("treatment_package_id"));
                if (p == null) continue;
                Map<String, Object> s = new LinkedHashMap<>();
                s.put("serviceId", rs.getInt("service_id"));
                s.put("serviceName", rs.getString("service_name"));
                s.put("price", rs.getBigDecimal("price"));
                s.put("duration", rs.getInt("duration"));
                s.put("status", rs.getString("status"));
                p.getServiceIds().add(rs.getInt("service_id"));
                p.getServices().add(s);
            }
        }
        return result;
    }
    public boolean nameExists(String name, int excludeId) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT 1 FROM TreatmentPackage WHERE package_name=? AND treatment_package_id<>?")) {
            ps.setString(1, name); ps.setInt(2, excludeId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next(); }
        }
    }
    public boolean servicesActive(List<Integer> ids) throws SQLException {
        requireConnection();
        for (Integer id : ids) {
            try (PreparedStatement ps = conn.prepareStatement("SELECT 1 FROM Service WHERE service_id=? AND status='Active'")) {
                ps.setInt(1, id);
                try (ResultSet rs = ps.executeQuery()) { if (!rs.next()) return false; }
            }
        }
        return true;
    }
    private void saveServices(int packageId, List<Integer> ids) throws SQLException {
        try (PreparedStatement del = conn.prepareStatement("DELETE FROM TreatmentPackageService WHERE treatment_package_id=?")) {
            del.setInt(1, packageId); del.executeUpdate();
        }
        try (PreparedStatement ins = conn.prepareStatement("INSERT INTO TreatmentPackageService (treatment_package_id, service_id) VALUES (?, ?)")) {
            for (Integer id : new LinkedHashSet<>(ids)) { ins.setInt(1, packageId); ins.setInt(2, id); ins.addBatch(); }
            ins.executeBatch();
        }
    }
    private <T> T inTransaction(SqlWork<T> work) throws SQLException {
        boolean auto = conn.getAutoCommit();
        conn.setAutoCommit(false);
        try { T r = work.run(); conn.commit(); return r; }
        catch (SQLException | RuntimeException e) { conn.rollback(); throw e; }
        finally { conn.setAutoCommit(auto); }
    }
    private interface SqlWork<T> { T run() throws SQLException; }

    public boolean createTreatmentPackage(TreatmentPackage value) throws SQLException {
        requireConnection();
        return inTransaction(() -> {
            int id;
            try (PreparedStatement ps = conn.prepareStatement("INSERT INTO TreatmentPackage (package_name, description, price, number_of_sessions, validity_days, status) VALUES (?, ?, ?, ?, COALESCE(?,180), COALESCE(?,'Active'))", Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, value.getPackageName());
                ps.setString(2, value.getDescription());
                ps.setDouble(3, value.getPrice());
                ps.setInt(4, value.getNumberOfSessions());
                ps.setObject(5, value.getValidityDays());
                ps.setString(6, value.getStatus());
                ps.executeUpdate();
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (!keys.next()) return false;
                    id = keys.getInt(1);
                }
            }
            saveServices(id, value.getServiceIds());
            value.setTreatmentPackageId(id);
            return true;
        });
    }
    public boolean updateTreatmentPackage(TreatmentPackage value) throws SQLException {
        requireConnection();
        return inTransaction(() -> {
            try (PreparedStatement ps = conn.prepareStatement("UPDATE TreatmentPackage SET package_name = ?, description = ?, price = ?, number_of_sessions = ?, validity_days=COALESCE(?,validity_days), status=COALESCE(?,status) WHERE treatment_package_id = ?")) {
                ps.setString(1, value.getPackageName());
                ps.setString(2, value.getDescription());
                ps.setDouble(3, value.getPrice());
                ps.setInt(4, value.getNumberOfSessions());
                ps.setObject(5, value.getValidityDays());
                ps.setString(6, value.getStatus());
                ps.setInt(7, value.getTreatmentPackageId());
                if (ps.executeUpdate() == 0) return false;
            }
            saveServices(value.getTreatmentPackageId(), value.getServiceIds());
            return true;
        });
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
