package bssms_controller.KhanhLTQ;

import bssms_controller.common.*;
import bssms_persistence.KhanhLTQ.ProductDAO;
import com.google.gson.*;
import java.util.*;

/** Validates the full receipt before applying a single database transaction. */
public class PurchaseOrderController extends ControllerSupport {
    public void post(ActionRequest request,ActionResult result) throws Exception {
        JsonObject data=JsonParser.parseReader(request.bodyReader()).getAsJsonObject();
        if(!data.has("items") || !data.get("items").isJsonArray() || data.getAsJsonArray("items").size()==0)
            throw new IllegalArgumentException("Items are required.");
        Map<Integer,Integer> quantities=new LinkedHashMap<>();
        for(JsonElement element:data.getAsJsonArray("items")) {
            JsonObject item=element.getAsJsonObject();
            int productId=positiveInt(item,"productId"), quantity=positiveInt(item,"quantity");
            try { quantities.merge(productId,quantity,Math::addExact); }
            catch(ArithmeticException e) { throw new IllegalArgumentException("Quantity overflow"); }
        }
        ProductDAO dao=use(new ProductDAO());
        dao.receiveStock(quantities);
        result.status(200);
        result.writer().print(new Gson().toJson(Collections.singletonMap("message","Tạo đơn nhập hàng thành công!")));
    }
    private int positiveInt(JsonObject data,String name) {
        if(!data.has(name) || data.get(name).isJsonNull()) throw new IllegalArgumentException(name+" is required.");
        try {
            int value=new java.math.BigDecimal(data.get(name).getAsString()).intValueExact();
            if(value<=0) throw new IllegalArgumentException(name+" must be positive.");
            return value;
        } catch(ArithmeticException e) { throw new IllegalArgumentException("Invalid integer: "+name); }
    }
}
