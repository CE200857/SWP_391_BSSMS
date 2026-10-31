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
        Set<Integer> ids=new HashSet<>(); BigDecimal total=BigDecimal.ZERO;
        for(JsonElement e:items) {
            JsonObject item=e.getAsJsonObject();int id=item.get("productId").getAsBigDecimal().intValueExact();
            int qty=item.get("quantity").getAsBigDecimal().intValueExact();BigDecimal cost=item.get("unitPrice").getAsBigDecimal();
            if(qty<=0||cost.signum()<0||cost.scale()>2||!ids.add(id)) throw new IllegalArgumentException("Invalid or duplicate purchase line.");
            total=total.add(cost.multiply(BigDecimal.valueOf(qty)));
        }
        final BigDecimal sum=total;
        return w.transaction(()->{
            int id=Workflow.id(w.one("INSERT PurchaseOrder(supplier_id,order_date,expected_date,status,total_amount,created_by_staff_id) OUTPUT inserted.purchase_order_id VALUES(?,CONVERT(datetime2,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time'),?,'Draft',?,?)",supplier,data.has("expectedDate")&&!data.get("expectedDate").isJsonNull()?data.get("expectedDate").getAsString():null,sum,bssms_common.LoginIdentity.staffId(requireActorAccountId())).get("purchaseOrderId"));
            for(JsonElement e:items){JsonObject item=e.getAsJsonObject();int qty=item.get("quantity").getAsInt();BigDecimal cost=item.get("unitPrice").getAsBigDecimal();w.update("INSERT PurchaseOrderProduct(purchase_order_id,product_id,quantity,unit_price,subtotal) VALUES(?,?,?,?,?)",id,item.get("productId").getAsInt(),qty,cost,cost.multiply(BigDecimal.valueOf(qty)));}
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
                JsonArray items=data.getAsJsonArray("items");
                if(items==null||items.size()==0)throw new IllegalArgumentException("Items required.");
                Set<Integer> ids=new HashSet<>();BigDecimal total=BigDecimal.ZERO;
                w.update("DELETE FROM PurchaseOrderProduct WHERE purchase_order_id=?",id);
                for(JsonElement e:items){JsonObject item=e.getAsJsonObject();int product=item.get("productId").getAsBigDecimal().intValueExact(),qty=item.get("quantity").getAsBigDecimal().intValueExact();BigDecimal price=item.get("unitPrice").getAsBigDecimal();
                    if(qty<=0||price.signum()<0||price.scale()>2||!ids.add(product))throw new IllegalArgumentException("Invalid purchase line.");
                    BigDecimal subtotal=price.multiply(BigDecimal.valueOf(qty));total=total.add(subtotal);
                    w.update("INSERT PurchaseOrderProduct(purchase_order_id,product_id,quantity,unit_price,subtotal) VALUES(?,?,?,?,?)",id,product,qty,price,subtotal);
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
    public Object list() throws SQLException {
        Workflow w=workflow();w.roles("Manager");
        List<Map<String,Object>> rows=w.query("SELECT po.*,s.supplier_name FROM PurchaseOrder po JOIN Supplier s ON s.supplier_id=po.supplier_id ORDER BY purchase_order_id DESC");
        for(Map<String,Object> row:rows)row.put("items",w.query("SELECT pop.*,p.product_name FROM PurchaseOrderProduct pop JOIN Product p ON p.product_id=pop.product_id WHERE purchase_order_id=?",row.get("purchaseOrderId")));
        return rows;
    }
}
