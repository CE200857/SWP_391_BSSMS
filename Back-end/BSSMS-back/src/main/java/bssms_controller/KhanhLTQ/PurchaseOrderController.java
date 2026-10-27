package bssms_controller.KhanhLTQ;
import bssms_controller.common.*;
import bssms_persistence.common.InventoryDAO;
import com.google.gson.*;
public class PurchaseOrderController extends ControllerSupport {
    public void post(ActionRequest request,ActionResult result) throws Exception {
        bind(request);JsonObject data=JsonParser.parseReader(request.bodyReader()).getAsJsonObject();
        InventoryDAO dao=use(new InventoryDAO());
        result.writer().print(new Gson().toJson(data.has("action")?dao.action(data):dao.create(data)));
    }
    public void get(ActionRequest request,ActionResult result) throws Exception {
        bind(request);result.writer().print(new Gson().toJson(use(new InventoryDAO()).list()));
    }
}
