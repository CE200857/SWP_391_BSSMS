package bssms_api.HienLNM;

import bssms_controller.HienLNM.TreatmentStatusController;
import bssms_api.common.ControllerServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name = "TreatmentStatusServlet", urlPatterns = {"/api/treatment-status", "/api/treatment-status/*"})
public class TreatmentStatusServlet extends ControllerServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (TreatmentStatusController controller = new TreatmentStatusController()) {
                controller.get(input, result);
            }
        });
    }
}
