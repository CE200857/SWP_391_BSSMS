package bssms_api.DatTT;
import bssms_catalog.Service;
import bssms_controller.DatTT.ServiceController;
import bssms_persistence.DatTT.ServiceDAO;
import bssms_api.common.BaseApiServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.Map;

@WebServlet(name = "ServiceController", urlPatterns = {"/api/service"})
public class ServiceServlet extends BaseApiServlet {
    
 //View Service
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (ServiceDAO dao = new ServiceDAO()) {
                ServiceController controller = new ServiceController(dao);
                Integer id = optionalId(request, "id");
                Integer technicians = optionalId(request, "technicians");
                if (technicians != null) return controller.technicians(technicians);
                return id == null ? controller.getAllServices() : controller.getServiceById(id);
            }
        });
    }
    
    //Create Service
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 201, () -> {
            try (ServiceDAO dao = new ServiceDAO()) {
                ServiceController controller = new ServiceController(dao);
                return Map.of("serviceId", controller.createService(body(request, Service.class)));
            }
        });
    }
    
    //Update Service
    @Override protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (ServiceDAO dao = new ServiceDAO()) {
                ServiceController controller = new ServiceController(dao);
                controller.updateService(id(request, "id"), body(request, Service.class));
                return null;
            }
        });
    }
    
    //Sort Delete Service
    @Override protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (ServiceDAO dao = new ServiceDAO()) {
                ServiceController controller = new ServiceController(dao);
                return controller.deleteService(id(request, "id"));
            }
        });
    }
}
