package bssms_persistence.common;
import bssms_persistence.DBContext;
import java.sql.*;
public class CommissionWorkflowDAO extends DBContext implements AutoCloseable {
    public void close() throws SQLException {if(conn!=null)conn.close();}
    public Object mine() throws SQLException {
        workflow().roles("Technician");
        return workflow().query("SELECT c.*,COALESCE(adj.amount,0) AS adjustment_amount,c.commission_amount+COALESCE(adj.amount,0) AS net_commission, "
            + "COALESCE(c.appointment_id,i.appointment_id) AS appointment_id,a.appointment_date,a.start_time,a.status AS appointment_status, "
            + "COALESCE(svc.service_name,invoice_services.service_names) AS service_name "
            + "FROM Commission c JOIN " + bssms_persistence.common.SchemaSql.STAFF + " s ON s.staff_id=c.staff_id "
            + "LEFT JOIN Invoice i ON i.invoice_id=c.invoice_id "
            + "LEFT JOIN Appointment a ON a.appointment_id=COALESCE(c.appointment_id,i.appointment_id) "
            + "LEFT JOIN Service svc ON svc.service_id=COALESCE(c.service_id,a.service_id) "
            + "OUTER APPLY(SELECT STRING_AGG(svc2.service_name,', ') AS service_names "
            + "FROM InvoiceService ins JOIN Service svc2 ON svc2.service_id=ins.service_id "
            + "WHERE ins.invoice_id=c.invoice_id) invoice_services "
            + "OUTER APPLY(SELECT SUM(amount) AS amount FROM CommissionAdjustment WHERE commission_id=c.commission_id) adj "
            + "WHERE s.account_id=? AND c.status<>'Reversed' ORDER BY c.created_at DESC",requireActorAccountId());
    }
    public Object report(String start,String end) throws SQLException {
        workflow().roles("Manager");
        java.time.LocalDate from=java.time.LocalDate.parse(start),to=java.time.LocalDate.parse(end);
        if(to.isBefore(from)) throw new IllegalArgumentException("Invalid date range.");
        return workflow().query("SELECT s.staff_id,s.full_name,COUNT(DISTINCT c.invoice_id) AS total_invoices,COUNT(DISTINCT CONCAT(c.invoice_id,'-',COALESCE(c.appointment_id,0),'-',COALESCE(c.service_id,0))) AS total_services,SUM(c.commission_amount+COALESCE(adj.amount,0)) AS total_commission FROM Commission c JOIN " + bssms_persistence.common.SchemaSql.STAFF + " s ON s.staff_id=c.staff_id OUTER APPLY(SELECT SUM(amount) AS amount FROM CommissionAdjustment WHERE commission_id=c.commission_id) adj WHERE c.status<>'Reversed' AND c.created_at>=? AND c.created_at<DATEADD(day,1,CAST(? AS date)) GROUP BY s.staff_id,s.full_name",start,end);
    }
    /** Chi tiết hoa hồng của MỘT nhân viên theo từng dịch vụ (mỗi dòng = một dịch vụ trong một lịch hẹn/hóa đơn). */
    public Object lines(String start,String end,int staffId) throws SQLException {
        workflow().roles("Manager");
        java.time.LocalDate from=java.time.LocalDate.parse(start),to=java.time.LocalDate.parse(end);
        if(to.isBefore(from)) throw new IllegalArgumentException("Invalid date range.");
        return workflow().query("SELECT c.commission_id,c.invoice_id,COALESCE(c.appointment_id,i.appointment_id) AS appointment_id,a.appointment_date,a.start_time, "
            + "cu.full_name AS customer_name,COALESCE(svc.service_name,N'Không xác định') AS service_name,"
            + "COALESCE(c.staff_role,'Main') AS staff_role,COALESCE(c.share_percent,100) AS share_percent,c.service_base,c.commission_rate,c.commission_amount, "
            + "COALESCE(adj.amount,0) AS adjustment_amount,c.commission_amount+COALESCE(adj.amount,0) AS net_commission,c.status "
            + "FROM Commission c "
            + "LEFT JOIN Invoice i ON i.invoice_id=c.invoice_id "
            + "LEFT JOIN Customer cu ON cu.customer_id=i.customer_id "
            + "LEFT JOIN Appointment a ON a.appointment_id=COALESCE(c.appointment_id,i.appointment_id) "
            + "LEFT JOIN Service svc ON svc.service_id=COALESCE(c.service_id,a.service_id) "
            + "OUTER APPLY(SELECT SUM(amount) AS amount FROM CommissionAdjustment WHERE commission_id=c.commission_id) adj "
            + "WHERE c.staff_id=? AND c.status<>'Reversed' AND c.created_at>=? AND c.created_at<DATEADD(day,1,CAST(? AS date)) "
            + "ORDER BY c.created_at DESC,c.commission_id DESC",staffId,start,end);
    }
    public void closeMonth(String month) throws SQLException {workflow().call("usp_CloseCommissionPeriod",requireActorAccountId(),java.sql.Date.valueOf(month));}
}
