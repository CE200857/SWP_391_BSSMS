/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_api.KhanhLTQ;

public class CommissionReportDTO {
    private int staffId;
    private String staffName;
    private int totalInvoices;
    private double totalCommissionAmount;

    public CommissionReportDTO() {}

    public CommissionReportDTO(int staffId, String staffName, int totalInvoices, double totalCommissionAmount) {
        this.staffId = staffId;
        this.staffName = staffName;
        this.totalInvoices = totalInvoices;
        this.totalCommissionAmount = totalCommissionAmount;
    }

    public int getStaffId() {
        return staffId;
    }

    public void setStaffId(int staffId) {
        this.staffId = staffId;
    }

    public String getStaffName() {
        return staffName;
    }

    public void setStaffName(String staffName) {
        this.staffName = staffName;
    }

    public int getTotalInvoices() {
        return totalInvoices;
    }

    public void setTotalInvoices(int totalInvoices) {
        this.totalInvoices = totalInvoices;
    }

    public double getTotalCommissionAmount() {
        return totalCommissionAmount;
    }

    public void setTotalCommissionAmount(double totalCommissionAmount) {
        this.totalCommissionAmount = totalCommissionAmount;
    }
}