package bssms_api.KhanhND;

import bssms_controller.KhanhND.InvoiceController;
import bssms_api.common.ControllerServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(
        name = "InvoiceServlet",
        urlPatterns = {"/api/invoices", "/api/invoices/*"}
)
public class InvoiceServlet extends ControllerServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (InvoiceController controller = new InvoiceController()) {
                controller.get(input, result);
            }
        });
    }
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (InvoiceController controller = new InvoiceController()) {
                controller.post(input, result);
            }
        });
    }
}
