package bssms_integration;
import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import com.google.gson.*;
import java.sql.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.net.URI;
import java.net.http.*;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Send once, then query: a timeout must never trigger another refund request. */
public class VnPayRefundDAO extends DBContext implements AutoCloseable {
 public void close()throws SQLException {if(conn!=null)conn.close();}
 private static String joined(Map<String,String> p,String fields){List<String> parts=new ArrayList<>();for(String f:fields.split(","))parts.add(p.getOrDefault("vnp_"+f,""));return String.join("|",parts);}
 public Map<String,Object> process(int refundId)throws SQLException {
  Workflow w=workflow();w.roles("Manager");
  String secret=VnPay.required("VNPAY_HASH_SECRET"),merchant=VnPay.required("VNPAY_TMN_CODE"),ip=VnPay.required("VNPAY_SERVER_IP");
  Map<String,Object> row=w.transaction(()->{
   Map<String,Object> r=w.one("SELECT r.*,p.transaction_code,pa.merchant_reference,pa.created_at AS transaction_date FROM Refund r JOIN Payment p ON p.payment_id=r.payment_id JOIN PaymentAttempt pa ON pa.provider_transaction=p.transaction_code AND pa.status='Success' WHERE r.refund_id=? AND p.payment_method='VNPay'",refundId);
   if(!"Pending".equals(r.get("status")))return r;
   if(r.get("providerRequestId")==null){String id=UUID.randomUUID().toString().replace("-","");w.update("UPDATE Refund SET provider_request_id=? WHERE refund_id=?",id,refundId);r.put("providerRequestId",id);r.put("send",true);}
   return r;
  });
  if("Success".equals(row.get("status")))return Map.of("status","Success","message","Giao dịch đã hoàn tiền.");
  if(!"Pending".equals(row.get("status")))throw new WorkflowException(409,"Giao dịch không chờ hoàn tiền.");
  boolean send=Boolean.TRUE.equals(row.get("send"));
  Map<String,String> p=new LinkedHashMap<>();
  DateTimeFormatter fmt=DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
  String now=ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")).format(fmt);
  p.put("vnp_RequestId",send?row.get("providerRequestId").toString():UUID.randomUUID().toString().replace("-",""));p.put("vnp_Version","2.1.0");p.put("vnp_Command",send?"refund":"querydr");p.put("vnp_TmnCode",merchant);p.put("vnp_TxnRef",row.get("merchantReference").toString());p.put("vnp_OrderInfo","Hoan hoa don - refund "+refundId);
  p.put("vnp_TransactionDate",LocalDateTime.parse(row.get("transactionDate").toString().replace(' ','T')).format(fmt));p.put("vnp_CreateDate",now);p.put("vnp_IpAddr",ip);
  if(send){p.put("vnp_TransactionType","02");p.put("vnp_Amount",((BigDecimal)row.get("amount")).multiply(new BigDecimal(100)).toBigIntegerExact().toString());p.put("vnp_TransactionNo",row.get("transactionCode").toString());p.put("vnp_CreateBy","staff"+requireActorAccountId()/2);}
  String fields=send?"RequestId,Version,Command,TmnCode,TransactionType,TxnRef,Amount,TransactionNo,TransactionDate,CreateBy,CreateDate,IpAddr,OrderInfo":"RequestId,Version,Command,TmnCode,TxnRef,TransactionDate,CreateDate,IpAddr,OrderInfo";
  p.put("vnp_SecureHash",VnPay.hmac(joined(p,fields),secret));
  try {
   HttpRequest req=HttpRequest.newBuilder(URI.create(System.getenv().getOrDefault("VNPAY_API_URL","https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"))).timeout(Duration.ofSeconds(20)).header("Content-Type","application/json").POST(HttpRequest.BodyPublishers.ofString(new Gson().toJson(p))).build();
   HttpResponse<String> response=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build().send(req,HttpResponse.BodyHandlers.ofString());
   if(response.statusCode()!=200)throw new IllegalStateException("HTTP "+response.statusCode());
   JsonObject json=JsonParser.parseString(response.body()).getAsJsonObject();Map<String,String> result=new HashMap<>();json.entrySet().forEach(e->{if(!e.getValue().isJsonNull())result.put(e.getKey(),e.getValue().getAsString());});
   String responseFields="ResponseId,Command,ResponseCode,Message,TmnCode,TxnRef,Amount,BankCode,PayDate,TransactionNo,TransactionType,TransactionStatus,OrderInfo"+(send?"":",PromotionCode,PromotionAmount");
   String hash=result.getOrDefault("vnp_SecureHash","").toLowerCase(Locale.ROOT);
   if(!hash.matches("[a-f0-9]{128}")||!MessageDigest.isEqual(hash.getBytes(StandardCharsets.US_ASCII),VnPay.hmac(joined(result,responseFields),secret).getBytes(StandardCharsets.US_ASCII))||!merchant.equals(result.get("vnp_TmnCode"))||!p.get("vnp_Command").equals(result.get("vnp_Command"))||!p.get("vnp_TxnRef").equals(result.get("vnp_TxnRef")))throw new IllegalStateException("Phản hồi không xác thực");
   boolean success="00".equals(result.get("vnp_ResponseCode"))&&"00".equals(result.get("vnp_TransactionStatus"))&&"02".equals(result.get("vnp_TransactionType"))&&new BigDecimal(result.getOrDefault("vnp_Amount","-1")).compareTo(((BigDecimal)row.get("amount")).multiply(new BigDecimal(100)))==0;
   String note="code="+result.get("vnp_ResponseCode")+", status="+result.get("vnp_TransactionStatus")+", type="+result.get("vnp_TransactionType");
   return w.transaction(()->{
    w.update("UPDATE Refund SET provider_response=? WHERE refund_id=?",note,refundId);
    if(success){w.update("UPDATE Refund SET provider_verified=1 WHERE refund_id=?",refundId);w.call("usp_CompleteRefund",requireActorAccountId(),refundId);}
    return Map.of("status",success?"Success":"Pending","message",success?"VNPay xác nhận hoàn tiền thành công.":"Chưa xác nhận hoàn tiền: "+note+". Đối soát lại sau; không gửi yêu cầu hoàn lần hai.");
   });
  } catch(SQLException e){throw e;}
  catch(Exception e){if(e instanceof InterruptedException)Thread.currentThread().interrupt();w.update("UPDATE Refund SET provider_response=? WHERE refund_id=?","Chưa xác định kết quả; cần đối soát: "+e.getClass().getSimpleName(),refundId);throw new WorkflowException(502,"Chưa xác định kết quả từ VNPay. Dùng lại chức năng để đối soát; hệ thống không gửi lặp yêu cầu hoàn.");}
 }
}
