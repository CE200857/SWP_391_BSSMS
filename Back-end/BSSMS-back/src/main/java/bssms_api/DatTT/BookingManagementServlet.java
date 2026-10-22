package bssms_api.DatTT;

import bssms_controller.DatTT.BookingManagementController;
import bssms_controller.DatTT.BookingRequest;
import bssms_persistence.DatTT.BookingManagementDAO;
import bssms_api.common.BaseApiServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebServlet(name = "BookingManagementServlet", urlPatterns = {
    "/api/booking/slots", "/api/booking/my-packages", "/api/booking/online",
    "/api/booking/coordination", "/api/booking/checkin", "/api/booking/coordinate"
})
public class BookingManagementServlet extends BaseApiServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (BookingManagementDAO dao = new BookingManagementDAO()) {
                BookingManagementController controller = new BookingManagementController(dao);
                switch (request.getServletPath()) {
                    case "/api/booking/slots":
                        return controller.checkSlots(id(request, "serviceId"), request.getParameter("date"),
                                optionalId(request, "technicianId"));
                    case "/api/booking/my-packages":
                        return controller.myPackages(user(request));
                    case "/api/booking/coordination":
                        return controller.coordination(user(request), optionalId(request, "appointmentId"));
                    default: return unsupported();
                }
            }
        });
    }
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 201, () -> {
            if (!"/api/booking/online".equals(request.getServletPath())) return unsupported();
            try (BookingManagementDAO dao = new BookingManagementDAO()) {
                return new BookingManagementController(dao).createOnline(user(request), body(request, BookingRequest.class));
            }
        });
    }
    @Override protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (BookingManagementDAO dao = new BookingManagementDAO()) {
                BookingManagementController controller = new BookingManagementController(dao);
                switch (request.getServletPath()) {
                    case "/api/booking/checkin":
                        return controller.checkIn(user(request), body(request, BookingRequest.class));
                    case "/api/booking/coordinate":
                        return controller.coordinate(user(request), body(request, BookingRequest.class));
                    default: return unsupported();
                }
            }
        });
    }
}
