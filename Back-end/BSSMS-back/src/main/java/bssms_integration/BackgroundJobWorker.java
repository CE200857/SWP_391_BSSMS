package bssms_integration;
import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebListener;
import java.sql.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.logging.*;

@WebListener
public class BackgroundJobWorker implements ServletContextListener {
 private ScheduledExecutorService executor;
 private static volatile long lastTickMs;
 public static String lastTick(){
  if(lastTickMs==0)return null;
  return java.time.LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(lastTickMs),java.time.ZoneId.of("Asia/Ho_Chi_Minh")).withNano(0).toString().replace('T',' ');
 }
 public void contextInitialized(ServletContextEvent event){
  if(!bssms_common.AppConfig.flag("BSSMS_JOBS_ENABLED",false))return;
  executor=Executors.newSingleThreadScheduledExecutor(r->{Thread t=new Thread(r,"bssms-jobs");t.setDaemon(true);return t;});
  executor.scheduleWithFixedDelay(()->{try(Job job=new Job()){job.tick();}catch(Exception e){Logger.getLogger(getClass().getName()).log(Level.WARNING,"Background job did not finish",e);}},10,60,TimeUnit.SECONDS);
 }
 public void contextDestroyed(ServletContextEvent event){if(executor!=null)executor.shutdownNow();}
 static class Job extends DBContext implements AutoCloseable {
  public void close()throws SQLException{if(conn!=null)conn.close();}
  void tick()throws Exception {
   lastTickMs=System.currentTimeMillis();
   Workflow w=new Workflow(conn,0);
   w.transaction(()->{
    for(Map<String,Object> a:w.query("SELECT appointment_id FROM Appointment WHERE status='Pending' AND (created_at<=DATEADD(hour,-24,SYSDATETIME()) OR DATEADD(hour,-1,CAST(appointment_date AS datetime2)+CAST(start_time AS datetime2))<=SYSDATETIME())")){
     int id=Workflow.id(a.get("appointmentId"));
     if(w.update("UPDATE Appointment SET status='Cancelled',cancelled_at=SYSDATETIME(),cancellation_reason=N'Tự hủy do chưa được xác nhận (BR-09)' WHERE appointment_id=? AND status='Pending'",id)!=1)continue;
     w.history(id,"Pending","Cancelled","Tự hủy do chưa được xác nhận (BR-09)");
     for(Map<String,Object> i:w.query("SELECT invoice_id FROM Invoice WHERE appointment_id=? AND status='Unpaid'",id))
      new BillingWorkflow(w).cancel(Workflow.id(i.get("invoiceId")),"Lịch hẹn tự hủy (BR-09)",null);
    }
    PaymentGatewayDAO.expireAttempts(w);
    w.update("UPDATE CustomerPackage SET status='Expired' WHERE status='Active' AND expiry_date<CAST(SYSDATETIME() AS date)");
    return null;
   });
  }
 }
}
