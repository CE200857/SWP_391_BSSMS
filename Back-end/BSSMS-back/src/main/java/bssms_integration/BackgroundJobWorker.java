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
 private static final Logger LOG=Logger.getLogger(BackgroundJobWorker.class.getName());
 // Appointment start as datetime2 (SQL Server cannot add two datetime2 values directly).
 static final String START="DATEADD(minute,DATEDIFF(minute,CAST('00:00' AS time),start_time),CAST(appointment_date AS datetime2))";
 private ScheduledExecutorService executor;
 private static volatile long lastTickMs;
 public static String lastTick(){
  if(lastTickMs==0)return null;
  return java.time.LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(lastTickMs),java.time.ZoneId.of("Asia/Ho_Chi_Minh")).withNano(0).toString().replace('T',' ');
 }
 public void contextInitialized(ServletContextEvent event){
  if(!bssms_common.AppConfig.flag("BSSMS_JOBS_ENABLED",true))return;
  executor=Executors.newSingleThreadScheduledExecutor(r->{Thread t=new Thread(r,"bssms-jobs");t.setDaemon(true);return t;});
  executor.scheduleWithFixedDelay(()->{try(Job job=new Job()){job.tick();}catch(Exception e){LOG.log(Level.WARNING,"Background job did not finish",e);}},10,60,TimeUnit.SECONDS);
 }
 public void contextDestroyed(ServletContextEvent event){if(executor!=null)executor.shutdownNow();}
 static class Job extends DBContext implements AutoCloseable {
  public void close()throws SQLException{if(conn!=null)conn.close();}
  void tick()throws Exception {
   lastTickMs=System.currentTimeMillis();
   Workflow w=new Workflow(conn,0);
   // 1. Pending and not confirmed in time (24h after booking, or less than 1h before start) -> Cancelled
   for(Map<String,Object> a:w.query("SELECT appointment_id FROM Appointment WHERE status='Pending' AND (created_at<=DATEADD(hour,-"+Timing.CONFIRM_WITHIN_HOURS+",SYSDATETIME()) OR DATEADD(hour,-"+Timing.CONFIRM_BEFORE_HOURS+","+START+")<=SYSDATETIME())"))
    step(w,Workflow.id(a.get("appointmentId")),"Pending","Cancelled","Auto-cancelled because it was not confirmed in time");
   // 2. Confirmed but the customer did not check in within 15 minutes of the start time -> No-show
   for(Map<String,Object> a:w.query("SELECT appointment_id FROM Appointment WHERE status='Confirmed' AND DATEADD(minute,"+Timing.LATE_MINUTES+","+START+")<SYSDATETIME()"))
    step(w,Workflow.id(a.get("appointmentId")),"Confirmed","No-show","Auto-marked No-show: the customer did not check in within 15 minutes");
   w.transaction(()->{
    PaymentGatewayDAO.expireAttempts(w);
    w.update("UPDATE CustomerPackage SET status='Expired' WHERE status='Active' AND expiry_date<CAST(SYSDATETIME() AS date)");
    return null;
   });
  }
  // Each appointment in its own transaction, so one bad row cannot block the others.
  private void step(Workflow w,int id,String from,String to,String reason){
   try{
    w.transaction(()->{
     int n="Cancelled".equals(to)
      ?w.update("UPDATE Appointment SET status='Cancelled',cancelled_at=SYSDATETIME(),cancellation_reason=? WHERE appointment_id=? AND status=?",reason,id,from)
      :w.update("UPDATE Appointment SET status='No-show' WHERE appointment_id=? AND status=?",id,from);
     if(n!=1)return null;
     w.history(id,from,to,reason);
     for(Map<String,Object> i:w.query("SELECT invoice_id FROM Invoice WHERE appointment_id=? AND status='Unpaid'",id))
      new BillingWorkflow(w).cancel(Workflow.id(i.get("invoiceId")),"Cancelled".equals(to)?"Appointment auto-cancelled":"Customer did not show up (No-show)",null);
     return null;
    });
   }catch(Exception e){LOG.log(Level.WARNING,"Could not change appointment "+id+" from "+from+" to "+to,e);}
  }
 }
}
