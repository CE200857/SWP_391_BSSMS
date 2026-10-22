package bssms_api.HienLNM;

import bssms_controller.HienLNM.TreatmentProfileController;
import bssms_api.common.ControllerServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name = "TreatmentProfileServlet", urlPatterns = {"/api/treatment-profiles"})
public class TreatmentProfileServlet extends ControllerServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (TreatmentProfileController controller = new TreatmentProfileController()) {
                controller.get(input, result);
            }
        });
    }
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (TreatmentProfileController controller = new TreatmentProfileController()) {
                controller.post(input, result);
            }
        });
    }
}
