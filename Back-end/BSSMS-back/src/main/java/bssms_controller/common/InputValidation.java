package bssms_controller.common;

import bssms_inventory.Product;
import bssms_inventory.Supplier;
import java.time.LocalDate;

public final class InputValidation {
    private InputValidation() {}
    public static void rethrowIfInvalid(Exception e) {
        if(e instanceof IllegalArgumentException || e instanceof NullPointerException
                || e instanceof ClassCastException || e instanceof com.google.gson.JsonParseException
                || e instanceof java.time.format.DateTimeParseException)
            throw new IllegalArgumentException("Invalid request data",e);
    }
    public static String text(String value,String name) {
        if(value==null || value.trim().isEmpty()) throw new IllegalArgumentException(name+" is required");
        return value.trim();
    }
    public static void positive(int value,String name) { if(value<=0) throw new IllegalArgumentException(name+" must be positive"); }
    public static void product(Product value,boolean update) {
        if(value==null) throw new IllegalArgumentException("Product is required");
        value.setProductName(text(value.getProductName(),"productName"));
        if(!Double.isFinite(value.getUnitPrice()) || value.getUnitPrice()<0 || (value.getStockQuantity()==null || value.getStockQuantity().signum()<0) || (value.getReorderLevel()==null || value.getReorderLevel().signum()<0))
            throw new IllegalArgumentException("Product price and quantities cannot be negative");
        if(value.getStockQuantity().scale()>3 || value.getReorderLevel().scale()>3) throw new IllegalArgumentException("Stock quantities allow at most 3 decimal places.");
        if(!java.util.Arrays.asList("Retail","Consumable").contains(value.getProductType())) throw new IllegalArgumentException("Invalid productType.");
        value.setUnit(text(value.getUnit(),"unit"));
        if(value.getStatus()==null) value.setStatus("Active");
        if(!java.util.Arrays.asList("Active","Inactive").contains(value.getStatus())) throw new IllegalArgumentException("Invalid product status.");
        if(update) positive(value.getProductId(),"productId");
    }
    public static void supplier(Supplier value,boolean update) {
        if(value==null) throw new IllegalArgumentException("Supplier is required");
        value.setSupplierName(text(value.getSupplierName(),"supplierName"));
        if(update) positive(value.getSupplierId(),"supplierId");
    }
    public static void percent(double value) {
        if(!Double.isFinite(value)||value<=0||value>100) throw new IllegalArgumentException("Percentage must be in (0,100]");
    }
    public static void dates(String start,String end) {
        if(LocalDate.parse(text(end,"endDate")).isBefore(LocalDate.parse(text(start,"startDate"))))
            throw new IllegalArgumentException("End date must not precede start date");
    }
}
