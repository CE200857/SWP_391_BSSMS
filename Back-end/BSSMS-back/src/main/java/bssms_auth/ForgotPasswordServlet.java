package bssms_auth;

import bssms_controller.auth.ForgotPasswordController;
import bssms_api.common.ControllerServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name = "ForgotPasswordServlet", urlPatterns = {
    "/api/forgot-password/check-email",
    "/api/forgot-password/reset"
})
public class ForgotPasswordServlet extends ControllerServlet {
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (ForgotPasswordController controller = new ForgotPasswordController()) {
                controller.post(input, result);
            }
        });
    }
}
