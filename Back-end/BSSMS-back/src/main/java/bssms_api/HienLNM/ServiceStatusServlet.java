package bssms_api.HienLNM;

import bssms_controller.HienLNM.ServiceStatusController;
import bssms_api.common.ControllerServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name = "ServiceStatusServlet", urlPatterns = {"/api/service-status", "/api/service-status/*"})
public class ServiceStatusServlet extends ControllerServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (ServiceStatusController controller = new ServiceStatusController()) {
                controller.get(input, result);
            }
        });
    }
    @Override protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (ServiceStatusController controller = new ServiceStatusController()) {
                controller.put(input, result);
            }
        });
    }
}
