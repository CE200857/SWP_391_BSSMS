package bssms_api.HienLNM;

import bssms_controller.HienLNM.FeedbackController;
import bssms_api.common.ControllerServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name = "FeedbackServlet", urlPatterns = {"/api/feedback", "/api/feedback/*"})
public class FeedbackServlet extends ControllerServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (FeedbackController controller = new FeedbackController()) {
                controller.get(input, result);
            }
        });
    }
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (FeedbackController controller = new FeedbackController()) {
                controller.post(input, result);
            }
        });
    }
    @Override protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (FeedbackController controller = new FeedbackController()) {
                controller.put(input, result);
            }
        });
    }
    @Override protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (FeedbackController controller = new FeedbackController()) {
                controller.delete(input, result);
            }
        });
    }
}
