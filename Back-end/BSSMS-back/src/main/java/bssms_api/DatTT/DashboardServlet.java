package bssms_api.DatTT;
import bssms_account.Account;
import bssms_controller.DatTT.DashboardController;
import bssms_api.common.BaseApiServlet;
import bssms_persistence.DatTT.ReportDAO;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import bssms_controller.DatTT.ControllerException;

@WebServlet("/api/dashboard-reports")
public class DashboardServlet extends BaseApiServlet {
    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        handle(request, response, 200, () -> {
            Account currentUser = user(request);
            if (currentUser == null) throw new ControllerException(401, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            if (!"Manager".equals(currentUser.getRole())) throw new ControllerException(403, "Bạn không có quyền xem báo cáo quản lý.");
            Integer accountId = currentUser.getAccountId();
            if (accountId == null || accountId <= 0)
                throw new ControllerException(401, "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
            try (ReportDAO dao = new ReportDAO()) {
                dao.setActorAccountId(accountId);
                return new DashboardController(dao).getDashboardMetrics();
            }
        });
    }
}
