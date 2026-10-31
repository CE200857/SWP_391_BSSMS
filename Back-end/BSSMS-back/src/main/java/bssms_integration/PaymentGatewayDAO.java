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
 public Object create(int invoiceId,String ip)throws SQLException {
    String merchant=VnPay.required("VNPAY_TMN_CODE"),secret=VnPay.required("VNPAY_HASH_SECRET"),returnUrl=VnPay.required("VNPAY_RETURN_URL");
    Workflow w=workflow();w.roles("Customer","Receptionist");
    return w.transaction(()->{
        Map<String,Object> account=w.one("SELECT role,customer_id FROM vw_AccountIdentity WHERE account_id=? AND status='Active'",requireActorAccountId());
        Map<String,Object> invoice=w.one("SELECT i.*,v.outstanding_amount FROM Invoice i JOIN vw_InvoiceBalance v ON v.invoice_id=i.invoice_id WHERE i.invoice_id=?",invoiceId);
        if("Customer".equals(account.get("role"))&&!Objects.equals(account.get("customerId"),invoice.get("customerId")))throw new WorkflowException(404,"Không tìm thấy hóa đơn.");
        BigDecimal amount=(BigDecimal)invoice.get("outstandingAmount");
        if(!"Unpaid".equals(invoice.get("status"))||amount.signum()<=0)throw new WorkflowException(409,"Hóa đơn không còn chờ thanh toán.");
        if(!w.query("SELECT r.refund_id FROM Refund r JOIN Payment p ON p.payment_id=r.payment_id WHERE p.invoice_id=? AND r.status IN ('Pending','Success')",invoiceId).isEmpty())throw new WorkflowException(409,"Hóa đơn đang hoàn tiền.");
        ZonedDateTime now=ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        w.update("UPDATE PaymentAttempt SET status='Expired' WHERE invoice_id=? AND status='Pending' AND created_at<DATEADD(minute,-15,?)",invoiceId,now.toLocalDateTime());
        List<Map<String,Object>> existing=w.query("SELECT merchant_reference,created_at FROM PaymentAttempt WHERE invoice_id=? AND status='Pending' ORDER BY attempt_id DESC",invoiceId);
        String ref;
        if(existing.isEmpty()){ref=UUID.randomUUID().toString().replace("-","");w.update("INSERT PaymentAttempt(invoice_id,merchant_reference,amount,created_at) VALUES(?,?,?,?)",invoiceId,ref,amount,now.toLocalDateTime());}
        else {ref=existing.get(0).get("merchantReference").toString();now=LocalDateTime.parse(existing.get(0).get("createdAt").toString().replace(' ','T')).atZone(ZoneId.of("Asia/Ho_Chi_Minh"));}
        Map<String,String> p=new TreeMap<>();
        p.put("vnp_Version","2.1.0");p.put("vnp_Command","pay");p.put("vnp_TmnCode",merchant);p.put("vnp_Amount",amount.multiply(new BigDecimal(100)).toBigIntegerExact().toString());p.put("vnp_CurrCode","VND");p.put("vnp_TxnRef",ref);p.put("vnp_OrderInfo","Thanh toan hoa don "+invoiceId);p.put("vnp_OrderType","other");p.put("vnp_Locale","vn");p.put("vnp_ReturnUrl",returnUrl);p.put("vnp_IpAddr",ip);p.put("vnp_CreateDate",now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));p.put("vnp_ExpireDate",now.plusMinutes(15).format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        String base=System.getenv().getOrDefault("VNPAY_PAYMENT_URL","https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        return Map.of("paymentUrl",base+"?"+VnPay.canonical(p)+"&vnp_SecureHash="+VnPay.sign(p,secret));
    });
 }
 public Object ipn(Map<String,String> p)throws SQLException {
    if(!VnPay.verify(p,VnPay.required("VNPAY_HASH_SECRET"))||!VnPay.required("VNPAY_TMN_CODE").equals(p.get("vnp_TmnCode")))return Map.of("RspCode","97","Message","Invalid signature");
    Workflow w=new Workflow(conn,0);
    return w.transaction(()->{
        List<Map<String,Object>> attempts=w.query("SELECT * FROM PaymentAttempt WHERE merchant_reference=?",p.get("vnp_TxnRef"));
        if(attempts.isEmpty())return Map.of("RspCode","01","Message","Order not found");
        Map<String,Object> attempt=attempts.get(0);BigDecimal amount=(BigDecimal)attempt.get("amount");
        BigDecimal callback;
        try {callback=new BigDecimal(p.get("vnp_Amount"));if(callback.compareTo(amount.multiply(new BigDecimal(100)))!=0)return Map.of("RspCode","04","Message","Invalid amount");}
        catch(Exception e){return Map.of("RspCode","04","Message","Invalid amount");}
        if("Success".equals(attempt.get("status"))||"Failed".equals(attempt.get("status")))return Map.of("RspCode","02","Message","Order already confirmed");
        if(!"00".equals(p.get("vnp_ResponseCode"))||!"00".equals(p.get("vnp_TransactionStatus"))){w.update("UPDATE PaymentAttempt SET status='Failed',verified_at=GETDATE() WHERE attempt_id=?",attempt.get("attemptId"));return Map.of("RspCode","00","Message","Confirm Success");}
        String transaction=p.get("vnp_TransactionNo");
        if(transaction==null||!transaction.matches("[0-9]{1,15}")||"0".equals(transaction))return Map.of("RspCode","99","Message","Invalid transaction");
        int id=Workflow.id(attempt.get("invoiceId"));
        if(!w.query("SELECT r.refund_id FROM Refund r JOIN Payment p ON p.payment_id=r.payment_id WHERE p.invoice_id=? AND r.status IN ('Pending','Success')",id).isEmpty())return Map.of("RspCode","99","Message","Refund in progress; reconciliation required");
        Map<String,Object> invoice=w.one("SELECT i.status,v.outstanding_amount FROM Invoice i JOIN vw_InvoiceBalance v ON v.invoice_id=i.invoice_id WHERE i.invoice_id=?",id);
        if(!"Unpaid".equals(invoice.get("status"))||amount.compareTo((BigDecimal)invoice.get("outstandingAmount"))!=0)return Map.of("RspCode","04","Message","Invoice balance changed; reconciliation required");
        if(!w.query("SELECT payment_id FROM Payment WHERE payment_method='VNPay' AND transaction_code=?",transaction).isEmpty())return Map.of("RspCode","99","Message","Transaction already used");
        w.update("INSERT Payment(invoice_id,payment_method,amount,transaction_code,request_key,status,verified_at,payment_date) VALUES(?,'VNPay',?,?,?,'Success',CONVERT(datetime2,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time'),CONVERT(datetime2,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time'))",id,amount,transaction,"vnp-"+p.get("vnp_TxnRef"));
        w.update("UPDATE PaymentAttempt SET status='Success',provider_transaction=?,verified_at=GETDATE() WHERE attempt_id=?",transaction,attempt.get("attemptId"));
        w.update("UPDATE Invoice SET status='Paid',paid_at=CONVERT(datetime2,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time') WHERE invoice_id=?",id);
        w.call("usp_AccrueInvoiceCommission",id);
        w.update("INSERT NotificationOutbox(customer_id,notification_type,template_code,payload,deduplication_key,scheduled_at) SELECT customer_id,'Invoice','INVOICE_PAID',CONCAT('{\"invoiceId\":',invoice_id,'}'),CONCAT('invoice-',invoice_id),CONVERT(datetime2,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time') FROM Invoice WHERE invoice_id=? AND NOT EXISTS(SELECT 1 FROM NotificationOutbox WHERE deduplication_key=CONCAT('invoice-',?))",id,id);
        return Map.of("RspCode","00","Message","Confirm Success");
    });
 }
}
