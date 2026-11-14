package bssms_controller.HienLNM;

import bssms_controller.common.*;
import bssms_persistence.HienLNM.CustomerPackageDAO;
import bssms_persistence.KhanhLTQ.PackageUsageDAO;
import com.google.gson.*;

public class CustomerPackageController extends ControllerSupport {
    private final Gson gson = new Gson();

    public void get(ActionRequest req, ActionResult resp) throws Exception {
        bind(req);
        String path = req.pathInfo();
        int customer = path != null && path.matches("/[0-9]+") ? Integer.parseInt(path.substring(1))
                : req.parameter("customerId") != null && !req.parameter("customerId").isBlank() ? Integer.parseInt(req.parameter("customerId")) : 0;
        resp.writer().print(gson.toJson(use(new PackageUsageDAO()).getCustomerPackagesByCustomerId(customer)));
    }

    public void post(ActionRequest req, ActionResult resp) throws Exception {
        bind(req);
        if (!"/sell".equals(req.pathInfo())) { resp.error(404, "Không tìm thấy thao tác."); return; }
        JsonObject o = JsonParser.parseReader(req.bodyReader()).getAsJsonObject();
        int customer = o.get("customerId").getAsInt(), pkg = o.get("treatmentPackageId").getAsInt();
        InputValidation.positive(customer, "customerId");
        InputValidation.positive(pkg, "treatmentPackageId");
        String voucher = o.has("voucherCode") && !o.get("voucherCode").isJsonNull() && !o.get("voucherCode").getAsString().isBlank() ? o.get("voucherCode").getAsString() : null;
        String method = o.has("paymentMethod") && !o.get("paymentMethod").isJsonNull() ? o.get("paymentMethod").getAsString() : "Cash";
        resp.status(201);
        resp.writer().print(gson.toJson(use(new CustomerPackageDAO()).sellTreatmentPackage(customer, pkg, voucher, method)));
    }
}
