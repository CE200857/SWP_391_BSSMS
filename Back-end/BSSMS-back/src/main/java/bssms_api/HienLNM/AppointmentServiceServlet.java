package bssms_api.HienLNM;

import bssms_account.Account;
import bssms_api.common.BaseApiServlet;
import bssms_persistence.HienLNM.AppointmentLineDAO;
import bssms_persistence.common.WorkflowException;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;

/**
 * Nhiều dịch vụ trong một lịch hẹn.
 *   GET    /api/appointment-services?appointmentId=ID                 danh sách dịch vụ + người phụ trách
 *   POST   /api/appointment-services  {appointmentId, serviceId}      thêm dịch vụ (khách khi chờ/đã xác nhận; lễ tân đến khi đang thực hiện)
 *   DELETE /api/appointment-services?appointmentId=ID&serviceId=ID    xóa dịch vụ đã thêm (không xóa được dịch vụ đầu tiên)
 */
@WebServlet(name = "AppointmentServiceServlet", urlPatterns = {"/api/appointment-services"})
public class AppointmentServiceServlet extends BaseApiServlet {
    private static int intParam(HttpServletRequest request, String name) {
        try { return Integer.parseInt(request.getParameter(name)); }
        catch (NumberFormatException e) { throw new IllegalArgumentException("Thiếu hoặc sai tham số " + name + "."); }
    }

    private Account requireUser(HttpServletRequest request) {
        Account user = user(request);
        if (user == null || user.getAccountId() == null) throw new WorkflowException(401, "Vui lòng đăng nhập.");
        return user;
    }

    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            Account user = requireUser(request);
            try (AppointmentLineDAO dao = new AppointmentLineDAO()) {
                dao.setActorAccountId(user.getAccountId());
                return dao.lines(intParam(request, "appointmentId"));
            }
        });
    }

    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 201, () -> {
            Account user = requireUser(request);
            JsonObject body = body(request, JsonObject.class);
            if (!body.has("appointmentId") || !body.has("serviceId")) throw new IllegalArgumentException("Thiếu mã lịch hẹn hoặc mã dịch vụ.");
            try (AppointmentLineDAO dao = new AppointmentLineDAO()) {
                dao.setActorAccountId(user.getAccountId());
                dao.add(body.get("appointmentId").getAsInt(), body.get("serviceId").getAsInt());
                return Map.of("message", "Đã thêm dịch vụ vào lịch hẹn.");
            }
        });
    }

    @Override protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            Account user = requireUser(request);
            try (AppointmentLineDAO dao = new AppointmentLineDAO()) {
                dao.setActorAccountId(user.getAccountId());
                dao.remove(intParam(request, "appointmentId"), intParam(request, "serviceId"));
                return Map.of("message", "Đã xóa dịch vụ khỏi lịch hẹn.");
            }
        });
    }
}
