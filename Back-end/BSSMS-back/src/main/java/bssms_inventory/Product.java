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
    private java.math.BigDecimal stockQuantity=java.math.BigDecimal.ZERO;
    private java.math.BigDecimal reorderLevel=java.math.BigDecimal.ZERO;
    private String status;
    private String productType="Retail";
    private String unit="piece";
    public String getProductType(){return productType;}
    public void setProductType(String value){productType=value;}
    public String getUnit(){return unit;}
    public void setUnit(String value){unit=value;}
    public void setStockQuantity(java.math.BigDecimal value){stockQuantity=value;}
    public void setReorderLevel(java.math.BigDecimal value){reorderLevel=value;}
    private int supplierId; // Thêm thuộc tính liên kết Nhà cung cấp

    public Product() {}

    public Product(int productId, String productName, String description, double unitPrice, int stockQuantity, int reorderLevel, String status) {
        this.productId = productId;
        this.productName = productName;
        this.description = description;
        this.unitPrice = unitPrice;
        this.stockQuantity = java.math.BigDecimal.valueOf(stockQuantity);
        this.reorderLevel = java.math.BigDecimal.valueOf(reorderLevel);
        this.status = status;
    }

    public Product(int productId, String productName, String description, double unitPrice, int stockQuantity, int reorderLevel, String status, int supplierId) {
        this.productId = productId;
        this.productName = productName;
        this.description = description;
        this.unitPrice = unitPrice;
        this.stockQuantity = java.math.BigDecimal.valueOf(stockQuantity);
        this.reorderLevel = java.math.BigDecimal.valueOf(reorderLevel);
        this.status = status;
        this.supplierId = supplierId;
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

    public java.math.BigDecimal getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(int stockQuantity) {
        this.stockQuantity = java.math.BigDecimal.valueOf(stockQuantity);
    }

    public java.math.BigDecimal getReorderLevel() {
        return reorderLevel;
    }

    public void setReorderLevel(int reorderLevel) {
        this.reorderLevel = java.math.BigDecimal.valueOf(reorderLevel);
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    // --- Getter & Setter cho supplierId ---
    public int getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(int supplierId) {
        this.supplierId = supplierId;
    }
}