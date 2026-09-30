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
public class CustomerPackage {
    private int customerPackageId;
    private int customerId;
    private int treatmentPackageId;
    private Date purchaseDate;
    private int remainingSessions;
    private Date expiryDate;
    private String status;

    public CustomerPackage() {}

    public CustomerPackage(int customerPackageId, int customerId, int treatmentPackageId, Date purchaseDate, int remainingSessions, Date expiryDate, String status) {
        this.customerPackageId = customerPackageId;
        this.customerId = customerId;
        this.treatmentPackageId = treatmentPackageId;
        this.purchaseDate = purchaseDate;
        this.remainingSessions = remainingSessions;
        this.expiryDate = expiryDate;
        this.status = status;
    }

    public int getCustomerPackageId() {
        return customerPackageId;
    }

    public void setCustomerPackageId(int customerPackageId) {
        this.customerPackageId = customerPackageId;
    }

    public int getCustomerId() {
        return customerId;
    }

    public void setCustomerId(int customerId) {
        this.customerId = customerId;
    }

    public int getTreatmentPackageId() {
        return treatmentPackageId;
    }

    public void setTreatmentPackageId(int treatmentPackageId) {
        this.treatmentPackageId = treatmentPackageId;
    }

    public Date getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(Date purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public int getRemainingSessions() {
        return remainingSessions;
    }

    public void setRemainingSessions(int remainingSessions) {
        this.remainingSessions = remainingSessions;
    }

    public Date getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(Date expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
    
}
