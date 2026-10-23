package bssms_controller.HienLNM;

import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import bssms_persistence.HienLNM.TreatmentOutcomeDAO;
import com.google.gson.Gson;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;
/**
 * @author HienLNM
 */

public class TreatmentOutcomeController extends ControllerSupport {

    private TreatmentOutcomeDAO dao = use(new TreatmentOutcomeDAO());
    private final Gson gson = new Gson();

    public void get(ActionRequest req, ActionResult resp) throws IOException {

        PrintWriter out = resp.writer();

        String pathInfo = req.pathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            resp.status(400);
            out.print("{\"message\":\"Thieu appointment ID\"}");
            out.flush();
            return;
        }

        try {
            int appointmentId = Integer.parseInt(pathInfo.substring(1));
            if (!dao.appointmentExists(appointmentId)) {
                resp.status(404);
                out.print("{\"message\":\"Khong tim thay appointment voi id = " + appointmentId + "\"}");
                out.flush();
                return;
            }

            String raw = dao.getOutcomeByAppointmentId(appointmentId);
            if (raw != null) {
                String[] parts = raw.split("\\|\\|\\|", 2);
                Map<String, Object> result = new HashMap<>();
                result.put("appointmentId", appointmentId);
                result.put("notes", parts[0]);
                result.put("status", parts.length > 1 ? parts[1] : null);
                out.print(gson.toJson(result));
            } else {
                resp.status(404);
                out.print("{\"message\":\"Khong tim thay ket qua dieu tri\"}");
            }
        } catch (NumberFormatException e) {
            resp.status(400);
            out.print("{\"message\":\"Appointment ID khong hop le\"}");
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            resp.status(500);
            out.print(gson.toJson(java.util.Map.of("message", "Không thể thực hiện thao tác. Vui lòng kiểm tra dữ liệu.")));
        }
        out.flush();
    }

    public void put(ActionRequest req, ActionResult resp) throws IOException {

        PrintWriter out = resp.writer();

        String pathInfo = req.pathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            resp.status(400);
            out.print("{\"message\":\"Thieu appointment ID\"}");
            out.flush();
            return;
        }

        try {
            int appointmentId = Integer.parseInt(pathInfo.substring(1));

            BufferedReader reader = req.bodyReader();
            Map<String, String> data = gson.fromJson(reader, Map.class);
            String notes = data.get("notes");
            String status = data.get("status");

            if (notes == null || notes.trim().isEmpty()) {
                resp.status(400);
                out.print("{\"message\":\"Ket qua dieu tri (notes) khong duoc de trong\"}");
                out.flush();
                return;
            }
            if (status == null || status.trim().isEmpty()) {
                resp.status(400);
                out.print("{\"message\":\"Trang thai appointment khong duoc de trong\"}");
                out.flush();
                return;
            }

            boolean success = dao.recordOutcome(appointmentId, notes, status);
            if (success) {
                resp.status(200);
                out.print("{\"message\":\"Ghi nhan ket qua dieu tri thanh cong\",\"appointmentId\":" + appointmentId + "}");
            } else {
                resp.status(404);
                out.print("{\"message\":\"Khong tim thay appointment de ghi nhan ket qua\"}");
            }
        } catch (NumberFormatException e) {
            resp.status(400);
            out.print("{\"message\":\"Appointment ID khong hop le\"}");
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            resp.status(500);
            out.print(gson.toJson(java.util.Map.of("message", "Không thể thực hiện thao tác. Vui lòng kiểm tra dữ liệu.")));
        }
        out.flush();
    }
}
