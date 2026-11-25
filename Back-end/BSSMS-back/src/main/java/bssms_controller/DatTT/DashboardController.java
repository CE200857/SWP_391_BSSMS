package bssms_controller.DatTT;
import bssms_persistence.DatTT.ReportDAO;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Map;

public class DashboardController {
    private final ReportDAO dao;
    public DashboardController(ReportDAO dao) { this.dao = dao; }
    public Map<String, Object> getDashboardMetrics(String fromDate, String toDate) throws SQLException {
        return dao.getDashboardMetrics(date(fromDate), date(toDate));
    }
    private static String date(String value) {
        if (value == null || value.isBlank()) return null;
        try { return LocalDate.parse(value.trim()).toString(); }
        catch (DateTimeParseException e) { throw new IllegalArgumentException("Invalid date."); }
    }
}
