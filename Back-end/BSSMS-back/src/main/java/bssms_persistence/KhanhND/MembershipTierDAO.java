package bssms_persistence.KhanhND;

import bssms_persistence.DBContext;
import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

public class MembershipTierDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    private void requireConnection() throws SQLException {
        if (conn == null) throw new SQLException("Database connection is unavailable.");
    }

    public List<Map<String, Object>> getAllMembershipTiers() throws SQLException {
        requireConnection();
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT t.membership_tier_id, t.tier_name, t.description, t.discount_percent, t.min_spending, "
                + "(SELECT COUNT(*) FROM Customer c WHERE c.membership_tier_id = t.membership_tier_id AND c.status <> 'Pending') AS customer_count "
                + "FROM MembershipTier t ORDER BY t.min_spending ASC";
        try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> tier = new LinkedHashMap<>();
                tier.put("membershipTierId", rs.getInt("membership_tier_id"));
                tier.put("tierName", rs.getString("tier_name"));
                tier.put("description", rs.getString("description"));
                tier.put("discountPercent", rs.getBigDecimal("discount_percent"));
                tier.put("minSpending", rs.getBigDecimal("min_spending"));
                tier.put("customerCount", rs.getInt("customer_count"));
                list.add(tier);
            }
        }
        return list;
    }

    public Map<String, Object> getCustomerMembership(int customerId) throws SQLException {
        requireConnection();
        Map<String, Object> result = new LinkedHashMap<>();
        BigDecimal spending;
        BigDecimal currentMin;
        try (PreparedStatement ps = conn.prepareStatement("SELECT c.full_name, c.lifetime_spending, t.membership_tier_id, t.tier_name, t.description, t.discount_percent, t.min_spending "
                + "FROM Customer c JOIN MembershipTier t ON t.membership_tier_id = c.membership_tier_id WHERE c.customer_id = ?")) {
            ps.setInt(1, customerId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                spending = rs.getBigDecimal("lifetime_spending");
                currentMin = rs.getBigDecimal("min_spending");
                result.put("customerName", rs.getString("full_name"));
                result.put("lifetimeSpending", spending);
                result.put("membershipTierId", rs.getInt("membership_tier_id"));
                result.put("tierName", rs.getString("tier_name"));
                result.put("description", rs.getString("description"));
                result.put("discountPercent", rs.getBigDecimal("discount_percent"));
            }
        }
        try (PreparedStatement ps = conn.prepareStatement("SELECT TOP 1 tier_name, min_spending, discount_percent FROM MembershipTier WHERE min_spending > ? ORDER BY min_spending")) {
            ps.setBigDecimal(1, currentMin);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> next = new LinkedHashMap<>();
                    next.put("tierName", rs.getString("tier_name"));
                    next.put("minSpending", rs.getBigDecimal("min_spending"));
                    next.put("discountPercent", rs.getBigDecimal("discount_percent"));
                    next.put("remaining", rs.getBigDecimal("min_spending").subtract(spending).max(BigDecimal.ZERO));
                    result.put("nextTier", next);
                } else result.put("nextTier", null);
            }
        }
        return result;
    }

    public boolean updateDescription(int tierId, String description) throws SQLException {
        requireConnection();
        try (PreparedStatement ps = conn.prepareStatement("UPDATE MembershipTier SET description = ? WHERE membership_tier_id = ?")) {
            ps.setString(1, description);
            ps.setInt(2, tierId);
            return ps.executeUpdate() > 0;
        }
    }
}
