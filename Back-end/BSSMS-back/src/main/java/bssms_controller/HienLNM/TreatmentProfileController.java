package bssms_controller.HienLNM;

import bssms_controller.common.*;
import bssms_persistence.HienLNM.TreatmentProfileDAO;
import com.google.gson.*;

public class TreatmentProfileController extends ControllerSupport {
    private final Gson gson = new Gson();

    public void get(ActionRequest request, ActionResult response) throws Exception {
        bind(request);
        TreatmentProfileDAO dao = use(new TreatmentProfileDAO());
        String id = request.parameter("customerId");
        int customerId = id == null || id.isBlank() ? 0 : Integer.parseInt(id.trim());
        String action = request.parameter("action");
        Object data = "summary".equals(action) ? dao.getTreatmentSummary(customerId)
                : "history".equals(action) ? dao.getTreatmentHistory(customerId)
                : dao.getTreatmentProfilesByCustomerId(customerId);
        response.writer().print(gson.toJson(data));
    }

    public void post(ActionRequest request, ActionResult response) throws Exception {
        bind(request);
        JsonObject o = JsonParser.parseReader(request.bodyReader()).getAsJsonObject();
        if (!"update-health".equals(o.has("action") ? o.get("action").getAsString() : null)) { response.error(400, "Action không hợp lệ!"); return; }
        boolean ok = use(new TreatmentProfileDAO()).updateHealthProfile(o.get("customerId").getAsInt(), text(o, "skinCondition"), text(o, "allergies"), text(o, "notes"));
        if (!ok) { response.error(404, "Không tìm thấy khách hàng."); return; }
        response.writer().print("{\"message\": \"Đã cập nhật hồ sơ sức khỏe.\"}");
    }
    private static String text(JsonObject o, String k) { return o.has(k) && !o.get(k).isJsonNull() ? o.get(k).getAsString() : null; }
}
