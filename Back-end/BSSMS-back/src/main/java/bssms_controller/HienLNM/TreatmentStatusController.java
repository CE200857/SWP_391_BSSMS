package bssms_controller.HienLNM;

import bssms_controller.common.*;
import bssms_persistence.HienLNM.TreatmentStatusDAO;
import com.google.gson.Gson;
import java.util.Map;

public class TreatmentStatusController extends ControllerSupport {
    private final Gson gson = new Gson();

    private static String blank(String v) { return v == null || v.isBlank() ? null : v.trim(); }

    public void get(ActionRequest req, ActionResult resp) throws Exception {
        bind(req);
        TreatmentStatusDAO dao = use(new TreatmentStatusDAO());
        String path = req.pathInfo();
        if (path != null && !path.equals("/")) {
            Map<String, Object> result = dao.getTreatmentStatusById(Integer.parseInt(path.substring(1)));
            if (result == null) { resp.error(404, "Không tìm thấy dòng dịch vụ."); return; }
            resp.writer().print(gson.toJson(result));
            return;
        }
        String customer = blank(req.parameter("customerId"));
        resp.writer().print(gson.toJson(dao.getTreatmentStatusList(customer == null ? null : Integer.valueOf(customer),
                blank(req.parameter("status")), blank(req.parameter("fromDate")), blank(req.parameter("toDate")))));
    }

    public void put(ActionRequest req, ActionResult resp) throws Exception {
        bind(req);
        String[] parts = req.pathInfo() == null ? new String[0] : req.pathInfo().split("/");
        if (parts.length < 3) { resp.error(404, "Không tìm thấy thao tác."); return; }
        int id = Integer.parseInt(parts[1]);
        TreatmentStatusDAO dao = use(new TreatmentStatusDAO());
        if ("start".equals(parts[2])) { dao.start(id); resp.writer().print("{\"message\":\"Đã bắt đầu dịch vụ.\"}"); }
        else if ("done".equals(parts[2])) resp.writer().print(gson.toJson(dao.done(id)));
        else resp.error(404, "Không tìm thấy thao tác.");
    }
}
