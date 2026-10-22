package bssms_api.KhanhND;

import bssms_controller.KhanhND.StaffController;
import bssms_api.common.ControllerServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name = "StaffServlet", urlPatterns = {"/api/staff", "/api/staff/assign-role"})
public class StaffServlet extends ControllerServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (StaffController controller = new StaffController()) {
                controller.get(input, result);
            }
        });
    }
    @Override protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (StaffController controller = new StaffController()) {
                controller.delete(input, result);
            }
        });
    }
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (StaffController controller = new StaffController()) {
                controller.post(input, result);
            }
        });
    }
}
