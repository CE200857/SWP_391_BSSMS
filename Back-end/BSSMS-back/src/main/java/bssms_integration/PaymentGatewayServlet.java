package bssms_integration;
import bssms_api.common.BaseApiServlet;
import bssms_common.AppConfig;
import bssms_persistence.common.WorkflowException;
import com.google.gson.*;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.*;
@WebServlet(urlPatterns={"/api/payments/vnpay/create","/api/payments/vnpay/ipn","/api/payments/vnpay/return"})
public class PaymentGatewayServlet extends BaseApiServlet {
 /** VNPay chỉ nhận địa chỉ IPv4: IPv6 (ví dụ ::1 khi chạy localhost) đổi thành 127.0.0.1. */
 static String clientIp(HttpServletRequest req) {
    String ip=req.getHeader("X-Forwarded-For");
    if(ip!=null&&!ip.isBlank())ip=ip.split(",")[0].trim();else ip=req.getRemoteAddr();
    return ip!=null&&ip.matches("(\\d{1,3}\\.){3}\\d{1,3}")?ip:"127.0.0.1";
 }
 private static String defaultReturnUrl(HttpServletRequest req) {
    String origin=req.getScheme()+"://"+req.getServerName()+((req.getScheme().equals("http")&&req.getServerPort()==80)||(req.getScheme().equals("https")&&req.getServerPort()==443)?"":":"+req.getServerPort());
    return origin+req.getContextPath()+"/api/payments/vnpay/return";
 }
 private static Map<String,String> params(HttpServletRequest req) {
    Map<String,String> p=new TreeMap<>();
    for(Map.Entry<String,String[]> e:req.getParameterMap().entrySet()){
        if(e.getValue().length!=1)throw new IllegalArgumentException("Duplicate parameter");p.put(e.getKey(),e.getValue()[0]);
    }
    return p;
 }
 protected void doPost(HttpServletRequest req,HttpServletResponse res)throws IOException {
    handle(req,res,200,()->{
        if(!req.getServletPath().endsWith("/create"))return unsupported();
        if(user(req)==null)throw new WorkflowException(401,"Vui lòng đăng nhập.");
        int id=body(req,JsonObject.class).get("invoiceId").getAsBigDecimal().intValueExact();
        try(PaymentGatewayDAO dao=new PaymentGatewayDAO()){dao.setActorAccountId(user(req).getAccountId());return dao.create(id,clientIp(req),defaultReturnUrl(req));}
    });
 }
 protected void doGet(HttpServletRequest req,HttpServletResponse res)throws IOException {
    if(req.getServletPath().endsWith("/return")) {
        // Khách quay về từ VNPay: kiểm tra chữ ký, xác nhận giao dịch (an toàn vì chữ ký do VNPay ký và mỗi giao dịch chỉ ghi một lần),
        // rồi chuyển về trang hóa đơn kèm kết quả.
        String outcome="error",invoice="";
        try {
            Map<String,String> p=params(req);
            if(!VnPay.verify(p,VnPay.required("VNPAY_HASH_SECRET")))outcome="invalid";
            else try(PaymentGatewayDAO dao=new PaymentGatewayDAO()){
                Map<String,String> result=dao.handleReturn(p,AppConfig.flag("VNPAY_CONFIRM_ON_RETURN",true));
                outcome=result.get("outcome");invoice=result.getOrDefault("invoiceId","");
            }
        } catch(Exception e){log("VNPay return not applied",e);}
        res.sendRedirect(AppConfig.get("BSSMS_FRONTEND_URL","http://localhost:5173")+"/invoices?payment="+outcome+(invoice.isEmpty()?"":"&invoice="+invoice));return;
    }
    if(!req.getServletPath().endsWith("/ipn")){res.sendError(405);return;}
    res.setContentType("application/json");res.setCharacterEncoding("UTF-8");
    try {
        Map<String,String> p=params(req);
        // Authenticate the callback before opening the database.
        if(!VnPay.verify(p,VnPay.required("VNPAY_HASH_SECRET"))){res.getWriter().write("{\"RspCode\":\"97\",\"Message\":\"Invalid signature\"}");return;}
        try(PaymentGatewayDAO dao=new PaymentGatewayDAO()){res.getWriter().write(new Gson().toJson(dao.ipn(p)));}
    }catch(Exception e){log("VNPay IPN not applied",e);res.getWriter().write("{\"RspCode\":\"99\",\"Message\":\"Unable to confirm\"}");}
 }
}
