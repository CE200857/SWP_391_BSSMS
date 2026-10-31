package bssms_integration;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.*;
/** VNPay PAY 2.1.0: sorted URL-encoded fields, HMAC-SHA512. */
public final class VnPay {
    private VnPay() {}
    public static String required(String key) {
        String value=System.getenv(key);
        if(value==null||value.isBlank())throw new bssms_persistence.common.WorkflowException(503,"Thanh toán VNPay chưa được cấu hình.");return value;
    }
    public static String canonical(Map<String,String> values) {
        List<String> pairs=new ArrayList<>();
        new TreeMap<>(values).forEach((k,v)->{if(k.startsWith("vnp_")&&!k.equals("vnp_SecureHash")&&!k.equals("vnp_SecureHashType")&&v!=null&&!v.isEmpty())pairs.add(URLEncoder.encode(k,StandardCharsets.UTF_8)+"="+URLEncoder.encode(v,StandardCharsets.UTF_8));});
        return String.join("&",pairs);
    }
    public static String sign(Map<String,String> values,String secret) {
        return hmac(canonical(values),secret);
    }
    public static String hmac(String text,String secret) {
        try {Mac mac=Mac.getInstance("HmacSHA512");mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8),"HmacSHA512"));StringBuilder out=new StringBuilder();for(byte b:mac.doFinal(text.getBytes(StandardCharsets.UTF_8)))out.append(String.format("%02x",b&255));return out.toString();}
        catch(Exception e){throw new IllegalStateException("Cannot sign payment",e);}
    }
    public static boolean verify(Map<String,String> values,String secret) {
        String supplied=values.get("vnp_SecureHash");
        return supplied!=null&&supplied.matches("(?i)[0-9a-f]{128}")&&MessageDigest.isEqual(sign(values,secret).getBytes(StandardCharsets.US_ASCII),supplied.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.US_ASCII));
    }
}
