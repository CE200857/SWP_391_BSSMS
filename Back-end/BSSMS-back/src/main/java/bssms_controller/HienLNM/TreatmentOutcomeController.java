package bssms_controller.HienLNM;

import bssms_controller.common.*;
import bssms_persistence.HienLNM.TreatmentOutcomeDAO;
import com.google.gson.*;

public class TreatmentOutcomeController extends ControllerSupport {
    private final Gson gson = new Gson();

    private int id(ActionRequest req) {
        String path = req.pathInfo();
        if (path == null || !path.matches("/[0-9]+")) throw new IllegalArgumentException("Thiếu mã dòng dịch vụ.");
        return Integer.parseInt(path.substring(1));
    }

    public void get(ActionRequest req, ActionResult resp) throws Exception {
        bind(req);
        resp.writer().print(gson.toJson(use(new TreatmentOutcomeDAO()).outcome(id(req))));
    }

    public void put(ActionRequest req, ActionResult resp) throws Exception {
        bind(req);
        JsonObject data = JsonParser.parseReader(req.bodyReader()).getAsJsonObject();
        String notes = data.has("notes") && !data.get("notes").isJsonNull() ? data.get("notes").getAsString() : null;
        String skin = data.has("skinReaction") && !data.get("skinReaction").isJsonNull() ? data.get("skinReaction").getAsString() : null;
        use(new TreatmentOutcomeDAO()).recordOutcome(id(req), notes, skin);
        resp.writer().print("{\"message\":\"Đã lưu kết quả điều trị.\"}");
    }
}
