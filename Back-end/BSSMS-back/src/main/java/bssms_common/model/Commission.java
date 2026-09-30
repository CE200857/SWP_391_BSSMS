/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_common.model;
import java.util.Date;
/**
 *
 * @author admin
 */
public class Commission {
    private int commissionId;
    private int invoiceId;
    private int staffId;
    private double commissionRate;
    private double commissionAmount;
    private Date createdAt;

    public Commission() {}

    public Commission(int commissionId, int invoiceId, int staffId, double commissionRate, double commissionAmount, Date createdAt) {
        this.commissionId = commissionId;
        this.invoiceId = invoiceId;
        this.staffId = staffId;
        this.commissionRate = commissionRate;
        this.commissionAmount = commissionAmount;
        this.createdAt = createdAt;
    }

    public int getCommissionId() {
        return commissionId;
    }

    public void setCommissionId(int commissionId) {
        this.commissionId = commissionId;
    }

    public int getInvoiceId() {
        return invoiceId;
    }

    public void setInvoiceId(int invoiceId) {
        this.invoiceId = invoiceId;
    }

    public int getStaffId() {
        return staffId;
    }

    public void setStaffId(int staffId) {
        this.staffId = staffId;
    }

    public double getCommissionRate() {
        return commissionRate;
    }

    public void setCommissionRate(double commissionRate) {
        this.commissionRate = commissionRate;
    }

    public double getCommissionAmount() {
        return commissionAmount;
    }

    public void setCommissionAmount(double commissionAmount) {
        this.commissionAmount = commissionAmount;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
    
}
