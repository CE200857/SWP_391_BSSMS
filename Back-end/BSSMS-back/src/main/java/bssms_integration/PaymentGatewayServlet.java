package bssms_integration;
import bssms_api.common.BaseApiServlet;
import bssms_persistence.common.WorkflowException;
import com.google.gson.*;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.*;
@WebServlet(urlPatterns={"/api/payments/vnpay/create","/api/payments/vnpay/ipn","/api/payments/vnpay/return"})
public class PaymentGatewayServlet extends BaseApiServlet {
 protected void doPost(HttpServletRequest req,HttpServletResponse res)throws IOException {
    handle(req,res,200,()->{
        if(!req.getServletPath().endsWith("/create"))return unsupported();
        if(user(req)==null)throw new WorkflowException(401,"Vui lòng đăng nhập.");
        int id=body(req,JsonObject.class).get("invoiceId").getAsBigDecimal().intValueExact();
        try(PaymentGatewayDAO dao=new PaymentGatewayDAO()){dao.setActorAccountId(user(req).getAccountId());return dao.create(id,req.getRemoteAddr());}
    });
 }
 protected void doGet(HttpServletRequest req,HttpServletResponse res)throws IOException {
    if(req.getServletPath().endsWith("/return")) {
        // Browser return never changes payment state. Only a verified IPN can mark Paid.
        res.sendRedirect(System.getenv().getOrDefault("BSSMS_FRONTEND_URL","http://localhost:5173")+"/invoices?payment=returned");return;
    }
    if(!req.getServletPath().endsWith("/ipn")){res.sendError(405);return;}
    res.setContentType("application/json");res.setCharacterEncoding("UTF-8");
    try {
        Map<String,String> p=new TreeMap<>();
        for(Map.Entry<String,String[]> e:req.getParameterMap().entrySet()){
            if(e.getValue().length!=1)throw new IllegalArgumentException("Duplicate parameter");p.put(e.getKey(),e.getValue()[0]);
        }
        // Authenticate the callback before opening the database.
        if(!VnPay.verify(p,VnPay.required("VNPAY_HASH_SECRET"))){res.getWriter().write("{\"RspCode\":\"97\",\"Message\":\"Invalid signature\"}");return;}
        try(PaymentGatewayDAO dao=new PaymentGatewayDAO()){res.getWriter().write(new Gson().toJson(dao.ipn(p)));}
    }catch(Exception e){log("VNPay IPN not applied",e);res.getWriter().write("{\"RspCode\":\"99\",\"Message\":\"Unable to confirm\"}");}
 }
}
