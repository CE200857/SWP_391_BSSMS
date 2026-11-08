package bssms_api.DatTT;

import bssms_api.common.BaseApiServlet;
import bssms_persistence.DatTT.ServiceImageDAO;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

/**
 * Ảnh dịch vụ.
 *   GET    /api/service-image/{serviceId}   ảnh (công khai, để khách xem danh sách dịch vụ)
 *   POST   /api/service-image/{serviceId}   body {contentType,data(base64)}  (Manager)
 *   DELETE /api/service-image/{serviceId}   xóa ảnh (Manager)
 * Quyền Manager được kiểm tra ở AuthorizationFilter.
 */
@WebServlet(name = "ServiceImageServlet", urlPatterns = {"/api/service-image/*"})
public class ServiceImageServlet extends BaseApiServlet {
    private static int serviceId(HttpServletRequest request) {
        String path = request.getPathInfo();
        if (path == null || !path.matches("/[0-9]+")) throw new IllegalArgumentException("Thiếu mã dịch vụ.");
        return Integer.parseInt(path.substring(1));
    }

    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try (ServiceImageDAO dao = new ServiceImageDAO()) {
            Path file = dao.file(serviceId(request));
            if (file == null) { response.setStatus(404); return; }
            response.setContentType(ServiceImageDAO.mimeOf(file.getFileName().toString()));
            response.setHeader("Cache-Control", "public, max-age=300");
            response.setHeader("X-Content-Type-Options", "nosniff");
            response.setContentLengthLong(Files.size(file));
            Files.copy(file, response.getOutputStream());
        } catch (IllegalArgumentException e) {
            response.setStatus(400);
        } catch (Exception e) {
            log("Service image download failed", e);
            if (!response.isCommitted()) response.setStatus(500);
        }
    }

    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 201, () -> {
            int id = serviceId(request);
            JsonObject body = body(request, JsonObject.class);
            try (ServiceImageDAO dao = new ServiceImageDAO()) {
                dao.save(id, text(body, "contentType"), text(body, "data"));
                return Map.of("message", "Đã lưu ảnh dịch vụ.");
            }
        });
    }

    @Override protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (ServiceImageDAO dao = new ServiceImageDAO()) {
                dao.remove(serviceId(request));
                return Map.of("message", "Đã xóa ảnh dịch vụ.");
            }
        });
    }

    private static String text(JsonObject body, String name) {
        return body != null && body.has(name) && !body.get(name).isJsonNull() ? body.get(name).getAsString() : null;
    }
}
