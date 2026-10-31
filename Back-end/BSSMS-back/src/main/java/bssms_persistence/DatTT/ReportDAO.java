package bssms_persistence.DatTT;
import bssms_persistence.DBContext;
import java.sql.*;
import java.util.*;
import bssms_persistence.common.Workflow;

public class ReportDAO extends DBContext implements AutoCloseable {
    public Map<String,Object> getDashboardMetrics() throws SQLException {
        if(conn==null || conn.isClosed()) throw new SQLException("Database connection unavailable");
        Workflow w=workflow();
        Map<String,Object> result=new LinkedHashMap<>(w.one("SELECT (SELECT COUNT(*) FROM " + bssms_persistence.common.SchemaSql.CUSTOMERS + " Customer) AS total_customers, COALESCE((SELECT SUM(amount) FROM Payment WHERE status='Success'),0)-COALESCE((SELECT SUM(amount) FROM Refund WHERE status='Success'),0) AS total_revenue, (SELECT COUNT(*) FROM Appointment WHERE appointment_date=CONVERT(date,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time')) AS today_appointments, (SELECT COUNT(*) FROM Invoice WHERE status='Unpaid') AS unpaid_invoices"));
        result.put("today",w.one("SELECT CONVERT(char(10),SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time',23) AS today").get("today"));
        result.put("dailyCash",w.query("WITH days AS (SELECT DATEADD(day,-v.n,CONVERT(date,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time')) AS day FROM (VALUES(0),(1),(2),(3),(4),(5),(6)) v(n)) SELECT CONVERT(char(10),d.day,23) AS day,COALESCE(p.amount,0) AS received,COALESCE(r.amount,0) AS refunded,COALESCE(p.amount,0)-COALESCE(r.amount,0) AS net FROM days d OUTER APPLY(SELECT SUM(amount) AS amount FROM Payment WHERE status='Success' AND payment_date>=d.day AND payment_date<DATEADD(day,1,d.day)) p OUTER APPLY(SELECT SUM(amount) AS amount FROM Refund WHERE status='Success' AND completed_at>=d.day AND completed_at<DATEADD(day,1,d.day)) r ORDER BY d.day"));
        result.put("statusCounts",w.query("SELECT status,COUNT(*) AS total FROM Appointment WHERE appointment_date=CONVERT(date,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time') GROUP BY status"));
        result.put("todaySchedule",w.query("SELECT a.appointment_id,c.full_name AS customer_name,s.service_name,a.start_time,a.end_time,a.status FROM Appointment a JOIN " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c ON c.customer_id=a.customer_id JOIN Service s ON s.service_id=a.service_id WHERE a.appointment_date=CONVERT(date,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time') ORDER BY a.start_time,a.appointment_id"));
        result.put("topServices",w.query("SELECT TOP 5 s.service_id,s.service_name,COUNT(*) AS completed_count FROM Appointment a JOIN Service s ON s.service_id=a.service_id WHERE a.status='Completed' GROUP BY s.service_id,s.service_name ORDER BY COUNT(*) DESC,s.service_id"));
        return result;
    }
    @Override public void close() throws SQLException {if(conn!=null)conn.close();}
}
