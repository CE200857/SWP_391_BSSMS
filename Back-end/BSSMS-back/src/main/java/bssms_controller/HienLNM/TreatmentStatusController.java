package bssms_controller.HienLNM;

import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import bssms_persistence.HienLNM.TreatmentStatusDAO;
import com.google.gson.Gson;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
/**
 * @author HienLNM
 */

public class TreatmentStatusController extends ControllerSupport {

    private TreatmentStatusDAO dao = use(new TreatmentStatusDAO());
    private final Gson gson = new Gson();

    public void get(ActionRequest req, ActionResult resp) throws IOException {
        bind(req);

        PrintWriter out = resp.writer();

        String pathInfo = req.pathInfo();

        // /api/treatment-status/{id}
        if (pathInfo != null && !pathInfo.equals("/")) {
            try {
                int appointmentId = Integer.parseInt(pathInfo.substring(1));
                Map<String, Object> result = dao.getTreatmentStatusById(appointmentId);
                if (result != null) {
                    out.print(gson.toJson(result));
                } else {
                    resp.status(404);
                    out.print("{\"message\":\"Khong tim thay treatment status voi id = " + appointmentId + "\"}");
                }
            } catch (NumberFormatException e) {
                resp.status(400);
                out.print("{\"message\":\"Appointment ID khong hop le\"}");
            }
            out.flush();
            return;
        }

        // Filter params
        String customerIdParam = req.parameter("customerId");
        String status = req.parameter("status");
        String fromDate = req.parameter("fromDate");
        String toDate = req.parameter("toDate");

        Integer customerId = null;
        if (customerIdParam != null && !customerIdParam.isEmpty()) {
            try {
                customerId = Integer.parseInt(customerIdParam);
            } catch (NumberFormatException e) {
                resp.status(400);
                out.print("{\"message\":\"customerId khong hop le\"}");
                out.flush();
                return;
            }
        }

        List<Map<String, Object>> list = dao.getTreatmentStatusList(customerId, status, fromDate, toDate);
        out.print(gson.toJson(list));
        out.flush();
    }
}

