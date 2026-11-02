package bssms_api.HienLNM;

import bssms_account.Account;
import bssms_api.common.BaseApiServlet;
import bssms_persistence.HienLNM.TreatmentPhotoDAO;
import bssms_persistence.common.WorkflowException;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.file.Files;

/**
 * 4.6 Before/after photos.
 *   POST /api/treatment-photos/{appointmentId}  body {photoType,contentType,data(base64)}  (Technician)
 *   GET  /api/treatment-photos/{appointmentId}  list photos of an appointment
 *   GET  /api/treatment-photos/file/{photoId}   image bytes
 */
@WebServlet(name = "TreatmentPhotoServlet", urlPatterns = {"/api/treatment-photos/*"})
public class TreatmentPhotoServlet extends BaseApiServlet {
    private Account requireUser(HttpServletRequest request) {
        Account user = user(request);
        if (user == null || user.getAccountId() == null) throw new WorkflowException(401, "Vui lòng đăng nhập lại.");
        return user;
    }

    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 201, () -> {
            Account user = requireUser(request);
            String path = request.getPathInfo();
            if (path == null || !path.matches("/[0-9]+")) throw new IllegalArgumentException("Thiếu mã lịch hẹn.");
            int appointmentId = Integer.parseInt(path.substring(1));
            JsonObject body = body(request, JsonObject.class);
            try (TreatmentPhotoDAO dao = new TreatmentPhotoDAO()) {
                dao.setActorAccountId(user.getAccountId());
                return dao.add(appointmentId,
                        text(body, "photoType"), text(body, "contentType"), text(body, "data"));
            }
        });
    }

    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String path = request.getPathInfo();
        if (path != null && path.matches("/file/[0-9]+")) { streamFile(request, response, Integer.parseInt(path.substring(6))); return; }
        handle(request, response, 200, () -> {
            Account user = requireUser(request);
            if (path == null || !path.matches("/[0-9]+")) throw new IllegalArgumentException("Thiếu mã lịch hẹn.");
            try (TreatmentPhotoDAO dao = new TreatmentPhotoDAO()) {
                dao.setActorAccountId(user.getAccountId());
                return dao.list(Integer.parseInt(path.substring(1)));
            }
        });
    }

    private void streamFile(HttpServletRequest request, HttpServletResponse response, int photoId) throws IOException {
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        Account user = user(request);
        if (user == null || user.getAccountId() == null) { response.setStatus(401); return; }
        try (TreatmentPhotoDAO dao = new TreatmentPhotoDAO()) {
            dao.setActorAccountId(user.getAccountId());
            TreatmentPhotoDAO.Stored stored = dao.file(photoId);
            response.setContentType(stored.contentType);
            response.setHeader("Cache-Control", "private, max-age=3600");
            response.setHeader("X-Content-Type-Options", "nosniff");
            response.setContentLengthLong(Files.size(stored.path));
            Files.copy(stored.path, response.getOutputStream());
        } catch (WorkflowException e) {
            response.setStatus(e.status);
        } catch (Exception e) {
            log("Treatment photo download failed", e);
            if (!response.isCommitted()) response.setStatus(500);
        }
    }

    private static String text(JsonObject body, String name) {
        return body.has(name) && !body.get(name).isJsonNull() ? body.get(name).getAsString() : null;
    }
}
