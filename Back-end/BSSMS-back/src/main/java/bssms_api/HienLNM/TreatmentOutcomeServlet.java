package bssms_api.HienLNM;

import bssms_controller.HienLNM.TreatmentOutcomeController;
import bssms_api.common.ControllerServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name = "TreatmentOutcomeServlet", urlPatterns = {"/api/treatment-outcomes", "/api/treatment-outcomes/*"})
public class TreatmentOutcomeServlet extends ControllerServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (TreatmentOutcomeController controller = new TreatmentOutcomeController()) {
                controller.get(input, result);
            }
        });
    }
    @Override protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (TreatmentOutcomeController controller = new TreatmentOutcomeController()) {
                controller.put(input, result);
            }
        });
    }
}
