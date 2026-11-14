package bssms_persistence.DatTT;
import bssms_persistence.DBContext;
import bssms_persistence.common.SchemaSql;
import bssms_persistence.common.Workflow;
import java.sql.*;
import java.util.*;

public class ReportDAO extends DBContext implements AutoCloseable {
    private static final String TODAY = "CONVERT(date,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time')";

    public Map<String, Object> getDashboardMetrics(String fromDate, String toDate) throws SQLException {
        if (conn == null || conn.isClosed()) throw new SQLException("Database connection unavailable");
        Workflow w = workflow();
        String today = String.valueOf(w.one("SELECT CONVERT(char(10)," + TODAY + ",23) AS today").get("today"));
        String to = toDate == null ? today : toDate;
        String from = fromDate == null ? java.time.LocalDate.parse(to).minusDays(29).toString() : fromDate;
        if (from.compareTo(to) > 0) throw new IllegalArgumentException("Từ ngày phải trước hoặc bằng đến ngày.");
        if (java.time.temporal.ChronoUnit.DAYS.between(java.time.LocalDate.parse(from), java.time.LocalDate.parse(to)) > 366)
            throw new IllegalArgumentException("Khoảng thời gian báo cáo tối đa 1 năm.");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("today", today);
        result.put("fromDate", from);
        result.put("toDate", to);
        Map<String, Object> money = w.one("SELECT "
                + "COALESCE((SELECT SUM(amount) FROM Payment WHERE status IN ('Success','Refunded') AND CAST(payment_date AS DATE) BETWEEN ? AND ?),0) AS gross_revenue,"
                + "COALESCE((SELECT SUM(amount) FROM Refund WHERE status='Completed' AND CAST(completed_at AS DATE) BETWEEN ? AND ?),0) AS refunded,"
                + "COALESCE((SELECT SUM(p.amount) FROM Payment p JOIN Invoice i ON i.invoice_id=p.invoice_id WHERE i.invoice_type='Appointment' AND p.status IN ('Success','Refunded') AND CAST(p.payment_date AS DATE) BETWEEN ? AND ?),0) AS service_revenue,"
                + "COALESCE((SELECT SUM(p.amount) FROM Payment p JOIN Invoice i ON i.invoice_id=p.invoice_id WHERE i.invoice_type='Package' AND p.status IN ('Success','Refunded') AND CAST(p.payment_date AS DATE) BETWEEN ? AND ?),0) AS package_revenue",
                from, to, from, to, from, to, from, to);
        result.put("grossRevenue", money.get("grossRevenue"));
        result.put("refunded", money.get("refunded"));
        result.put("totalRevenue", new java.math.BigDecimal(String.valueOf(money.get("grossRevenue"))).subtract(new java.math.BigDecimal(String.valueOf(money.get("refunded")))));
        result.put("serviceRevenue", money.get("serviceRevenue"));
        result.put("packageRevenue", money.get("packageRevenue"));

        Map<String, Object> counts = w.one("SELECT "
                + "(SELECT COUNT(*) FROM " + SchemaSql.CUSTOMERS + " c0 WHERE c0.status<>'Pending') AS total_customers,"
                + "(SELECT COUNT(*) FROM Customer WHERE status<>'Pending' AND CAST(created_at AS DATE) BETWEEN ? AND ?) AS new_customers,"
                + "(SELECT COUNT(*) FROM Appointment WHERE appointment_date=" + TODAY + ") AS today_appointments,"
                + "(SELECT COUNT(*) FROM Invoice WHERE status='Unpaid') AS unpaid_invoices,"
                + "(SELECT COUNT(*) FROM Refund WHERE status='Pending') AS pending_refunds,"
                + "(SELECT COUNT(*) FROM Appointment WHERE appointment_date BETWEEN ? AND ?) AS period_appointments,"
                + "(SELECT COUNT(*) FROM Appointment WHERE appointment_date BETWEEN ? AND ? AND status='No-show') AS no_show_count,"
                + "(SELECT COUNT(*) FROM Appointment WHERE appointment_date BETWEEN ? AND ? AND status IN ('Completed','No-show')) AS attended_or_missed",
                from, to, from, to, from, to, from, to);
        result.putAll(counts);
        long missed = ((Number) counts.get("noShowCount")).longValue();
        long base = ((Number) counts.get("attendedOrMissed")).longValue();
        result.put("noShowRate", base == 0 ? 0 : Math.round(missed * 1000.0 / base) / 10.0);

        result.put("dailyCash", w.query("WITH days AS (SELECT CAST(? AS DATE) AS day UNION ALL SELECT DATEADD(day,1,day) FROM days WHERE day<CAST(? AS DATE)) "
                + "SELECT CONVERT(char(10),d.day,23) AS day,"
                + "COALESCE((SELECT SUM(p.amount) FROM Payment p WHERE p.status IN ('Success','Refunded') AND CAST(p.payment_date AS DATE)=d.day),0)"
                + "-COALESCE((SELECT SUM(r.amount) FROM Refund r WHERE r.status='Completed' AND CAST(r.completed_at AS DATE)=d.day),0) AS amount "
                + "FROM days d ORDER BY d.day OPTION (MAXRECURSION 400)", from, to));
        result.put("statusCounts", w.query("SELECT status,COUNT(*) AS total FROM Appointment WHERE appointment_date BETWEEN ? AND ? GROUP BY status ORDER BY status", from, to));
        result.put("todaySchedule", w.query("SELECT a.appointment_id,c.full_name AS customer_name,"
                + "STUFF((SELECT N', '+s.service_name FROM AppointmentService l JOIN Service s ON s.service_id=l.service_id WHERE l.appointment_id=a.appointment_id ORDER BY l.line_no FOR XML PATH(''),TYPE).value('.','NVARCHAR(MAX)'),1,2,N'') AS service_name,"
                + "a.start_time,a.end_time,a.status FROM Appointment a JOIN Customer c ON c.customer_id=a.customer_id "
                + "WHERE a.appointment_date=" + TODAY + " ORDER BY a.start_time"));
        result.put("topServices", w.query("SELECT TOP 5 s.service_id,s.service_name,COUNT(*) AS completed_count,SUM(CASE WHEN l.customer_package_id IS NULL THEN l.unit_price ELSE 0 END) AS revenue "
                + "FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id JOIN Service s ON s.service_id=l.service_id "
                + "WHERE l.status='Done' AND a.appointment_date BETWEEN ? AND ? GROUP BY s.service_id,s.service_name ORDER BY COUNT(*) DESC,s.service_name", from, to));
        result.put("topTechnicians", w.query("SELECT TOP 5 st.staff_id,st.full_name,COUNT(*) AS completed_count,SUM(l.tour_count) AS tours "
                + "FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id JOIN Staff st ON st.staff_id=l.technician_id "
                + "WHERE l.status='Done' AND a.appointment_date BETWEEN ? AND ? GROUP BY st.staff_id,st.full_name ORDER BY SUM(l.tour_count) DESC", from, to));
        return result;
    }
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }
}
