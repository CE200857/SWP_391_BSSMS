/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_inventory;

/**
 *
 * @author admin
 */
public class Product {
    private int productId;
    private String productName;
    private String description;
    private double unitPrice;
    private int stockQuantity;
    private int reorderLevel;
    private String status;

    public Product() {}

    public Product(int productId, String productName, String description, double unitPrice, int stockQuantity, int reorderLevel, String status) {
        this.productId = productId;
        this.productName = productName;
        this.description = description;
        this.unitPrice = unitPrice;
        this.stockQuantity = stockQuantity;
        this.reorderLevel = reorderLevel;
        this.status = status;
    }

    public int getProductId() {
        return productId;
    }

    public void setProductId(int productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(double unitPrice) {
        this.unitPrice = unitPrice;
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(int stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public int getReorderLevel() {
        return reorderLevel;
    }

    public void setReorderLevel(int reorderLevel) {
        this.reorderLevel = reorderLevel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
    
}
