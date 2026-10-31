package bssms_controller.HienLNM;

import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import bssms_catalog.CustomerPackage;
import bssms_persistence.HienLNM.CustomerPackageDAO;
import com.google.gson.Gson;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
/**
 * @author HienLNM
 * 
 */

public class CustomerPackageController extends ControllerSupport {

    private CustomerPackageDAO dao = use(new CustomerPackageDAO());
    private final Gson gson = new Gson();

    public void get(ActionRequest req, ActionResult resp) throws IOException {
        bind(req);

        PrintWriter out = resp.writer();

        String pathInfo = req.pathInfo();

        // /api/customer-packages/{customerId}
        if (pathInfo != null && !pathInfo.equals("/")) {
            try {
                int customerId = Integer.parseInt(pathInfo.substring(1));
                List<CustomerPackage> list = dao.getCustomerPackagesByCustomerId(customerId);
                out.print(gson.toJson(list));
            } catch (NumberFormatException e) {
                resp.status(400);
                out.print("{\"message\":\"Customer ID khong hop le\"}");
            }
            out.flush();
            return;
        }

        // /api/customer-packages?customerId=1
        String customerIdParam = req.parameter("customerId");
        if (customerIdParam != null && !customerIdParam.isEmpty()) {
            try {
                int customerId = Integer.parseInt(customerIdParam);
                List<CustomerPackage> list = dao.getCustomerPackagesByCustomerId(customerId);
                out.print(gson.toJson(list));
            } catch (NumberFormatException e) {
                resp.status(400);
                out.print("{\"message\":\"Customer ID khong hop le\"}");
            }
        } else {
            out.print(gson.toJson(dao.getCustomerPackagesByCustomerId(0)));
        }
        out.flush();
    }

    public void post(ActionRequest req, ActionResult resp) throws IOException {
        bind(req);

        PrintWriter out = resp.writer();

        String pathInfo = req.pathInfo();
        String servletPath = req.servletPath();
        String requestUri = req.uri();
        String queryString = req.queryString();

        // DEBUG: in ra response luôn để dễ thấy
        String debug = "DEBUG: requestURI=" + requestUri + " | servletPath=" + servletPath 
                     + " | pathInfo=" + pathInfo + " | queryString=" + queryString;

        // POST /api/customer-packages/sell
        if (pathInfo != null && pathInfo.equals("/sell")) {
            BufferedReader reader = req.bodyReader();
            Map<String, Object> data = gson.fromJson(reader, Map.class);

            try {
                Object cidObj = data.get("customerId");
                Object tpidObj = data.get("treatmentPackageId");
                Object expObj = data.get("expiryMonths");

                if (cidObj == null || tpidObj == null) {
                    resp.status(400);
                    out.print("{\"message\":\"customerId va treatmentPackageId la bat buoc\"}");
                    out.flush();
                    return;
                }

                int customerId = ((Number) cidObj).intValue();
                int treatmentPackageId = ((Number) tpidObj).intValue();
                int expiryMonths = 12;
                if (expObj != null) {
                    expiryMonths = ((Number) expObj).intValue();
                }

                InputValidation.positive(customerId,"customerId");
                InputValidation.positive(treatmentPackageId,"treatmentPackageId");
                InputValidation.positive(expiryMonths,"expiryMonths");
                Map<String, Object> result = dao.sellTreatmentPackage(customerId, treatmentPackageId, expiryMonths);

                resp.status(201);
                out.print(gson.toJson(result));

            } catch (NumberFormatException e) {
                resp.status(400);
                out.print("{\"message\":\"customerId hoac treatmentPackageId khong hop le\"}");
            } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
                resp.status(500);
                out.print(gson.toJson(java.util.Map.of("message", "Không thể thực hiện thao tác. Vui lòng kiểm tra dữ liệu.")));
            }
            out.flush();
            return;
        }

    }

    public void put(ActionRequest req, ActionResult resp)
            throws IOException {
        bind(req);

        PrintWriter out = resp.writer();

        // DEBUG: In ra request info

        try {
            com.google.gson.JsonObject jsonObject = gson.fromJson(req.bodyReader(), com.google.gson.JsonObject.class);

            int customerPackageId = jsonObject.get("customerPackageId").getAsInt();
            int remainingSessions = jsonObject.get("remainingSessions").getAsInt();
            String expiryDate = jsonObject.has("expiryDate") && !jsonObject.get("expiryDate").isJsonNull()
                              ? jsonObject.get("expiryDate").getAsString() : null;
            String status = jsonObject.has("status") ? jsonObject.get("status").getAsString() : "Active";

            InputValidation.positive(customerPackageId,"customerPackageId");
            if(remainingSessions<0) throw new IllegalArgumentException("remainingSessions cannot be negative");
            boolean success = dao.updateCustomerPackage(customerPackageId, remainingSessions, expiryDate, status);
            if (success) {
                out.print("{\"message\": \"Cập nhật hồ sơ liệu trình thành công!\"}");
            } else {
                resp.status(500);
                out.print("{\"message\": \"Cập nhật thất bại!\"}");
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            resp.status(400);
            out.print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
            
        }
        out.flush();
    }
}
