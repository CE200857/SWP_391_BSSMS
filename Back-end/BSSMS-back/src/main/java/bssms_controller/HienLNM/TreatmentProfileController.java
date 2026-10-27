package bssms_controller.HienLNM;

import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import com.google.gson.Gson;
import bssms_persistence.HienLNM.TreatmentProfileDAO;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
public class TreatmentProfileController extends ControllerSupport {

    private final Gson gson = new Gson();

    public void get(ActionRequest request, ActionResult response)
            throws IOException {
        bind(request);

        TreatmentProfileDAO dao = use(new TreatmentProfileDAO());
        PrintWriter out = response.writer();

        String customerIdParam = request.parameter("customerId");
        String action = request.parameter("action");

        if (customerIdParam == null || customerIdParam.trim().isEmpty()) {
            response.status(400);
            out.print("{\"message\": \"Thiếu customerId\"}");
            out.flush();
            return;
        }

        try {
            int customerId = Integer.parseInt(customerIdParam);

            if ("summary".equals(action)) {
                Map<String, Object> summary = dao.getTreatmentSummary(customerId);
                out.print(this.gson.toJson(summary));
            } else if ("history".equals(action)) {
                List<Map<String, Object>> history = dao.getTreatmentHistory(customerId);
                out.print(this.gson.toJson(history));
            } else {
                List<Map<String, Object>> profiles = dao.getTreatmentProfilesByCustomerId(customerId);
                out.print(this.gson.toJson(profiles));
            }
        } catch (NumberFormatException e) {
            response.status(400);
            out.print("{\"message\": \"CustomerId không hợp lệ\"}");
        }
        out.flush();
    }

    public void post(ActionRequest request, ActionResult response)
            throws IOException {
        bind(request);

        PrintWriter out = response.writer();
        try {
            com.google.gson.JsonObject jsonObject = gson.fromJson(request.bodyReader(), com.google.gson.JsonObject.class);
            TreatmentProfileDAO dao = use(new TreatmentProfileDAO());

            String action = jsonObject.has("action") ? jsonObject.get("action").getAsString() : null;

            if ("update-notes".equals(action)) {
                int appointmentId = jsonObject.get("appointmentId").getAsInt();
                String notes = jsonObject.get("notes").getAsString();

                boolean success = dao.updateAppointmentNotes(appointmentId, notes);
                if (success) {
                    out.print("{\"message\": \"Cập nhật ghi chú thành công!\"}");
                } else {
                    response.status(500);
                    out.print("{\"message\": \"Cập nhật ghi chú thất bại!\"}");
                }
            } else {
                response.status(400);
                out.print("{\"message\": \"Action không hợp lệ!\"}");
            }
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            response.status(400);
            out.print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
            
        }
        out.flush();
    }
}
