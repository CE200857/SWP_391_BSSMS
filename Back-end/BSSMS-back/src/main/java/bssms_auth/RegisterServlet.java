package bssms_auth;

import bssms_controller.auth.RegisterController;
import bssms_api.common.ControllerServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name = "RegisterServlet", urlPatterns = {"/api/register"})
public class RegisterServlet extends ControllerServlet {
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (RegisterController controller = new RegisterController()) {
                controller.post(input, result);
            }
        });
    }
}
