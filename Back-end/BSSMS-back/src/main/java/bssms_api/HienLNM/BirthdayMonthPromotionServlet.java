package bssms_api.HienLNM;

import bssms_controller.HienLNM.BirthdayMonthPromotionController;
import bssms_api.common.ControllerServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name = "BirthdayMonthPromotionServlet", urlPatterns = {"/api/birthday-promotions"})
public class BirthdayMonthPromotionServlet extends ControllerServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (BirthdayMonthPromotionController controller = new BirthdayMonthPromotionController()) {
                controller.get(input, result);
            }
        });
    }
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (BirthdayMonthPromotionController controller = new BirthdayMonthPromotionController()) {
                controller.post(input, result);
            }
        });
    }
    @Override protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (BirthdayMonthPromotionController controller = new BirthdayMonthPromotionController()) {
                controller.put(input, result);
            }
        });
    }
    @Override protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (BirthdayMonthPromotionController controller = new BirthdayMonthPromotionController()) {
                controller.delete(input, result);
            }
        });
    }
}
