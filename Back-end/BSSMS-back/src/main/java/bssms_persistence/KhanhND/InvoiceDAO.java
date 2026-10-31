package bssms_persistence.KhanhND;
import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import bssms_billing.InvoiceProduct;
import com.google.gson.*;
import java.sql.*;
import java.math.BigDecimal;
import java.util.*;
public class InvoiceDAO extends DBContext implements AutoCloseable {
    public void close() throws SQLException {if(conn!=null) conn.close();}
    private String scope() {return "EXISTS(SELECT 1 FROM " + bssms_persistence.common.SchemaSql.ACCOUNTS + " ac WHERE ac.account_id=? AND ac.status='Active' AND (ac.role IN ('Manager','Receptionist') OR (ac.role='Customer' AND c.account_id=ac.account_id)))";}
    private String summary() {return "SELECT i.*,c.full_name AS customer_name,c.phone AS customer_phone,a.appointment_date,a.start_time,s.service_name,v.paid_amount,v.outstanding_amount,v.refunded_amount FROM Invoice i JOIN " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c ON c.customer_id=i.customer_id LEFT JOIN Appointment a ON a.appointment_id=i.appointment_id LEFT JOIN Service s ON s.service_id=a.service_id JOIN vw_InvoiceBalance v ON v.invoice_id=i.invoice_id WHERE ";}
    public List<Map<String,Object>> getInvoices() throws SQLException {
        return workflow().query(summary()+scope()+" ORDER BY i.invoice_id DESC",requireActorAccountId());
    }
    public Map<String,Object> getInvoiceDetails(int invoiceId) throws SQLException {
        Workflow w=workflow(); Map<String,Object> result=new LinkedHashMap<>();
        result.put("invoice",w.one(summary()+"i.invoice_id=? AND "+scope(),invoiceId,requireActorAccountId()));
        result.put("payments",w.query("SELECT * FROM Payment WHERE invoice_id=?",invoiceId));
        result.put("products",w.query("SELECT ip.*,p.product_name FROM InvoiceProduct ip JOIN Product p ON p.product_id=ip.product_id WHERE ip.invoice_id=?",invoiceId));
        result.put("services",w.query("SELECT * FROM InvoiceService WHERE invoice_id=?",invoiceId));
        result.put("packages",w.query("SELECT * FROM " + bssms_persistence.common.SchemaSql.PACKAGE_SALES + " InvoicePackage WHERE invoice_id=?",invoiceId));
        result.put("refunds",w.query("SELECT r.*,p.payment_method FROM Refund r JOIN Payment p ON p.payment_id=r.payment_id WHERE p.invoice_id=?",invoiceId));
        result.put("actions",w.query("SELECT * FROM AuditLog WHERE entity_name='Invoice' AND entity_id=CONVERT(nvarchar(100),?) ORDER BY audit_id",invoiceId));
        return result;
    }
    public List<Map<String,Object>> getCompletedAppointmentsWithoutInvoice() throws SQLException {
        workflow().roles("Receptionist","Manager");
        return workflow().query("SELECT a.appointment_id,a.customer_id,c.full_name AS customer_name,s.service_name,s.price AS service_price,a.appointment_date,a.start_time FROM Appointment a JOIN " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c ON c.customer_id=a.customer_id JOIN Service s ON s.service_id=a.service_id WHERE a.status='Completed' AND a.customer_package_id IS NULL AND NOT EXISTS(SELECT 1 FROM Invoice i WHERE i.appointment_id=a.appointment_id AND i.status<>'Cancelled') ORDER BY a.appointment_date DESC");
    }
    public List<Map<String,Object>> getActiveProducts() throws SQLException {
        workflow().roles("Receptionist","Manager");
        return workflow().query("SELECT * FROM Product WHERE status='Active' AND product_type='Retail' AND stock_quantity>0");
    }
    public Map<String,Object> create(Integer customerId,Integer appointmentId,Integer packageId,Integer voucherId,boolean birthday,List<InvoiceProduct> products,String paymentMethod,BigDecimal received,String requestKey) throws SQLException {
        Workflow w=workflow();w.roles("Receptionist");
        final int customer=customerId!=null?customerId:Workflow.id(w.one("SELECT customer_id FROM Appointment WHERE appointment_id=?",appointmentId).get("customerId"));
        JsonArray lines=new JsonArray();
        for(InvoiceProduct product:products) {
            if(product.getQuantity()<=0 || product.getProductId()<=0) throw new IllegalArgumentException("Invalid product quantity.");
            JsonObject line=new JsonObject();line.addProperty("product_id",product.getProductId());line.addProperty("quantity",product.getQuantity());lines.add(line);
        }
        return w.transaction(()->{
            String fingerprint=new Gson().toJson(Arrays.asList(customer,appointmentId,packageId,voucherId,birthday,lines,paymentMethod,received));
            if(requestKey!=null && !requestKey.isBlank()) {
                if(requestKey.length()>100)throw new IllegalArgumentException("requestKey is too long.");
                List<Map<String,Object>> old=w.query("SELECT invoice_id,request_fingerprint FROM Invoice WHERE creation_request_key=?",requestKey);
                if(!old.isEmpty()) {
                    if(!fingerprint.equals(old.get(0).get("requestFingerprint")))throw new WorkflowException(409,"requestKey was already used for a different invoice request.");
                    int priorId=Workflow.id(old.get(0).get("invoiceId"));
                    return Map.of("invoiceId",priorId,"details",getInvoiceDetails(priorId));
                }
            }
            int id=Workflow.id(w.call("usp_CreateInvoice",requireActorAccountId(),customer,appointmentId,packageId,lines.toString(),voucherId,birthday).get(0).get("invoiceId"));
            if(requestKey!=null && !requestKey.isBlank())w.update("UPDATE Invoice SET creation_request_key=?,request_fingerprint=? WHERE invoice_id=?",requestKey,fingerprint,id);
            Map<String,Object> result=new LinkedHashMap<>();result.put("invoiceId",id);
            if(paymentMethod!=null && !paymentMethod.isBlank()) result.putAll(pay(id,paymentMethod,received,requestKey,null));
            result.putAll(w.one("SELECT invoice_id,appointment_id,subtotal,discount,total_amount,status AS invoice_status FROM Invoice WHERE invoice_id=?",id));
            result.put("details",getInvoiceDetails(id));return result;
        });
    }
    public Map<String,Object> pay(int invoiceId,String method,BigDecimal received,String requestKey,String transactionCode) throws SQLException {
        Workflow w=workflow();w.roles("Receptionist");
        if(!Arrays.asList("Cash","Bank Transfer").contains(method)) throw new IllegalArgumentException("Use Cash or Bank Transfer. VNPay requires a verified gateway callback.");
        if(received==null || received.signum()<0) throw new IllegalArgumentException("Invalid payment amount.");
        if(requestKey==null || requestKey.isBlank() || requestKey.length()>100) throw new IllegalArgumentException("requestKey is required (reuse it when retrying this payment).");
        return w.transaction(()->{
        // Do not recompute a cash tender after an idempotent retry.
        List<Map<String,Object>> existing=w.query("SELECT invoice_id,payment_method,amount FROM Payment WHERE request_key=?",requestKey);
        BigDecimal outstanding=(BigDecimal)w.one("SELECT outstanding_amount FROM vw_InvoiceBalance WHERE invoice_id=?",invoiceId).get("outstandingAmount");
        BigDecimal amount="Cash".equals(method)?received.min(outstanding):received;
        if(!existing.isEmpty()) {
            Map<String,Object> old=existing.get(0);
            if(Workflow.id(old.get("invoiceId"))!=invoiceId || !method.equals(old.get("paymentMethod"))) throw new WorkflowException(409,"requestKey belongs to a different payment.");
            amount=(BigDecimal)old.get("amount");
            if(received.compareTo(amount)<0 || (!"Cash".equals(method)&&received.compareTo(amount)!=0)) throw new WorkflowException(409,"Payment amount differs from original request.");
        }
        w.call("usp_RecordPayment",requireActorAccountId(),invoiceId,method,amount,requestKey,transactionCode);
        Map<String,Object> result=w.one("SELECT i.invoice_id,i.status AS invoice_status,i.total_amount,v.paid_amount,v.outstanding_amount FROM Invoice i JOIN vw_InvoiceBalance v ON v.invoice_id=i.invoice_id WHERE i.invoice_id=?",invoiceId);
        result.put("changeDue","Cash".equals(method)?received.subtract(amount):BigDecimal.ZERO);return result;
        });
    }
    public Map<String,Object> refundInvoice(int invoiceId,BigDecimal amount,String reason,int accountId) throws SQLException {
        Workflow w=workflow();w.roles("Manager");
        BigDecimal paid=(BigDecimal)w.one("SELECT paid_amount FROM vw_InvoiceBalance WHERE invoice_id=?",invoiceId).get("paidAmount");
        if(amount==null || amount.compareTo(paid)!=0) throw new IllegalArgumentException("Only full refunds are supported. Use the received payment total.");
        w.call("usp_RequestFullRefund",requireActorAccountId(),invoiceId,reason,"refund-invoice-"+invoiceId);
        return Map.of("invoiceId",invoiceId,"status","Pending","message","Refund requested. Confirm each refund after the money has actually been returned.","refunds",w.query("SELECT r.*,p.payment_method FROM Refund r JOIN Payment p ON p.payment_id=r.payment_id WHERE p.invoice_id=?",invoiceId));
    }
    public Map<String,Object> completeRefund(int refundId) throws SQLException {
        workflow().roles("Manager");
        Map<String,Object> refund=workflow().one("SELECT p.payment_method FROM Refund r JOIN Payment p ON p.payment_id=r.payment_id WHERE r.refund_id=?",refundId);
        if("VNPay".equals(refund.get("paymentMethod"))) {
            try(bssms_integration.VnPayRefundDAO gateway=new bssms_integration.VnPayRefundDAO()) {
                gateway.setActorAccountId(requireActorAccountId());return gateway.process(refundId);
            }
        }
        workflow().call("usp_CompleteRefund",requireActorAccountId(),refundId);
        return workflow().one("SELECT * FROM Refund WHERE refund_id=?",refundId);
    }
    public Map<String,Object> cancelInvoice(int invoiceId,String reason,int accountId) throws SQLException {
        workflow().call("usp_CancelInvoice",requireActorAccountId(),invoiceId,reason);
        return Map.of("invoiceId",invoiceId,"status","Cancelled");
    }
}
