package bssms_integration;
import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import com.google.gson.*;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebListener;
import java.net.URI;
import java.net.http.*;
import java.sql.*;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.logging.*;

/** Opt-in background jobs. Never retry an ambiguous provider response automatically. */
@WebListener
public class NotificationWorker implements ServletContextListener {
 private ScheduledExecutorService executor;
 private static volatile long lastTickMs;
 /** Giờ (Việt Nam) lần chạy gần nhất của tiến trình gửi tin, hoặc null nếu chưa chạy lượt nào. */
 public static String lastTick(){
  if(lastTickMs==0)return null;
  return java.time.LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(lastTickMs),java.time.ZoneId.of("Asia/Ho_Chi_Minh")).withNano(0).toString().replace('T',' ');
 }
 public void contextInitialized(ServletContextEvent event){
  if(!bssms_common.AppConfig.flag("BSSMS_JOBS_ENABLED",false))return;
  executor=Executors.newSingleThreadScheduledExecutor(r->{Thread t=new Thread(r,"bssms-notifications");t.setDaemon(true);return t;});
  executor.scheduleWithFixedDelay(()->{try(Job job=new Job()){job.tick();}catch(Exception e){Logger.getLogger(getClass().getName()).log(Level.WARNING,"Background job did not finish",e);}},10,60,TimeUnit.SECONDS);
 }
 public void contextDestroyed(ServletContextEvent event){if(executor!=null)executor.shutdownNow();}
 static class Job extends DBContext implements AutoCloseable {
  public void close()throws SQLException{if(conn!=null)conn.close();}
  private static final int MAX_AUTO_ATTEMPTS=3;
  void tick()throws Exception {
   lastTickMs=System.currentTimeMillis();
   Workflow w=new Workflow(conn,0);w.call("usp_IssueMonthlyBenefits");w.call("usp_ExpireUnpaidOnlineInvoices");w.call("usp_QueuePackageReminders");
   if(!ZnsClient.configured())return;
   JsonObject templates=ZnsClient.templates();
   // Mỗi lượt (60 giây) gửi tối đa 20 tin để lịch nhắc không bị dồn lại.
   for(int sent=0;sent<20;sent++)if(!next(w,templates))break;
  }
  /** Lấy và gửi một tin đang chờ; trả về false khi không còn tin nào. */
  private boolean next(Workflow w,JsonObject templates)throws Exception {
   // The atomic claim supports multiple application instances. Interrupted claims stay Sending for reconciliation.
   List<Map<String,Object>> rows=w.query(";WITH next_message AS (SELECT TOP(1) * FROM NotificationOutbox WITH(UPDLOCK,READPAST,ROWLOCK) WHERE status='Pending' AND scheduled_at<=CONVERT(datetime2,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time') ORDER BY scheduled_at,notification_id) UPDATE next_message SET status='Sending',attempt_count=attempt_count+1 OUTPUT inserted.*;");
   if(rows.isEmpty())return false;
   Map<String,Object> row=rows.get(0);Object id=row.get("notificationId");
   try {
   JsonObject payload=JsonParser.parseString(row.get("payload").toString()).getAsJsonObject();
   JsonObject template=templates.has(row.get("templateCode").toString())?templates.getAsJsonObject(row.get("templateCode").toString()):null;
    if(template==null)throw new IllegalArgumentException("Chưa cấu hình template "+row.get("templateCode"));
    Map<String,Object> customer=w.one("SELECT full_name,phone FROM Customer WHERE customer_id=? AND status='Active'",row.get("customerId"));
    payload.addProperty("customerName",customer.get("fullName").toString());
    boolean booked="APPOINTMENT_BOOKED".equals(row.get("templateCode"));
    if(booked||"APPOINTMENT_REMINDER".equals(row.get("templateCode"))){
     Map<String,Object> appointment=w.one("SELECT a.status,a.appointment_date,a.start_time,(SELECT STRING_AGG(s.service_name,N', ') WITHIN GROUP (ORDER BY l.line_no) FROM vw_AppointmentLine l JOIN Service s ON s.service_id=l.service_id WHERE l.appointment_id=a.appointment_id) AS service_names FROM Appointment a WHERE a.appointment_id=?",payload.get("appointmentId").getAsInt());
     if(!Arrays.asList("Pending","Confirmed").contains(appointment.get("status")))throw new IllegalArgumentException(booked?"Lịch hẹn không còn hiệu lực":"Lịch hẹn không còn cần nhắc");
     java.time.LocalDateTime current=java.time.LocalDateTime.of(java.time.LocalDate.parse(appointment.get("appointmentDate").toString()),java.time.LocalTime.parse(appointment.get("startTime").toString()));
     if(!booked){
      // Tin nhắc: chỉ gửi nếu lịch còn nguyên giờ đã hẹn và chưa qua giờ hẹn.
      if(!current.equals(java.time.LocalDateTime.parse(payload.get("appointmentTime").getAsString())))throw new IllegalArgumentException("Lịch hẹn đã đổi giờ");
      if(!current.isAfter(java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"))))throw new IllegalArgumentException("Đã qua giờ hẹn, không nhắc nữa");
     }
     // Giờ hiển thị cho khách: 13:00 09/11/2026 (không dùng dạng ISO).
     payload.addProperty("appointmentTime",current.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy")));
     payload.addProperty("serviceName",Objects.toString(appointment.get("serviceNames"),""));
    }
    if("PACKAGE_REMINDER".equals(row.get("templateCode"))) {
     Map<String,Object> pkg=w.one("SELECT cp.status,cp.remaining_sessions,cp.expiry_date,tp.package_name,i.status AS invoice_status,cp.sold_invoice_id FROM CustomerPackage cp JOIN TreatmentPackage tp ON tp.treatment_package_id=cp.treatment_package_id LEFT JOIN Invoice i ON i.invoice_id=cp.sold_invoice_id WHERE cp.customer_package_id=? AND cp.customer_id=?",payload.get("customerPackageId").getAsInt(),row.get("customerId"));
     java.time.LocalDateTime expiry=java.time.LocalDateTime.parse(pkg.get("expiryDate").toString().replace(' ','T'));
     if(!"Active".equals(pkg.get("status")) || ((Number)pkg.get("remainingSessions")).intValue()<=0 || !expiry.isAfter(java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"))) || (pkg.get("soldInvoiceId")!=null && !"Paid".equals(pkg.get("invoiceStatus"))))throw new IllegalArgumentException("Gói không còn phù hợp để gửi nhắc.");
     payload.addProperty("remainingSessions",((Number)pkg.get("remainingSessions")).intValue());
     payload.addProperty("expiryDate",expiry.toString());
     payload.addProperty("packageName",pkg.get("packageName").toString());
    }
    if(payload.has("invoiceId")){Map<String,Object> invoice=w.one("SELECT total_amount FROM Invoice WHERE invoice_id=?",payload.get("invoiceId").getAsInt());payload.addProperty("totalAmount",invoice.get("totalAmount").toString());}
    String phone=ZnsClient.normalizePhone(Objects.toString(customer.get("phone"),""));
    JsonObject data=new JsonObject();for(Map.Entry<String,JsonElement> field:template.getAsJsonObject("fields").entrySet()){
     JsonElement value=payload.get(field.getValue().getAsString());if(value==null||value.isJsonNull())throw new IllegalArgumentException("Thiếu dữ liệu template: "+field.getKey());data.add(field.getKey(),value);
    }
    JsonObject body=new JsonObject();body.addProperty("phone",phone);body.add("template_id",template.get("id"));body.add("template_data",data);body.addProperty("tracking_id","BSSMS"+id);
    JsonObject result=ZnsClient.send(body); // tự làm mới token Zalo khi hết hạn, và thêm mode=development nếu cấu hình
    if(result.has("error")&&result.get("error").getAsInt()==0&&result.has("data")&&result.getAsJsonObject("data").has("msg_id"))w.update("UPDATE NotificationOutbox SET status='Sent',provider_message_id=?,sent_at=CONVERT(datetime2,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time'),last_error=NULL WHERE notification_id=?",result.getAsJsonObject("data").get("msg_id").getAsString(),id);
    else {
     // 4.8: an explicit rejection means nothing was delivered, so it is safe to retry automatically with back-off.
     String reason="Zalo từ chối: error="+(result.has("error")?result.get("error").toString():"unknown");
     int attempts=row.get("attemptCount") instanceof Number?((Number)row.get("attemptCount")).intValue():MAX_AUTO_ATTEMPTS;
     if(attempts<MAX_AUTO_ATTEMPTS)w.update("UPDATE NotificationOutbox SET status='Pending',last_error=?,scheduled_at=DATEADD(minute,?,CONVERT(datetime2,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time')) WHERE notification_id=?",reason+" (tự động thử lại lần "+(attempts+1)+")",10*attempts,id);
     else w.update("UPDATE NotificationOutbox SET status='Failed',last_error=? WHERE notification_id=?",reason,id);
    }
   }catch(IllegalArgumentException e){w.update("UPDATE NotificationOutbox SET status='Failed',last_error=? WHERE notification_id=?",e.getMessage(),id);}
   catch(Exception e){if(e instanceof InterruptedException)Thread.currentThread().interrupt();w.update("UPDATE NotificationOutbox SET last_error=? WHERE notification_id=?","Chưa rõ kết quả gửi; kiểm tra nhà cung cấp trước khi thử lại: "+e.getClass().getSimpleName(),id);}
   return true;
  }
 }
}
