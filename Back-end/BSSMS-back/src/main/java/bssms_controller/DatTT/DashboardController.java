package bssms_controller.DatTT;
import bssms_persistence.DatTT.ReportDAO;
import java.sql.SQLException;
import java.util.Map;

public class DashboardController {
    private final ReportDAO dao;
    public DashboardController(ReportDAO dao) { this.dao = dao; }
    public Map<String, Object> getDashboardMetrics() throws SQLException {
        return dao.getDashboardMetrics();
    }
}
