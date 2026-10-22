package bssms_api.DatTT;
import bssms_catalog.Room;
import bssms_controller.DatTT.RoomController;
import bssms_persistence.DatTT.RoomDAO;
import bssms_api.common.BaseApiServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebServlet(name = "RoomServlet", urlPatterns = {"/api/rooms"})
public class RoomServlet extends BaseApiServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (RoomDAO dao = new RoomDAO()) {
                RoomController controller = new RoomController(dao);
                return controller.getAllRooms();
            }
        });
    }
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 201, () -> {
            try (RoomDAO dao = new RoomDAO()) {
                RoomController controller = new RoomController(dao);
                controller.create(user(request), body(request, Room.class));
                return message("Created successfully.");
            }
        });
    }
    @Override protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (RoomDAO dao = new RoomDAO()) {
                RoomController controller = new RoomController(dao);
                controller.update(user(request), body(request, Room.class));
                return message("Updated successfully.");
            }
        });
    }
    @Override protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (RoomDAO dao = new RoomDAO()) {
                RoomController controller = new RoomController(dao);
                controller.delete(user(request), id(request, "id"));
                return message("Deleted successfully.");
            }
        });
    }
}
