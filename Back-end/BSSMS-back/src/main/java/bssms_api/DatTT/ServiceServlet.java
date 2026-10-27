package bssms_api.DatTT;
import bssms_catalog.Service;
import bssms_controller.DatTT.ServiceController;
import bssms_persistence.DatTT.ServiceDAO;
import bssms_api.common.BaseApiServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebServlet(name = "ServiceController", urlPatterns = {"/api/service"})
public class ServiceServlet extends BaseApiServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (ServiceDAO dao = new ServiceDAO()) {
                ServiceController controller = new ServiceController(dao);
                Integer id = optionalId(request, "id");
                return id == null ? controller.getAllServices() : controller.getServiceById(id);
            }
        });
    }
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 201, () -> {
            try (ServiceDAO dao = new ServiceDAO()) {
                ServiceController controller = new ServiceController(dao);
                controller.createService(body(request, Service.class));
                return null;
            }
        });
    }
    @Override protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (ServiceDAO dao = new ServiceDAO()) {
                ServiceController controller = new ServiceController(dao);
                controller.updateService(id(request, "id"), body(request, Service.class));
                return null;
            }
        });
    }
    @Override protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (ServiceDAO dao = new ServiceDAO()) {
                ServiceController controller = new ServiceController(dao);
                controller.deleteService(id(request, "id"));
                return null;
            }
        });
    }
}
