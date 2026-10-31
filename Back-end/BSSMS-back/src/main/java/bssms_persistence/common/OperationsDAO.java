package bssms_persistence.common;

import bssms_persistence.DBContext;
import com.google.gson.*;
import java.sql.*;
import java.time.*;
import java.math.BigDecimal;
import java.util.*;

/** Manager configuration and scheduling. Every write is validated under the workflow lock. */
public class OperationsDAO extends DBContext implements AutoCloseable {
    public void close() throws SQLException { if(conn!=null)conn.close(); }
    private int integer(JsonObject d,String k) {
        if(!d.has(k)||d.get(k).isJsonNull())throw new IllegalArgumentException("Thiếu "+k);
        int v=d.get(k).getAsBigDecimal().intValueExact();
        if(v<=0)throw new IllegalArgumentException(k+" phải lớn hơn 0");return v;
    }
    private String text(JsonObject d,String k) {
        if(!d.has(k)||d.get(k).isJsonNull())throw new IllegalArgumentException("Thiếu "+k);
        String v=d.get(k).getAsString().trim();if(v.isEmpty()||v.length()>500)throw new IllegalArgumentException(k+" không hợp lệ");return v;
    }
    public Object read(String kind,String date) throws SQLException {
        Workflow w=workflow();w.roles("Manager");
        switch(kind) {
        case "scheduling":
            LocalDate day=date==null?LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")):LocalDate.parse(date);
            Map<String,Object> r=new LinkedHashMap<>();
            r.put("staff",w.query("SELECT staff_id,full_name,role FROM Staff WHERE status='Active'"));
            r.put("services",w.query("SELECT service_id,service_name FROM Service WHERE status='Active'"));
            r.put("shifts",w.query("SELECT ss.*,s.full_name FROM StaffShift ss JOIN Staff s ON s.staff_id=ss.staff_id WHERE shift_date=? ORDER BY start_time",day));
            r.put("leaves",w.query("SELECT l.*,s.full_name FROM StaffLeave l JOIN Staff s ON s.staff_id=l.staff_id WHERE end_date>=? ORDER BY start_date",day));
            r.put("skills",w.query("SELECT ss.*,s.full_name,sv.service_name FROM StaffService ss JOIN Staff s ON s.staff_id=ss.staff_id JOIN Service sv ON sv.service_id=ss.service_id"));return r;
        case "catalog-rules":
            return Map.of("services",w.query("SELECT service_id,service_name FROM Service WHERE status='Active'"),
                "products",w.query("SELECT product_id,product_name,unit FROM Product WHERE product_type='Consumable' AND status='Active'"),
                "equipment",w.query("SELECT equipment_id,equipment_name FROM Equipment WHERE status='Active'"),
                "materials",w.query("SELECT sm.*,s.service_name,p.product_name,p.unit FROM ServiceMaterial sm JOIN Service s ON s.service_id=sm.service_id JOIN Product p ON p.product_id=sm.product_id"),
                "requirements",w.query("SELECT se.*,s.service_name,e.equipment_name FROM ServiceEquipment se JOIN Service s ON s.service_id=se.service_id JOIN Equipment e ON e.equipment_id=se.equipment_id"));
        case "stock":return Map.of("products",w.query("SELECT * FROM Product ORDER BY product_name"),"movements",w.query("SELECT TOP(300) m.*,p.product_name FROM InventoryMovement m JOIN Product p ON p.product_id=m.product_id ORDER BY movement_id DESC"));
        case "policy":return Map.of("policy",w.one("SELECT * FROM vw_CurrentPolicy"),"periods",w.query("SELECT * FROM CommissionPeriod ORDER BY period_month DESC"),"notifications",w.query("SELECT TOP(100) n.*,c.full_name FROM NotificationOutbox n JOIN Customer c ON c.customer_id=n.customer_id ORDER BY notification_id DESC"));
        default:throw new WorkflowException(404,"Không tìm thấy chức năng.");
        }
    }
    public Object write(String kind,JsonObject d) throws SQLException {
        Workflow w=workflow();w.roles("Manager");String action=text(d,"action");
        return w.transaction(()->{
            if(kind.equals("scheduling")) {
                if(action.equals("shift")) {
                    int staff=integer(d,"staffId");LocalDate date=LocalDate.parse(text(d,"date"));LocalTime start=LocalTime.parse(text(d,"start")),end=LocalTime.parse(text(d,"end"));
                    if(!end.isAfter(start))throw new IllegalArgumentException("Giờ kết thúc phải sau giờ bắt đầu.");
                    if(w.query("SELECT staff_id FROM Staff WHERE staff_id=? AND status='Active'",staff).isEmpty())throw new IllegalArgumentException("Nhân viên không hoạt động.");
                    if(!w.query("SELECT staff_shift_id FROM StaffShift WHERE staff_id=? AND shift_date=? AND start_time<CAST(? AS time) AND end_time>CAST(? AS time)",staff,date,end,start).isEmpty() || !w.query("SELECT leave_id FROM StaffLeave WHERE staff_id=? AND ? BETWEEN start_date AND end_date",staff,date).isEmpty())throw new WorkflowException(409,"Trùng ca làm hoặc ngày nghỉ.");
                    w.update("INSERT StaffShift(staff_id,shift_date,start_time,end_time) VALUES(?,?,?,?)",staff,date,start,end);
                } else if(action.equals("updateShift")) {
                    int id=integer(d,"id");
                    int staff=Workflow.id(w.one("SELECT staff_id FROM StaffShift WHERE staff_shift_id=?",id).get("staffId"));
                    LocalDate date=LocalDate.parse(text(d,"date"));
                    LocalTime start=LocalTime.parse(text(d,"start")),end=LocalTime.parse(text(d,"end"));
                    if(!end.isAfter(start))throw new IllegalArgumentException("Giờ kết thúc phải sau giờ bắt đầu.");
                    if(!w.query("SELECT staff_shift_id FROM StaffShift WHERE staff_id=? AND staff_shift_id<>? AND shift_date=? AND start_time<CAST(? AS time) AND end_time>CAST(? AS time)",staff,id,date,end,start).isEmpty()
                        || !w.query("SELECT leave_id FROM StaffLeave WHERE staff_id=? AND ? BETWEEN start_date AND end_date",staff,date).isEmpty())throw new WorkflowException(409,"Trùng ca làm hoặc ngày nghỉ.");
                    w.update("UPDATE StaffShift SET shift_date=?,start_time=?,end_time=? WHERE staff_shift_id=?",date,start,end,id);
                    if(!w.query("SELECT a.appointment_id FROM Appointment a JOIN AppointmentStaff ast ON ast.appointment_id=a.appointment_id WHERE ast.staff_id=? AND a.status IN ('Pending','Confirmed','Checked-in','In-progress') AND NOT EXISTS(SELECT 1 FROM StaffShift ss WHERE ss.staff_id=ast.staff_id AND ss.shift_date=a.appointment_date AND ss.start_time<=a.start_time AND ss.end_time>=a.end_time)",staff).isEmpty())throw new WorkflowException(409,"Ca mới không bao phủ lịch hẹn đã phân công.");
                } else if(action.equals("deleteShift")) {
                    int id=integer(d,"id");
                    if(!w.query("SELECT a.appointment_id FROM Appointment a JOIN AppointmentStaff ast ON ast.appointment_id=a.appointment_id JOIN StaffShift ss ON ss.staff_id=ast.staff_id AND ss.shift_date=a.appointment_date WHERE ss.staff_shift_id=? AND a.status IN ('Pending','Confirmed','Checked-in','In-progress') AND a.start_time<ss.end_time AND a.end_time>ss.start_time",id).isEmpty())throw new WorkflowException(409,"Ca làm còn lịch hẹn, cần điều phối lại trước.");
                    w.update("DELETE FROM StaffShift WHERE staff_shift_id=?",id);
                } else if(action.equals("leave")) {
                    int staff=integer(d,"staffId");LocalDate start=LocalDate.parse(text(d,"start")),end=LocalDate.parse(text(d,"end"));
                    if(end.isBefore(start))throw new IllegalArgumentException("Ngày kết thúc không hợp lệ.");
                    if(!w.query("SELECT a.appointment_id FROM Appointment a JOIN AppointmentStaff ast ON ast.appointment_id=a.appointment_id WHERE ast.staff_id=? AND a.appointment_date BETWEEN ? AND ? AND a.status IN ('Pending','Confirmed','Checked-in','In-progress')",staff,start,end).isEmpty())throw new WorkflowException(409,"Nhân viên còn lịch hẹn trong khoảng nghỉ.");
                    if(!w.query("SELECT leave_id FROM StaffLeave WHERE staff_id=? AND start_date<=? AND end_date>=?",staff,end,start).isEmpty())throw new WorkflowException(409,"Khoảng nghỉ bị trùng.");
                    w.update("INSERT StaffLeave(staff_id,start_date,end_date,reason) VALUES(?,?,?,?)",staff,start,end,text(d,"reason"));
                } else if(action.equals("deleteLeave"))w.update("DELETE FROM StaffLeave WHERE leave_id=?",integer(d,"id"));
                else if(action.equals("skill")||action.equals("deleteSkill")) {
                    int staff=integer(d,"staffId"),service=integer(d,"serviceId");
                    if(action.equals("skill")) {
                        if(w.query("SELECT staff_id FROM Staff WHERE staff_id=? AND role='Technician' AND status='Active'",staff).isEmpty())throw new IllegalArgumentException("Chỉ gán kỹ năng cho kỹ thuật viên hoạt động.");
                        if(w.query("SELECT staff_id FROM StaffService WHERE staff_id=? AND service_id=?",staff,service).isEmpty())w.update("INSERT StaffService(staff_id,service_id) VALUES(?,?)",staff,service);
                    } else {
                        if(!w.query("SELECT a.appointment_id FROM Appointment a JOIN AppointmentStaff ast ON ast.appointment_id=a.appointment_id WHERE ast.staff_id=? AND a.service_id=? AND a.status IN ('Pending','Confirmed','Checked-in','In-progress')",staff,service).isEmpty())throw new WorkflowException(409,"Kỹ năng đang dùng trong lịch hẹn.");
                        w.update("DELETE FROM StaffService WHERE staff_id=? AND service_id=?",staff,service);
                    }
                } else throw new IllegalArgumentException("Thao tác không hợp lệ.");
            } else if(kind.equals("catalog-rules")) {
                int service=integer(d,"serviceId");
                if(!w.query("SELECT appointment_id FROM Appointment WHERE service_id=? AND status IN ('Pending','Confirmed','Checked-in','In-progress')",service).isEmpty())throw new WorkflowException(409,"Dịch vụ đang có lịch hẹn. Hoàn thành/điều phối trước khi đổi định mức.");
                if(action.equals("material")||action.equals("deleteMaterial")) {
                    int product=integer(d,"productId");
                    w.update("DELETE FROM ServiceMaterial WHERE service_id=? AND product_id=?",service,product);
                    if(action.equals("material")) {
                        BigDecimal qty=d.get("quantity").getAsBigDecimal();
                        if(qty.signum()<=0||qty.scale()>3 || w.query("SELECT product_id FROM Product WHERE product_id=? AND product_type='Consumable' AND status='Active'",product).isEmpty())throw new IllegalArgumentException("Vật tư hoặc định mức không hợp lệ.");
                        w.update("INSERT ServiceMaterial(service_id,product_id,quantity) VALUES(?,?,?)",service,product,qty);
                    }
                } else if(action.equals("equipment")||action.equals("deleteEquipment")) {
                    int equipment=integer(d,"equipmentId");w.update("DELETE FROM ServiceEquipment WHERE service_id=? AND equipment_id=?",service,equipment);
                    if(action.equals("equipment"))w.update("INSERT ServiceEquipment(service_id,equipment_id) VALUES(?,?)",service,equipment);
                } else throw new IllegalArgumentException("Thao tác không hợp lệ.");
            } else if(kind.equals("policy")) {
                if(action.equals("save")) {
                    int threshold=integer(d,"vipCompletedThreshold");BigDecimal vip=d.get("vipDiscountPercent").getAsBigDecimal(),commission=d.get("commissionPercent").getAsBigDecimal();
                    if(vip.signum()<0||vip.compareTo(new BigDecimal(100))>0||commission.signum()<0||commission.compareTo(new BigDecimal(100))>0)throw new IllegalArgumentException("Tỷ lệ phải từ 0 đến 100.");
                    // Preserve SQLQuery1 history, or update the original singleton schema.
                    Map<String,Object> previous=w.one("SELECT * FROM vw_CurrentPolicy");
                    if(w.query("SELECT name FROM sys.check_constraints WHERE name='CK_Policy_OneRow'").isEmpty()) {
                        int next=Workflow.id(w.one("SELECT COALESCE(MAX(policy_id),0)+1 AS next_id FROM BusinessPolicy").get("nextId"));
                        w.update("INSERT BusinessPolicy(policy_id,policy_confirmed,vip_completed_threshold,vip_discount_percent,commission_percent,updated_by_staff_id) VALUES(?,1,?,?,?,?)",next,threshold,vip,commission,bssms_common.LoginIdentity.staffId(requireActorAccountId()));
                    } else w.update("UPDATE BusinessPolicy SET policy_confirmed=1,vip_completed_threshold=?,vip_discount_percent=?,commission_percent=? WHERE policy_id=1",threshold,vip,commission);
                    w.update("INSERT AuditLog(actor_staff_id,action_name,entity_name,entity_id,reason) VALUES(?,'PolicyUpdate','BusinessPolicy','current',?)",bssms_common.LoginIdentity.staffId(requireActorAccountId()),new Gson().toJson(previous));
                } else if(action.equals("issueBenefits"))w.call("usp_IssueMonthlyBenefits");
                else if(action.equals("retryNotification")) {
                    int id=integer(d,"id");
                    if(!d.has("confirmedProviderCheck")||!d.get("confirmedProviderCheck").getAsBoolean())throw new IllegalArgumentException("Kiểm tra nhà cung cấp trước khi gửi lại.");
                    w.update("UPDATE NotificationOutbox SET status='Pending',last_error=NULL WHERE notification_id=? AND status IN ('Failed','Sending')",id);
                    w.update("INSERT AuditLog(actor_staff_id,action_name,entity_name,entity_id,reason) VALUES(?,'RetryNotification','NotificationOutbox',?,N'Manager confirmed provider reconciliation')",bssms_common.LoginIdentity.staffId(requireActorAccountId()),id);
                }
                else if(action.equals("closeMonth"))w.call("usp_CloseCommissionPeriod",requireActorAccountId(),LocalDate.parse(text(d,"month")));
                else throw new IllegalArgumentException("Thao tác không hợp lệ.");
            } else throw new WorkflowException(404,"Không tìm thấy chức năng.");
            return Map.of("message","Đã cập nhật thành công.");
        });
    }
}
