package bssms_api.DatNT;

import bssms_controller.DatNT.CustomerController;
import bssms_api.common.ControllerServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name = "CustomerServlet", urlPatterns = {"/api/customers"})
public class CustomerServlet extends ControllerServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (CustomerController controller = new CustomerController()) {
                controller.get(input, result);
            }
        });
    }
    @Override protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (CustomerController controller = new CustomerController()) {
                controller.delete(input, result);
            }
        });
    }
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (CustomerController controller = new CustomerController()) {
                controller.post(input, result);
            }
        });
    }
}
