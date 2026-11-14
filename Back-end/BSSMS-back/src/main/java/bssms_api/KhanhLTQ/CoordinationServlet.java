package bssms_api.KhanhLTQ;

import bssms_api.common.BaseApiServlet;
import bssms_controller.DatTT.BookingManagementController;
import bssms_controller.DatTT.BookingRequest;
import bssms_controller.KhanhLTQ.CoordinationController;
import bssms_persistence.DatTT.BookingManagementDAO;
import bssms_persistence.KhanhLTQ.CoordinationDAO;
import bssms_persistence.KhanhLTQ.PackageUsageDAO;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebServlet(name = "CoordinationServlet", urlPatterns = {
    "/api/booking/coordination", "/api/booking/affected", "/api/booking/coordinate", "/api/booking/my-packages"
})
public class CoordinationServlet extends BaseApiServlet {
    private final CoordinationController controller = new CoordinationController();

    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            switch (request.getServletPath()) {
                case "/api/booking/coordination": {
                    Integer appointmentId = optionalId(request, "appointmentId");
                    if (appointmentId != null) {
                        try (BookingManagementDAO dao = new BookingManagementDAO()) {
                            return new BookingManagementController(dao).checkInPlan(user(request), appointmentId);
                        }
                    }
                    try (CoordinationDAO dao = new CoordinationDAO()) { return controller.board(user(request), dao, request.getParameter("date")); }
                }
                case "/api/booking/affected":
                    try (CoordinationDAO dao = new CoordinationDAO()) { return controller.affected(user(request), dao, optionalId(request, "appointmentId")); }
                case "/api/booking/my-packages":
                    try (PackageUsageDAO dao = new PackageUsageDAO()) { return controller.myPackages(user(request), dao, optionalId(request, "customerId")); }
                default: return unsupported();
            }
        });
    }
    @Override protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            if (!"/api/booking/coordinate".equals(request.getServletPath())) return unsupported();
            try (CoordinationDAO dao = new CoordinationDAO()) { return controller.coordinate(user(request), dao, body(request, BookingRequest.class)); }
        });
    }
}
