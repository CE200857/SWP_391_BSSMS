package bssms_api.HienLNM;

import bssms_controller.HienLNM.RoomBedStatusController;
import bssms_api.common.ControllerServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name = "RoomBedStatusServlet", urlPatterns = {"/api/room-bed-status","/api/room-bed-status/*"})
public class RoomBedStatusServlet extends ControllerServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (RoomBedStatusController controller = new RoomBedStatusController()) {
                controller.get(input, result);
            }
        });
    }
    @Override protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (RoomBedStatusController controller = new RoomBedStatusController()) {
                controller.put(input, result);
            }
        });
    }
}
