package bssms_integration;
import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import java.sql.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.math.BigDecimal;
import java.util.*;

public class PaymentGatewayDAO extends DBContext implements AutoCloseable {
 public void close()throws SQLException{if(conn!=null)conn.close();}
 private static final ZoneId ZONE=ZoneId.of("Asia/Ho_Chi_Minh");
 public Object create(int invoiceId,String ip,String defaultReturnUrl)throws SQLException {
    String merchant=VnPay.required("VNPAY_TMN_CODE"),secret=VnPay.required("VNPAY_HASH_SECRET"),returnUrl=bssms_common.AppConfig.get("VNPAY_RETURN_URL",defaultReturnUrl);
    Workflow w=workflow();
    String role=w.role();
    if(!"Customer".equals(role)&&!"Receptionist".equals(role))throw new WorkflowException(403,"Role not permitted.");
    return w.transaction(()->{
        Map<String,Object> invoice=w.one("SELECT * FROM Invoice WHERE invoice_id=?",invoiceId);
        if("Customer".equals(role)&&w.customerId()!=Workflow.id(invoice.get("customerId")))throw new WorkflowException(404,"Không tìm thấy hóa đơn.");
        BigDecimal amount=new BigDecimal(String.valueOf(invoice.get("totalAmount")));
        if(!"Unpaid".equals(invoice.get("status"))||amount.signum()<=0)throw new WorkflowException(409,"Hóa đơn không còn chờ thanh toán.");
        if("Customer".equals(role))new BillingWorkflow(w).requireOnlinePayable(invoiceId);else new BillingWorkflow(w).requireCollectible(invoiceId);
        LocalDateTime now=LocalDateTime.now(ZONE);
        w.update("UPDATE PaymentAttempt SET status='Expired',verified_at=? WHERE invoice_id=? AND status='Pending' AND expires_at<=?",now,invoiceId,now);
        List<Map<String,Object>> existing=w.query("SELECT merchant_reference,created_at,amount FROM PaymentAttempt WHERE invoice_id=? AND status='Pending' ORDER BY attempt_id DESC",invoiceId);
        String ref;
        LocalDateTime created=now;
        if(existing.isEmpty()||new BigDecimal(String.valueOf(existing.get(0).get("amount"))).compareTo(amount)!=0){
            if(!existing.isEmpty())w.update("UPDATE PaymentAttempt SET status='Expired',verified_at=? WHERE invoice_id=? AND status='Pending'",now,invoiceId);
            ref=UUID.randomUUID().toString().replace("-","");
            w.update("INSERT PaymentAttempt(invoice_id,merchant_reference,amount,status,created_at,expires_at) VALUES(?,?,?,'Pending',?,?)",invoiceId,ref,amount,now,now.plusMinutes(15));
        } else {ref=existing.get(0).get("merchantReference").toString();created=LocalDateTime.parse(existing.get(0).get("createdAt").toString().replace(' ','T'));}
        ZonedDateTime at=created.atZone(ZONE);
        Map<String,String> p=new TreeMap<>();
        p.put("vnp_Version","2.1.0");p.put("vnp_Command","pay");p.put("vnp_TmnCode",merchant);p.put("vnp_Amount",amount.multiply(new BigDecimal(100)).toBigIntegerExact().toString());p.put("vnp_CurrCode","VND");p.put("vnp_TxnRef",ref);p.put("vnp_OrderInfo","Thanh toan hoa don "+invoiceId);p.put("vnp_OrderType","other");p.put("vnp_Locale","vn");p.put("vnp_ReturnUrl",returnUrl);p.put("vnp_IpAddr",ip);p.put("vnp_CreateDate",at.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));p.put("vnp_ExpireDate",at.plusMinutes(15).format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        String base=bssms_common.AppConfig.get("VNPAY_PAYMENT_URL","https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        return Map.of("paymentUrl",base+"?"+VnPay.canonical(p)+"&vnp_SecureHash="+VnPay.sign(p,secret),"invoiceId",invoiceId);
    });
 }

 public Map<String,String> handleReturn(Map<String,String> p,boolean confirm)throws SQLException {
    Workflow w=new Workflow(conn,0);
    Map<String,String> out=new HashMap<>();
    List<Map<String,Object>> attempts=w.query("SELECT a.invoice_id,i.invoice_type,i.appointment_id FROM PaymentAttempt a JOIN Invoice i ON i.invoice_id=a.invoice_id WHERE a.merchant_reference=?",p.get("vnp_TxnRef"));
    if(attempts.isEmpty()){out.put("outcome","invalid");return out;}
    out.put("invoiceId",String.valueOf(attempts.get(0).get("invoiceId")));
    out.put("type",String.valueOf(attempts.get(0).get("invoiceType")));
    if(attempts.get(0).get("appointmentId")!=null)out.put("appointmentId",String.valueOf(attempts.get(0).get("appointmentId")));
    if(confirm)ipn(p);
    String status=String.valueOf(w.one("SELECT status FROM PaymentAttempt WHERE merchant_reference=?",p.get("vnp_TxnRef")).get("status"));
    out.put("outcome","Success".equals(status)?"success":"Failed".equals(status)?"failed":"pending");
    return out;
 }
 public Object ipn(Map<String,String> p)throws SQLException {
    if(!VnPay.verify(p,VnPay.required("VNPAY_HASH_SECRET"))||!VnPay.required("VNPAY_TMN_CODE").equals(p.get("vnp_TmnCode")))return Map.of("RspCode","97","Message","Invalid signature");
    Workflow w=new Workflow(conn,0);
    return w.transaction(()->{
        List<Map<String,Object>> attempts=w.query("SELECT * FROM PaymentAttempt WHERE merchant_reference=?",p.get("vnp_TxnRef"));
        if(attempts.isEmpty())return Map.of("RspCode","01","Message","Order not found");
        Map<String,Object> attempt=attempts.get(0);BigDecimal amount=new BigDecimal(String.valueOf(attempt.get("amount")));
        try {if(new BigDecimal(p.get("vnp_Amount")).compareTo(amount.multiply(new BigDecimal(100)))!=0)return Map.of("RspCode","04","Message","Invalid amount");}
        catch(Exception e){return Map.of("RspCode","04","Message","Invalid amount");}
        if(!"Pending".equals(attempt.get("status")))return Map.of("RspCode","02","Message","Order already confirmed");
        int id=Workflow.id(attempt.get("invoiceId"));
        if(!"00".equals(p.get("vnp_ResponseCode"))||!"00".equals(p.get("vnp_TransactionStatus"))){
            w.update("UPDATE PaymentAttempt SET status='Failed',verified_at=SYSDATETIME() WHERE attempt_id=?",attempt.get("attemptId"));
            if(!"24".equals(p.get("vnp_ResponseCode")))failed(w,id);
            return Map.of("RspCode","00","Message","Confirm Success");
        }
        String transaction=p.get("vnp_TransactionNo");
        if(transaction==null||!transaction.matches("[0-9]{1,15}")||"0".equals(transaction))return Map.of("RspCode","99","Message","Invalid transaction");
        Map<String,Object> invoice=w.one("SELECT status,total_amount FROM Invoice WHERE invoice_id=?",id);
        if(!"Unpaid".equals(invoice.get("status"))||amount.compareTo(new BigDecimal(String.valueOf(invoice.get("totalAmount"))))!=0)return Map.of("RspCode","04","Message","Invoice balance changed; reconciliation required");
        if(!w.query("SELECT payment_id FROM Payment WHERE payment_method='VNPay' AND transaction_code=?",transaction).isEmpty())return Map.of("RspCode","99","Message","Transaction already used");
        w.update("UPDATE PaymentAttempt SET status='Success',provider_transaction=?,verified_at=SYSDATETIME() WHERE attempt_id=?",transaction,attempt.get("attemptId"));
        new BillingWorkflow(w).pay(id,"VNPay",transaction,null);
        return Map.of("RspCode","00","Message","Confirm Success");
    });
 }

 static void failed(Workflow w,int invoice)throws SQLException {
    Map<String,Object> i=w.one("SELECT invoice_type,appointment_id,status FROM Invoice WHERE invoice_id=?",invoice);
    if(!"Unpaid".equals(i.get("status")))return;
    if("Package".equals(i.get("invoiceType")))new BillingWorkflow(w).cancel(invoice,"Thanh toán VNPay không thành công",null);
    else if(i.get("appointmentId")!=null)w.update("UPDATE Appointment SET payment_choice='Counter' WHERE appointment_id=? AND payment_choice='Online'",i.get("appointmentId"));
 }

 public static int expireAttempts(Workflow w)throws SQLException {
    int count=0;
    for(Map<String,Object> a:w.query("SELECT attempt_id,invoice_id FROM PaymentAttempt WHERE status='Pending' AND expires_at<=SYSDATETIME()")){
        w.update("UPDATE PaymentAttempt SET status='Expired',verified_at=SYSDATETIME() WHERE attempt_id=? AND status='Pending'",a.get("attemptId"));
        if(w.query("SELECT attempt_id FROM PaymentAttempt WHERE invoice_id=? AND status='Pending'",a.get("invoiceId")).isEmpty())failed(w,Workflow.id(a.get("invoiceId")));
        count++;
    }
    return count;
 }
}
