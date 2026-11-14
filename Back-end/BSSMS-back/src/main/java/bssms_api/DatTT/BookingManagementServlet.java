package bssms_api.DatTT;

import bssms_controller.DatTT.BookingManagementController;
import bssms_controller.DatTT.BookingRequest;
import bssms_persistence.DatTT.BookingManagementDAO;
import bssms_api.common.BaseApiServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebServlet(name = "BookingManagementServlet", urlPatterns = {
    "/api/booking/slots", "/api/booking/online", "/api/booking/checkin"
})
public class BookingManagementServlet extends BaseApiServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (BookingManagementDAO dao = new BookingManagementDAO()) {
                BookingManagementController controller = new BookingManagementController(dao);
                switch (request.getServletPath()) {
                    case "/api/booking/slots":
                        return controller.checkSlots(user(request), request.getParameter("serviceIds"), request.getParameter("serviceId"),
                                request.getParameter("date"), optionalId(request, "technicianId"), optionalId(request, "appointmentId"));
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
                    default: return unsupported();
                }
            }
        });
    }
}
