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


import java.util.List;

public class PurchaseOrder {
    private int purchaseOrderId;
    private int supplierId;
    private String supplierName;
    private String orderDate;
    private double totalAmount;
    private String status;
    private List<PurchaseOrderProduct> items; // Danh sách sản phẩm trong đơn nhập

    public PurchaseOrder() {}

    public PurchaseOrder(int purchaseOrderId, int supplierId, String supplierName, String orderDate, double totalAmount, String status, List<PurchaseOrderProduct> items) {
        this.purchaseOrderId = purchaseOrderId;
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.orderDate = orderDate;
        this.totalAmount = totalAmount;
        this.status = status;
        this.items = items;
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

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(String orderDate) {
        this.orderDate = orderDate;
    }

    public double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    // --- Phương thức bị thiếu gây ra lỗi ---
    public List<PurchaseOrderProduct> getItems() {
        return items;
    }

    public void setItems(List<PurchaseOrderProduct> items) {
        this.items = items;
    }
}