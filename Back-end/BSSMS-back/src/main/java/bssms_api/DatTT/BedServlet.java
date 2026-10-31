package bssms_api.DatTT;
import bssms_catalog.Bed;
import bssms_controller.DatTT.BedController;
import bssms_persistence.DatTT.BedDAO;
import bssms_api.common.BaseApiServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebServlet(name = "BedServlet", urlPatterns = {"/api/beds"})
public class BedServlet extends BaseApiServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (BedDAO dao = new BedDAO()) {
                BedController controller = new BedController(dao);
                return controller.getAllBeds();
            }
        });
    }
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 201, () -> {
            try (BedDAO dao = new BedDAO()) {
                BedController controller = new BedController(dao);
                controller.create(user(request), body(request, Bed.class));
                return message("Created successfully.");
            }
        });
    }
    @Override protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (BedDAO dao = new BedDAO()) {
                BedController controller = new BedController(dao);
                controller.update(user(request), body(request, Bed.class));
                return message("Updated successfully.");
            }
        });
    }
    @Override protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (BedDAO dao = new BedDAO()) {
                BedController controller = new BedController(dao);
                controller.delete(user(request), id(request, "id"));
                return message("Deleted successfully.");
            }
        });
    }
}
