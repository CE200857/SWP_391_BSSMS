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
 public void contextInitialized(ServletContextEvent event){
  if(!Boolean.parseBoolean(System.getenv("BSSMS_JOBS_ENABLED")))return;
  executor=Executors.newSingleThreadScheduledExecutor(r->{Thread t=new Thread(r,"bssms-notifications");t.setDaemon(true);return t;});
  executor.scheduleWithFixedDelay(()->{try(Job job=new Job()){job.tick();}catch(Exception e){Logger.getLogger(getClass().getName()).log(Level.WARNING,"Background job did not finish",e);}},10,60,TimeUnit.SECONDS);
 }
 public void contextDestroyed(ServletContextEvent event){if(executor!=null)executor.shutdownNow();}
 static class Job extends DBContext implements AutoCloseable {
  public void close()throws SQLException{if(conn!=null)conn.close();}
  void tick()throws Exception {
   Workflow w=new Workflow(conn,0);w.call("usp_IssueMonthlyBenefits");w.call("usp_QueuePackageReminders");
   String token=System.getenv("BSSMS_ZALO_ACCESS_TOKEN"),config=System.getenv("BSSMS_ZALO_TEMPLATES");
   if(token==null||token.isBlank()||config==null||config.isBlank())return;
   JsonObject templates=JsonParser.parseString(config).getAsJsonObject();
   // The atomic claim supports multiple application instances. Interrupted claims stay Sending for reconciliation.
   List<Map<String,Object>> rows=w.query(";WITH next_message AS (SELECT TOP(1) * FROM NotificationOutbox WITH(UPDLOCK,READPAST,ROWLOCK) WHERE status='Pending' AND scheduled_at<=CONVERT(datetime2,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time') ORDER BY scheduled_at,notification_id) UPDATE next_message SET status='Sending',attempt_count=attempt_count+1 OUTPUT inserted.*;");
   if(rows.isEmpty())return;
   Map<String,Object> row=rows.get(0);Object id=row.get("notificationId");
   try {
   JsonObject payload=JsonParser.parseString(row.get("payload").toString()).getAsJsonObject();
   JsonObject template=templates.has(row.get("templateCode").toString())?templates.getAsJsonObject(row.get("templateCode").toString()):null;
    if(template==null)throw new IllegalArgumentException("Chưa cấu hình template "+row.get("templateCode"));
    Map<String,Object> customer=w.one("SELECT full_name,phone FROM Customer WHERE customer_id=? AND status='Active'",row.get("customerId"));
    payload.addProperty("customerName",customer.get("fullName").toString());
    if("APPOINTMENT_REMINDER".equals(row.get("templateCode"))){
     Map<String,Object> appointment=w.one("SELECT a.status,a.appointment_date,a.start_time,s.service_name FROM Appointment a JOIN Service s ON s.service_id=a.service_id WHERE appointment_id=?",payload.get("appointmentId").getAsInt());
     if(!Arrays.asList("Pending","Confirmed").contains(appointment.get("status")))throw new IllegalArgumentException("Lịch hẹn không còn cần nhắc");
     java.time.LocalDateTime current=java.time.LocalDateTime.of(java.time.LocalDate.parse(appointment.get("appointmentDate").toString()),java.time.LocalTime.parse(appointment.get("startTime").toString()));
     if(!current.equals(java.time.LocalDateTime.parse(payload.get("appointmentTime").getAsString())))throw new IllegalArgumentException("Lịch hẹn đã đổi giờ");
     payload.addProperty("serviceName",appointment.get("serviceName").toString());
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
    String phone=Objects.toString(customer.get("phone"),"").replaceAll("[^0-9]","");if(phone.startsWith("0"))phone="84"+phone.substring(1);if(!phone.matches("84[0-9]{9}"))throw new IllegalArgumentException("Số điện thoại không hợp lệ");
    JsonObject data=new JsonObject();for(Map.Entry<String,JsonElement> field:template.getAsJsonObject("fields").entrySet()){
     JsonElement value=payload.get(field.getValue().getAsString());if(value==null||value.isJsonNull())throw new IllegalArgumentException("Thiếu dữ liệu template: "+field.getKey());data.add(field.getKey(),value);
    }
    JsonObject body=new JsonObject();body.addProperty("phone",phone);body.add("template_id",template.get("id"));body.add("template_data",data);body.addProperty("tracking_id","BSSMS"+id);
    HttpRequest req=HttpRequest.newBuilder(URI.create("https://business.openapi.zalo.me/message/template")).timeout(Duration.ofSeconds(20)).header("Content-Type","application/json").header("access_token",token).POST(HttpRequest.BodyPublishers.ofString(body.toString())).build();
    HttpResponse<String> response=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build().send(req,HttpResponse.BodyHandlers.ofString());
    if(response.statusCode()!=200)throw new java.io.IOException("HTTP "+response.statusCode());
    JsonObject result=JsonParser.parseString(response.body()).getAsJsonObject();
    if(result.has("error")&&result.get("error").getAsInt()==0&&result.has("data")&&result.getAsJsonObject("data").has("msg_id"))w.update("UPDATE NotificationOutbox SET status='Sent',provider_message_id=?,sent_at=CONVERT(datetime2,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time'),last_error=NULL WHERE notification_id=?",result.getAsJsonObject("data").get("msg_id").getAsString(),id);
    else w.update("UPDATE NotificationOutbox SET status='Failed',last_error=? WHERE notification_id=?","Zalo từ chối: error="+(result.has("error")?result.get("error").toString():"unknown"),id);
   }catch(IllegalArgumentException e){w.update("UPDATE NotificationOutbox SET status='Failed',last_error=? WHERE notification_id=?",e.getMessage(),id);}
   catch(Exception e){if(e instanceof InterruptedException)Thread.currentThread().interrupt();w.update("UPDATE NotificationOutbox SET last_error=? WHERE notification_id=?","Chưa rõ kết quả gửi; kiểm tra nhà cung cấp trước khi thử lại: "+e.getClass().getSimpleName(),id);}
  }
 }
}
