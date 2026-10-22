package bssms_api.DatTT;
import bssms_catalog.TreatmentPackage;
import bssms_controller.DatTT.TreatmentPackageController;
import bssms_persistence.DatTT.TreatmentPackageDAO;
import bssms_api.common.BaseApiServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebServlet(name = "bssms_api.DatTT.TreatmentPackageServlet", urlPatterns = {"/api/treatment-packages"})
public class TreatmentPackageServlet extends BaseApiServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (TreatmentPackageDAO dao = new TreatmentPackageDAO()) {
                TreatmentPackageController controller = new TreatmentPackageController(dao);
                return controller.getAllTreatmentPackages();
            }
        });
    }
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 201, () -> {
            try (TreatmentPackageDAO dao = new TreatmentPackageDAO()) {
                TreatmentPackageController controller = new TreatmentPackageController(dao);
                controller.create(body(request, TreatmentPackage.class));
                return message("Created successfully.");
            }
        });
    }
    @Override protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (TreatmentPackageDAO dao = new TreatmentPackageDAO()) {
                TreatmentPackageController controller = new TreatmentPackageController(dao);
                controller.update(body(request, TreatmentPackage.class));
                return message("Updated successfully.");
            }
        });
    }
    @Override protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (TreatmentPackageDAO dao = new TreatmentPackageDAO()) {
                TreatmentPackageController controller = new TreatmentPackageController(dao);
                controller.delete(id(request, "id"));
                return message("Deleted successfully.");
            }
        });
    }
}
