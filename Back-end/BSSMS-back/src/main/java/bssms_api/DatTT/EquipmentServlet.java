package bssms_api.DatTT;
import bssms_catalog.Equipment;
import bssms_controller.DatTT.EquipmentController;
import bssms_persistence.DatTT.EquipmentDAO;
import bssms_api.common.BaseApiServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebServlet(name = "EquipmentServlet", urlPatterns = {"/api/equipment"})
public class EquipmentServlet extends BaseApiServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (EquipmentDAO dao = new EquipmentDAO()) {
                EquipmentController controller = new EquipmentController(dao);
                return controller.getAllEquipments();
            }
        });
    }
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 201, () -> {
            try (EquipmentDAO dao = new EquipmentDAO()) {
                EquipmentController controller = new EquipmentController(dao);
                controller.create(user(request), body(request, Equipment.class));
                return message("Created successfully.");
            }
        });
    }
    @Override protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (EquipmentDAO dao = new EquipmentDAO()) {
                EquipmentController controller = new EquipmentController(dao);
                controller.update(user(request), body(request, Equipment.class));
                return message("Updated successfully.");
            }
        });
    }
    @Override protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (EquipmentDAO dao = new EquipmentDAO()) {
                EquipmentController controller = new EquipmentController(dao);
                controller.delete(user(request), id(request, "id"));
                return message("Deleted successfully.");
            }
        });
    }
}
