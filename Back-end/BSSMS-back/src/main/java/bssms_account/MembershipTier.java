package bssms_account;

/** Typed data exchanged by DAO and controller; nullable fields represent absent SQL values. */
public class MembershipTier implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private Integer membershipTierId;
    private String tierName;
    private String description;
    private java.math.BigDecimal discountPercent;
    private java.math.BigDecimal minSpending;

    public Integer getMembershipTierId() { return membershipTierId; }
    public void setMembershipTierId(Integer membershipTierId) { this.membershipTierId = membershipTierId; }

    public String getTierName() { return tierName; }
    public void setTierName(String tierName) { this.tierName = tierName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public java.math.BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(java.math.BigDecimal discountPercent) { this.discountPercent = discountPercent; }

    public java.math.BigDecimal getMinSpending() { return minSpending; }
    public void setMinSpending(java.math.BigDecimal minSpending) { this.minSpending = minSpending; }
}
