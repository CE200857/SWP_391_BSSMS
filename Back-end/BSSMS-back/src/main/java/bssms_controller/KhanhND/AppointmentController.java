package bssms_controller.KhanhND;

import bssms_controller.common.*;
import bssms_persistence.KhanhND.AppointmentDAO;
import bssms_persistence.KhanhLTQ.AppointmentStatusDAO;
import bssms_persistence.common.BookingWorkflow;
import com.google.gson.*;
import java.util.*;

public class AppointmentController extends ControllerSupport {
    private final Gson gson = new Gson();

    private static Integer optionalInt(String value) {
        return value == null || value.isBlank() ? null : Integer.valueOf(value.trim());
    }
    private static String text(JsonObject o, String key) {
        return o.has(key) && !o.get(key).isJsonNull() ? o.get(key).getAsString() : null;
    }
    public static List<BookingWorkflow.LineInput> lines(JsonObject o) {
        if (!o.has("services") || !o.get("services").isJsonArray()) {
            if (o.has("serviceId")) return Collections.singletonList(new BookingWorkflow.LineInput(o.get("serviceId").getAsInt(),
                    o.has("customerPackageId") && !o.get("customerPackageId").isJsonNull() ? o.get("customerPackageId").getAsInt() : null));
            return null;
        }
        List<BookingWorkflow.LineInput> result = new ArrayList<>();
        for (JsonElement e : o.getAsJsonArray("services")) {
            JsonObject l = e.getAsJsonObject();
            result.add(new BookingWorkflow.LineInput(l.get("serviceId").getAsInt(),
                    l.has("customerPackageId") && !l.get("customerPackageId").isJsonNull() ? l.get("customerPackageId").getAsInt() : null));
        }
        return result;
    }

    public void get(ActionRequest request, ActionResult response) throws Exception {
        bind(request);
        AppointmentDAO dao = use(new AppointmentDAO());
        String path = request.pathInfo();
        Object data;
        if ("/technicians".equals(path)) data = dao.bookingTechnicians();
        else if (path == null || "/".equals(path))
            data = dao.list(blank(request.parameter("date")), blank(request.parameter("status")), optionalInt(request.parameter("technicianId")));
        else data = dao.detail(Integer.parseInt(path.substring(1)));
        response.writer().print(gson.toJson(data));
    }

    public void post(ActionRequest request, ActionResult response) throws Exception {
        bind(request);
        JsonObject o = JsonParser.parseReader(request.bodyReader()).getAsJsonObject();
        AppointmentDAO dao = use(new AppointmentDAO());
        int id = dao.createAtCounter(o.get("customerId").getAsInt(), lines(o), text(o, "appointmentDate"), text(o, "startTime"),
                o.has("technicianId") && !o.get("technicianId").isJsonNull() ? o.get("technicianId").getAsInt() : null,
                text(o, "paymentChoice"), text(o, "notes"));
        response.status(201);
        response.writer().print(gson.toJson(Map.of("appointmentId", id, "message", "Đã tạo lịch hẹn (Đã xác nhận).")));
    }

    public void put(ActionRequest request, ActionResult response) throws Exception {
        bind(request);
        String[] parts = request.pathInfo() == null ? new String[0] : request.pathInfo().split("/");
        if (parts.length < 3) { response.error(404, "Không tìm thấy thao tác."); return; }
        int id = Integer.parseInt(parts[1]);
        String action = parts[2];
        String body = new java.io.BufferedReader(request.bodyReader()).lines().reduce("", String::concat);
        JsonObject o = body.isBlank() ? new JsonObject() : JsonParser.parseString(body).getAsJsonObject();
        AppointmentDAO dao = use(new AppointmentDAO());
        Object result;
        switch (action) {
            case "confirm": use(new AppointmentStatusDAO()).confirm(id);
                result = Map.of("message", "Đã xác nhận lịch hẹn."); break;
            case "cancel": result = dao.cancel(id, text(o, "reason")); break;
            case "no-show": use(new AppointmentStatusDAO()).noShow(id);
                result = Map.of("message", "Đã đánh dấu khách không đến."); break;
            case "reschedule":
                dao.reschedule(id, lines(o), text(o, "appointmentDate"), text(o, "startTime"), text(o, "reason"));
                result = Map.of("message", "Đã đổi lịch hẹn."); break;
            default: response.error(404, "Không tìm thấy thao tác."); return;
        }
        response.writer().print(gson.toJson(result));
    }

    private static String blank(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
