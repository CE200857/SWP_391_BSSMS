package bssms_integration;
import java.util.*;
/** Independent HMAC-SHA512 fixture generated with Python hmac, not this implementation. */
public final class VnPayTest {
 static void check(boolean condition,String message){if(!condition)throw new AssertionError(message);}
 public static void main(String[] args){
  Map<String,String> p=new HashMap<>();p.put("vnp_TxnRef","REF42");p.put("vnp_TmnCode","TEST");p.put("vnp_Amount","10000000");p.put("vnp_OrderInfo","Thanh toan hoa don 42");p.put("ignored","not part of VNPay payload");
  String expected="53c6a8b0ed4e64d414012238170e1c62293ef59d2188acc16d194584e4d5cd26ddc1c8b4356ae5ee29b46f91d04134eabf618dd53d93ad126a6f3df52dd099a5";
  check(VnPay.sign(p,"test-secret").equals(expected),"known HMAC vector / order / spaces");
  check(!VnPay.verify(p,"test-secret"),"missing signature rejected");
  p.put("vnp_SecureHash",expected.toUpperCase(Locale.ROOT));check(VnPay.verify(p,"test-secret"),"valid uppercase signature accepted");
  p.put("vnp_Amount","1");check(!VnPay.verify(p,"test-secret"),"tampered amount rejected");
  p.put("vnp_Amount","10000000");check(!VnPay.verify(p,"wrong-key"),"wrong key rejected");
  p.put("vnp_SecureHash",expected.substring(1));check(!VnPay.verify(p,"test-secret"),"truncated signature rejected");
  check(VnPay.hmac("Hi There","\u000b".repeat(20)).equals("87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cde"+"daa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854"),"RFC 4231 vector");
  System.out.println("PASS: VNPay canonical order, HMAC vectors, missing/truncated signature, amount tampering and wrong key.");
 }
}
