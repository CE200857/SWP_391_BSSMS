/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_account;

/**
 *
 * @author admin
 */
public class MembershipTier {
    private int membershipTierId;
    private String tierName;
    private String description;
    private double discountPercent;
    private double minSpending;

    public MembershipTier() {}

    public MembershipTier(int membershipTierId, String tierName, String description, double discountPercent, double minSpending) {
        this.membershipTierId = membershipTierId;
        this.tierName = tierName;
        this.description = description;
        this.discountPercent = discountPercent;
        this.minSpending = minSpending;
    }

    public int getMembershipTierId() {
        return membershipTierId;
    }

    public void setMembershipTierId(int membershipTierId) {
        this.membershipTierId = membershipTierId;
    }

    public String getTierName() {
        return tierName;
    }

    public void setTierName(String tierName) {
        this.tierName = tierName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getDiscountPercent() {
        return discountPercent;
    }

    public void setDiscountPercent(double discountPercent) {
        this.discountPercent = discountPercent;
    }

    public double getMinSpending() {
        return minSpending;
    }

    public void setMinSpending(double minSpending) {
        this.minSpending = minSpending;
    }
    
}
