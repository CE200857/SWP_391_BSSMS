package bssms_api.HienLNM;

import bssms_controller.HienLNM.CustomerPackageController;
import bssms_api.common.ControllerServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name = "CustomerPackageServlet", urlPatterns = {"/api/customer-packages","/api/customer-packages/*"})
public class CustomerPackageServlet extends ControllerServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (CustomerPackageController controller = new CustomerPackageController()) {
                controller.get(input, result);
            }
        });
    }
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (CustomerPackageController controller = new CustomerPackageController()) {
                controller.post(input, result);
            }
        });
    }
    @Override protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (CustomerPackageController controller = new CustomerPackageController()) {
                controller.put(input, result);
            }
        });
    }
}
