package bssms_api.DatNT;

import bssms_controller.DatNT.ProfileController;
import bssms_api.common.ControllerServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name = "ProfileServlet", urlPatterns = {
    "/api/profile",
    "/api/update-profile",
    "/api/change-password"
})
public class ProfileServlet extends ControllerServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (ProfileController controller = new ProfileController()) {
                controller.get(input, result);
            }
        });
    }
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (ProfileController controller = new ProfileController()) {
                controller.post(input, result);
            }
        });
    }
}
