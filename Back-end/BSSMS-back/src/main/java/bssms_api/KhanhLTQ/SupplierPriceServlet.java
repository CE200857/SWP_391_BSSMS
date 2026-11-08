package bssms_api.KhanhLTQ;

import bssms_api.common.ControllerServlet;
import bssms_controller.KhanhLTQ.SupplierPriceController;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet("/api/supplier-prices")
public final class SupplierPriceServlet extends ControllerServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (SupplierPriceController controller = new SupplierPriceController()) {
                controller.get(input, result);
            }
        });
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (SupplierPriceController controller = new SupplierPriceController()) {
                controller.post(input, result);
            }
        });
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (SupplierPriceController controller = new SupplierPriceController()) {
                controller.delete(input, result);
            }
        });
    }
}
