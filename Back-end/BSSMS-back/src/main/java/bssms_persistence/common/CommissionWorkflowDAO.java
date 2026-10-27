package bssms_persistence.common;
import bssms_persistence.DBContext;
import java.sql.*;
public class CommissionWorkflowDAO extends DBContext implements AutoCloseable {
    public void close() throws SQLException {if(conn!=null)conn.close();}
    public Object mine() throws SQLException {
        workflow().roles("Technician");
        return workflow().query("SELECT c.*,COALESCE(adj.amount,0) AS adjustment_amount,c.commission_amount+COALESCE(adj.amount,0) AS net_commission FROM Commission c JOIN " + bssms_persistence.common.SchemaSql.STAFF + " s ON s.staff_id=c.staff_id OUTER APPLY(SELECT SUM(amount) AS amount FROM CommissionAdjustment WHERE commission_id=c.commission_id) adj WHERE s.account_id=? AND c.status<>'Reversed' ORDER BY c.created_at DESC",requireActorAccountId());
    }
    public Object report(String start,String end) throws SQLException {
        workflow().roles("Manager");
        java.time.LocalDate from=java.time.LocalDate.parse(start),to=java.time.LocalDate.parse(end);
        if(to.isBefore(from)) throw new IllegalArgumentException("Invalid date range.");
        return workflow().query("SELECT s.staff_id,s.full_name,COUNT(DISTINCT c.invoice_id) AS total_invoices,SUM(c.commission_amount+COALESCE(adj.amount,0)) AS total_commission FROM Commission c JOIN " + bssms_persistence.common.SchemaSql.STAFF + " s ON s.staff_id=c.staff_id OUTER APPLY(SELECT SUM(amount) AS amount FROM CommissionAdjustment WHERE commission_id=c.commission_id) adj WHERE c.status<>'Reversed' AND c.created_at>=? AND c.created_at<DATEADD(day,1,CAST(? AS date)) GROUP BY s.staff_id,s.full_name",start,end);
    }
    public void closeMonth(String month) throws SQLException {workflow().call("usp_CloseCommissionPeriod",requireActorAccountId(),java.sql.Date.valueOf(month));}
}
