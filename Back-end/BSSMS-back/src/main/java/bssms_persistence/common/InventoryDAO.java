package bssms_persistence.common;
import bssms_persistence.DBContext;
import com.google.gson.*;
import java.sql.*;
import java.math.BigDecimal;
import java.util.*;
public class InventoryDAO extends DBContext implements AutoCloseable {
    public void close() throws SQLException {if(conn!=null)conn.close();}
    public Object create(JsonObject data) throws SQLException {
        Workflow w=workflow();w.roles("Manager");
        int supplier=data.get("supplierId").getAsBigDecimal().intValueExact();
        JsonArray items=data.getAsJsonArray("items");
        if(items==null||items.size()==0) throw new IllegalArgumentException("Items required.");
        Set<Integer> ids=new HashSet<>();
        for(JsonElement e:items) {
            JsonObject item=e.getAsJsonObject();int id=item.get("productId").getAsBigDecimal().intValueExact();
            int qty=item.get("quantity").getAsBigDecimal().intValueExact();
            if(qty<=0||!ids.add(id)) throw new IllegalArgumentException("Invalid or duplicate purchase line.");
        }
        return w.transaction(()->{
            w.one("SELECT supplier_id FROM dbo.Supplier WHERE supplier_id=? AND status='Active'",supplier);
            List<Map<String,Object>> lines=new ArrayList<>();
            BigDecimal total=BigDecimal.ZERO;
            for(JsonElement e:items) {
                JsonObject item=e.getAsJsonObject();
                int productId=item.get("productId").getAsBigDecimal().intValueExact();
                int quantity=item.get("quantity").getAsBigDecimal().intValueExact();
                BigDecimal price=supplierPrice(w,supplier,productId);
                Map<String,Object> purchaseUnit=purchaseUnit(w,productId);
                total=total.add(price.multiply(BigDecimal.valueOf(quantity)));
                lines.add(Map.of(
                    "productId",productId,
                    "quantity",quantity,
                    "unitPrice",price,
                    "purchaseUnit",purchaseUnit.get("purchaseUnit"),
                    "conversionFactor",purchaseUnit.get("conversionFactor")
                ));
            }
            int id=Workflow.id(w.one("INSERT PurchaseOrder(supplier_id,order_date,expected_date,status,total_amount,created_by_staff_id) OUTPUT inserted.purchase_order_id VALUES(?,CONVERT(datetime2,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time'),?,'Draft',?,?)",supplier,data.has("expectedDate")&&!data.get("expectedDate").isJsonNull()?data.get("expectedDate").getAsString():null,total,bssms_common.LoginIdentity.staffId(requireActorAccountId())).get("purchaseOrderId"));
            for(Map<String,Object> line:lines) {
                int productId=(Integer)line.get("productId");
                int quantity=(Integer)line.get("quantity");
                BigDecimal price=(BigDecimal)line.get("unitPrice");
                w.update("INSERT PurchaseOrderProduct(purchase_order_id,product_id,quantity,unit_price,subtotal,purchase_unit,unit_conversion_factor) VALUES(?,?,?,?,?,?,?)",id,productId,quantity,price,price.multiply(BigDecimal.valueOf(quantity)),line.get("purchaseUnit"),line.get("conversionFactor"));
            }
            return w.one("SELECT * FROM PurchaseOrder WHERE purchase_order_id=?",id);
        });
    }
    public Object action(JsonObject data) throws SQLException {
        Workflow w=workflow();w.roles("Manager");String action=data.get("action").getAsString();
        if("adjustStock".equals(action)) {
            if(data.get("quantityChange").getAsBigDecimal().scale()>3) throw new IllegalArgumentException("At most 3 decimal places allowed.");
            w.call("usp_AdjustStock",requireActorAccountId(),data.get("productId").getAsBigDecimal().intValueExact(),data.get("quantityChange").getAsBigDecimal(),data.get("reason").getAsString());
            return Map.of("message","Stock adjusted.");
        }
        int id=data.get("purchaseOrderId").getAsBigDecimal().intValueExact();
        if("update".equals(action)) {
            return w.transaction(()->{
                if(w.query("SELECT purchase_order_id FROM PurchaseOrder WHERE purchase_order_id=? AND status='Draft'",id).isEmpty())throw new WorkflowException(409,"Only a draft can be edited.");
                int supplierId=((Number)w.one("SELECT supplier_id FROM PurchaseOrder WHERE purchase_order_id=?",id).get("supplierId")).intValue();
                JsonArray items=data.getAsJsonArray("items");
                if(items==null||items.size()==0)throw new IllegalArgumentException("Items required.");
                Map<Integer,Map<String,Object>> previousLines=new HashMap<>();
                for(Map<String,Object> line:w.query("SELECT product_id,purchase_unit,unit_conversion_factor,unit_price FROM PurchaseOrderProduct WHERE purchase_order_id=?",id))
                    previousLines.put(((Number)line.get("productId")).intValue(),line);
                Set<Integer> ids=new HashSet<>();BigDecimal total=BigDecimal.ZERO;
                w.update("DELETE FROM PurchaseOrderProduct WHERE purchase_order_id=?",id);
                for(JsonElement e:items){JsonObject item=e.getAsJsonObject();int product=item.get("productId").getAsBigDecimal().intValueExact(),qty=item.get("quantity").getAsBigDecimal().intValueExact();BigDecimal price=supplierPrice(w,supplierId,product);
                    if(qty<=0||!ids.add(product))throw new IllegalArgumentException("Invalid purchase line.");
                    Map<String,Object> packageInfo=purchaseUnit(w,product);
                    Map<String,Object> previous=previousLines.get(product);
                    String purchaseUnit=(String)packageInfo.get("purchaseUnit");
                    BigDecimal conversionFactor=(BigDecimal)packageInfo.get("conversionFactor");
                    if(previous!=null && previous.get("purchaseUnit")==null) {
                        purchaseUnit=null;
                        conversionFactor=(BigDecimal)previous.get("unitConversionFactor");
                        price=(BigDecimal)previous.get("unitPrice");
                    }
                    BigDecimal subtotal=price.multiply(BigDecimal.valueOf(qty));total=total.add(subtotal);
                    w.update("INSERT PurchaseOrderProduct(purchase_order_id,product_id,quantity,unit_price,subtotal,purchase_unit,unit_conversion_factor) VALUES(?,?,?,?,?,?,?)",id,product,qty,price,subtotal,purchaseUnit,conversionFactor);
                }
                w.update("UPDATE PurchaseOrder SET total_amount=?,expected_date=? WHERE purchase_order_id=?",total,data.has("expectedDate")&&!data.get("expectedDate").isJsonNull()?data.get("expectedDate").getAsString():null,id);
                return Map.of("message","Purchase order updated.");
            });
        }
        if("receive".equals(action)) w.call("usp_ReceivePurchaseOrder",requireActorAccountId(),id);
        else if("send".equals(action)||"cancel".equals(action)) {
            String status="send".equals(action)?"Sent":"Cancelled";
            int changed=w.transaction(()->w.update("UPDATE PurchaseOrder SET status=? WHERE purchase_order_id=? AND (status='Draft' OR (status='Sent' AND ?='Cancelled'))",status,id,status));
            if(changed!=1) throw new WorkflowException(409,"Invalid purchase order transition.");
        } else throw new IllegalArgumentException("Unknown action.");
        return w.one("SELECT * FROM PurchaseOrder WHERE purchase_order_id=?",id);
    }
    private static BigDecimal supplierPrice(Workflow workflow,int supplierId,int productId) throws SQLException {
        Object value=workflow.one(
            "SELECT price.unit_price AS unitPrice FROM dbo.SupplierProductPrice price "
                + "JOIN dbo.Supplier supplier ON supplier.supplier_id=price.supplier_id "
                + "JOIN dbo.Product product ON product.product_id=price.product_id "
                + "WHERE price.supplier_id=? AND price.product_id=? "
                + "AND supplier.status='Active' AND product.status='Active'",
            supplierId,productId
        ).get("unitPrice");
        return (BigDecimal)value;
    }
    private static Map<String,Object> purchaseUnit(Workflow workflow,int productId) throws SQLException {
        Map<String,Object> product=workflow.one(
            "SELECT unit,purchase_unit,units_per_purchase_unit FROM dbo.Product WHERE product_id=? AND status='Active'",
            productId
        );
        String purchaseUnit=(String)product.get("purchaseUnit");
        BigDecimal factor=(BigDecimal)product.get("unitsPerPurchaseUnit");
        if(purchaseUnit==null || factor==null) {
            purchaseUnit=(String)product.get("unit");
            factor=BigDecimal.ONE;
        }
        return Map.of("purchaseUnit",purchaseUnit,"conversionFactor",factor);
    }
    public Object list() throws SQLException {
        Workflow w=workflow();w.roles("Manager");
        List<Map<String,Object>> rows=w.query("SELECT po.*,s.supplier_name FROM PurchaseOrder po JOIN Supplier s ON s.supplier_id=po.supplier_id ORDER BY purchase_order_id DESC");
        for(Map<String,Object> row:rows)row.put("items",w.query("SELECT pop.*,p.product_name,p.unit,COALESCE(pop.purchase_unit,p.unit) AS display_unit FROM PurchaseOrderProduct pop JOIN Product p ON p.product_id=pop.product_id WHERE purchase_order_id=?",row.get("purchaseOrderId")));
        return rows;
    }
}
