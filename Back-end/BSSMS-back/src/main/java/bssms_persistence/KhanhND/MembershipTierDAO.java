package bssms_persistence.KhanhND;

import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.sql.Statement;

public class MembershipTierDAO extends DBContext {

    public List<Map<String, Object>> getAllMembershipTiers()
            throws SQLException {

        List<Map<String, Object>> list = new ArrayList<>();

        String sql = "SELECT membership_tier_id, tier_name, "
                + "description, discount_percent, min_spending "
                + "FROM MembershipTier "
                + "ORDER BY min_spending ASC";

        if (conn == null) {
            throw new SQLException("Database connection is unavailable.");
        }

        try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Map<String, Object> tier = new HashMap<>();

                tier.put(
                        "membershipTierId",
                        rs.getInt("membership_tier_id")
                );
                tier.put("tierName", rs.getString("tier_name"));
                tier.put("description", rs.getString("description"));
                tier.put(
                        "discountPercent",
                        rs.getBigDecimal("discount_percent")
                );
                tier.put(
                        "minSpending",
                        rs.getBigDecimal("min_spending")
                );

                list.add(tier);
            }
        }

        return list;
    }

    public int createMembershipTier(
            String tierName,
            String description,
            BigDecimal discountPercent,
            BigDecimal minSpending
    ) throws SQLException {

        String sql = "INSERT INTO MembershipTier "
                + "(tier_name, description, discount_percent, min_spending) "
                + "VALUES (?, ?, ?, ?)";

        if (conn == null) {
            throw new SQLException("Database connection is unavailable.");
        }

        try (PreparedStatement ps = conn.prepareStatement(
                sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, tierName);
            ps.setString(2, description);
            ps.setBigDecimal(3, discountPercent);
            ps.setBigDecimal(4, minSpending);

            int affectedRows = ps.executeUpdate();

            if (affectedRows == 0) {
                throw new SQLException("Creating membership tier failed.");
            }

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }

            throw new SQLException("Unable to retrieve generated tier ID.");
        }
    }

    public boolean updateMembershipTier(
            int membershipTierId,
            String tierName,
            String description,
            BigDecimal discountPercent,
            BigDecimal minSpending
    ) throws SQLException {

        String sql = "UPDATE MembershipTier "
                + "SET tier_name = ?, description = ?, "
                + "discount_percent = ?, min_spending = ? "
                + "WHERE membership_tier_id = ?";

        if (conn == null) {
            throw new SQLException("Database connection is unavailable.");
        }

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, tierName);
            ps.setString(2, description);
            ps.setBigDecimal(3, discountPercent);
            ps.setBigDecimal(4, minSpending);
            ps.setInt(5, membershipTierId);

            return ps.executeUpdate() > 0;
        }
    }

    public boolean deleteMembershipTier(
            int membershipTierId
    ) throws SQLException {

        String sql = "DELETE FROM MembershipTier "
                + "WHERE membership_tier_id = ?";

        if (conn == null) {
            throw new SQLException("Database connection is unavailable.");
        }

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, membershipTierId);

            return ps.executeUpdate() > 0;
        }
    }

    // Preview how many customers will be transferred.
    public Map<String, Object> getTierTransferPreview(
            int sourceTierId,
            int targetTierId
    ) throws SQLException {

        if (sourceTierId <= 0 || targetTierId <= 0) {
            throw new IllegalArgumentException(
                    "Membership tier IDs must be positive."
            );
        }

        if (sourceTierId == targetTierId) {
            throw new IllegalArgumentException(
                    "Source and target tiers must be different."
            );
        }

        if (conn == null) {
            throw new SQLException("Database connection is unavailable.");
        }

        String sql = "SELECT oldTier.membership_tier_id AS source_id, "
                + "oldTier.tier_name AS source_name, "
                + "newTier.membership_tier_id AS target_id, "
                + "newTier.tier_name AS target_name, "
                + "(SELECT COUNT(*) FROM " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c "
                + "WHERE c.membership_tier_id = oldTier.membership_tier_id) "
                + "AS customer_count "
                + "FROM MembershipTier oldTier "
                + "CROSS JOIN MembershipTier newTier "
                + "WHERE oldTier.membership_tier_id = ? "
                + "AND newTier.membership_tier_id = ?";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, sourceTierId);
            ps.setInt(2, targetTierId);

            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }

                Map<String, Object> result = new HashMap<>();
                result.put("sourceTierId", rs.getInt("source_id"));
                result.put("sourceTierName", rs.getString("source_name"));
                result.put("targetTierId", rs.getInt("target_id"));
                result.put("targetTierName", rs.getString("target_name"));
                result.put("customerCount", rs.getInt("customer_count"));

                return result;
            }
        }
    }

// Transfer all customers from one tier to another in a transaction.
    public int transferCustomersToTier(
            int sourceTierId,
            int targetTierId
    ) throws SQLException {

        if (sourceTierId <= 0 || targetTierId <= 0) {
            throw new IllegalArgumentException(
                    "Membership tier IDs must be positive."
            );
        }

        if (sourceTierId == targetTierId) {
            throw new IllegalArgumentException(
                    "Source and target tiers must be different."
            );
        }

        if (conn == null) {
            throw new SQLException("Database connection is unavailable.");
        }

        boolean originalAutoCommit = conn.getAutoCommit();

        try {
            conn.setAutoCommit(false);

            if (!membershipTierExists(sourceTierId)) {
                throw new IllegalArgumentException(
                        "Source membership tier does not exist."
                );
            }

            if (!membershipTierExists(targetTierId)) {
                throw new IllegalArgumentException(
                        "Target membership tier does not exist."
                );
            }

            String sql = "UPDATE Customer "
                    + "SET membership_tier_id = ? "
                    + "WHERE membership_tier_id = ?";

            int affectedRows;

            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, targetTierId);
                ps.setInt(2, sourceTierId);
                affectedRows = ps.executeUpdate();
            }

            conn.commit();
            return affectedRows;

        } catch (SQLException e) {
            rollbackQuietly();
            throw e;

        } catch (RuntimeException e) {
            rollbackQuietly();
            throw e;

        } finally {
            conn.setAutoCommit(originalAutoCommit);
        }
    }

    private boolean membershipTierExists(int tierId)
            throws SQLException {

        String sql = "SELECT 1 FROM MembershipTier "
                + "WHERE membership_tier_id = ?";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tierId);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    private void rollbackQuietly() {
        try {
            conn.rollback();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

}
