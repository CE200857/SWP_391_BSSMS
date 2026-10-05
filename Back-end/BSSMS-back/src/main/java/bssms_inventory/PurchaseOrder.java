/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_inventory;
import java.util.Date;
/**
 *
 * @author admin
 */
public class PurchaseOrder {
    private int purchaseOrderId;
    private int supplierId;
    private Date orderDate;
    private Date expectedDate;
    private String status;
    private double totalAmount;

    public PurchaseOrder() {}

    public PurchaseOrder(int purchaseOrderId, int supplierId, Date orderDate, Date expectedDate, String status, double totalAmount) {
        this.purchaseOrderId = purchaseOrderId;
        this.supplierId = supplierId;
        this.orderDate = orderDate;
        this.expectedDate = expectedDate;
        this.status = status;
        this.totalAmount = totalAmount;
    }

    public int getPurchaseOrderId() {
        return purchaseOrderId;
    }

    public void setPurchaseOrderId(int purchaseOrderId) {
        this.purchaseOrderId = purchaseOrderId;
    }

    public int getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(int supplierId) {
        this.supplierId = supplierId;
    }

    public Date getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(Date orderDate) {
        this.orderDate = orderDate;
    }

    public Date getExpectedDate() {
        return expectedDate;
    }

    public void setExpectedDate(Date expectedDate) {
        this.expectedDate = expectedDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(double totalAmount) {
        this.totalAmount = totalAmount;
    }
    
}
