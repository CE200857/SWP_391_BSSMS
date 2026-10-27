package bssms_controller.HienLNM;

import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import bssms_catalog.Service;
import bssms_persistence.HienLNM.ServiceStatusDAO;
import com.google.gson.Gson;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
/**
 * @author HienLNM
 */

public class ServiceStatusController extends ControllerSupport {

    private ServiceStatusDAO dao = use(new ServiceStatusDAO());
    private final Gson gson = new Gson();

    public void get(ActionRequest req, ActionResult resp) throws IOException {
        bind(req);

        PrintWriter out = resp.writer();

        List<Service> list = dao.getAllServices();
        out.print(gson.toJson(list));
        out.flush();
    }

    public void put(ActionRequest req, ActionResult resp) throws IOException {
        bind(req);

        PrintWriter out = resp.writer();

        String pathInfo = req.pathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            resp.status(400);
            out.print("{\"message\":\"Thieu service ID\"}");
            out.flush();
            return;
        }

        try {
            int serviceId = Integer.parseInt(pathInfo.substring(1));

            BufferedReader reader = req.bodyReader();
            Map<String, String> data = gson.fromJson(reader, Map.class);
            String newStatus = data.get("status");

            if (newStatus == null || newStatus.trim().isEmpty()) {
                resp.status(400);
                out.print("{\"message\":\"Trang thai moi khong duoc de trong\"}");
                out.flush();
                return;
            }

            boolean success = dao.updateServiceStatus(serviceId, newStatus);
            if (success) {
                resp.status(200);
                out.print("{\"message\":\"Cap nhat trang thai service thanh cong\"}");
            } else {
                resp.status(404);
                out.print("{\"message\":\"Khong tim thay service de cap nhat\"}");
            }
        } catch (NumberFormatException e) {
            resp.status(400);
            out.print("{\"message\":\"Service ID khong hop le\"}");
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            resp.status(500);
            out.print(gson.toJson(java.util.Map.of("message", "Không thể thực hiện thao tác. Vui lòng kiểm tra dữ liệu.")));
        }
        out.flush();
    }
}
