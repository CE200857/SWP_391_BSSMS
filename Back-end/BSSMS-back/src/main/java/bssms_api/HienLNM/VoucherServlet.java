package bssms_api.HienLNM;

import bssms_controller.HienLNM.VoucherController;
import bssms_api.common.ControllerServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name = "VoucherServlet", urlPatterns = {"/api/vouchers"})
public class VoucherServlet extends ControllerServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (VoucherController controller = new VoucherController()) {
                controller.get(input, result);
            }
        });
    }
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (VoucherController controller = new VoucherController()) {
                controller.post(input, result);
            }
        });
    }
    @Override protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (VoucherController controller = new VoucherController()) {
                controller.delete(input, result);
            }
        });
    }
}
