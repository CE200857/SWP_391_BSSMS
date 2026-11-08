package bssms_controller.KhanhLTQ;

import bssms_controller.common.ActionRequest;
import bssms_controller.common.ActionResult;
import bssms_controller.common.ControllerSupport;
import bssms_persistence.common.SupplierPriceDAO;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public final class SupplierPriceController extends ControllerSupport {
    public void get(ActionRequest request, ActionResult response) throws Exception {
        bind(request);
        try (SupplierPriceDAO dao = use(new SupplierPriceDAO())) {
            response.writer().print(new Gson().toJson(dao.list()));
        }
    }

    public void post(ActionRequest request, ActionResult response) throws Exception {
        bind(request);
        JsonObject data = JsonParser.parseReader(request.bodyReader()).getAsJsonObject();
        try (SupplierPriceDAO dao = use(new SupplierPriceDAO())) {
            response.writer().print(new Gson().toJson(dao.save(data)));
        }
    }

    public void delete(ActionRequest request, ActionResult response) throws Exception {
        bind(request);
        String supplierId = request.parameter("supplierId");
        String productId = request.parameter("productId");
        if (supplierId == null || productId == null) {
            throw new IllegalArgumentException("Supplier and product IDs are required.");
        }
        try (SupplierPriceDAO dao = use(new SupplierPriceDAO())) {
            dao.delete(Integer.parseInt(supplierId), Integer.parseInt(productId));
        }
        response.status(204);
    }
}
