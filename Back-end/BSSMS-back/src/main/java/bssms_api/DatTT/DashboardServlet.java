package bssms_api.DatTT;
import bssms_controller.DatTT.DashboardController;
import bssms_api.common.BaseApiServlet;
import bssms_persistence.DatTT.ReportDAO;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebServlet("/api/dashboard-reports")
public class DashboardServlet extends BaseApiServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            try (ReportDAO dao = new ReportDAO()) {
                return new DashboardController(dao).getDashboardMetrics();
            }
        });
    }
}
