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
            int id=Workflow.id(w.one("INSERT PurchaseOrder(supplier_id,order_date,expected_date,status,total_amount,created_by_staff_id) OUTPUT inserted.purchase_order_id VALUES(?,CONVERT(datetime2,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time'),?,'Draft',?,?)",supplier,data.has("expectedDate")?data.get("expectedDate").getAsString():null,sum,bssms_common.LoginIdentity.staffId(requireActorAccountId())).get("purchaseOrderId"));
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
        if("receive".equals(action)) w.call("usp_ReceivePurchaseOrder",requireActorAccountId(),id);
        else if("send".equals(action)||"cancel".equals(action)) {
            String status="send".equals(action)?"Sent":"Cancelled";
            int changed=w.transaction(()->w.update("UPDATE PurchaseOrder SET status=? WHERE purchase_order_id=? AND (status='Draft' OR (status='Sent' AND ?='Cancelled'))",status,id,status));
            if(changed!=1) throw new WorkflowException(409,"Invalid purchase order transition.");
        } else throw new IllegalArgumentException("Unknown action.");
        return w.one("SELECT * FROM PurchaseOrder WHERE purchase_order_id=?",id);
    }
    public Object list() throws SQLException {workflow().roles("Manager");return workflow().query("SELECT * FROM PurchaseOrder ORDER BY purchase_order_id DESC");}
}
