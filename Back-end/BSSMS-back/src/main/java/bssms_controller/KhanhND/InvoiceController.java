package bssms_controller.KhanhND;

import bssms_controller.common.*;
import bssms_persistence.KhanhND.InvoiceDAO;
import bssms_integration.VnPayRefundDAO;
import com.google.gson.*;
import java.util.Map;

public class InvoiceController extends ControllerSupport {
    private final Gson gson = new Gson();

    private static String text(JsonObject o, String key) {
        return o.has(key) && !o.get(key).isJsonNull() ? o.get(key).getAsString() : null;
    }
    private static String blank(String v) { return v == null || v.isBlank() ? null : v.trim(); }
    private String path(ActionRequest request) { return request.pathInfo() == null ? "/" : request.pathInfo(); }

    public void get(ActionRequest request, ActionResult response) throws Exception {
        bind(request);
        InvoiceDAO dao = use(new InvoiceDAO());
        String path = path(request);
        Object data;
        if ("/".equals(path)) data = dao.getInvoices(blank(request.parameter("status")), blank(request.parameter("fromDate")), blank(request.parameter("toDate")));
        else if ("/unpaid-appointments".equals(path)) data = dao.unpaidAppointments();
        else data = dao.getInvoiceDetails(Integer.parseInt(path.substring(1)));
        response.writer().write(gson.toJson(data));
    }

    public void post(ActionRequest request, ActionResult response) throws Exception {
        bind(request);
        String[] parts = path(request).split("/");
        if (parts.length < 3) { response.error(404, "Không tìm thấy thao tác."); return; }
        int id = Integer.parseInt(parts[1]);
        JsonObject o = JsonParser.parseReader(request.bodyReader()).getAsJsonObject();
        InvoiceDAO dao = use(new InvoiceDAO());
        Object result;
        switch (parts[2]) {
            case "voucher": result = dao.applyVoucher(id, blank(text(o, "voucherCode"))); break;
            case "pay": result = dao.pay(id, text(o, "paymentMethod"), o.has("voucherCode") ? blank(text(o, "voucherCode")) : null, blank(text(o, "transactionCode"))); break;
            case "cancel": dao.cancelInvoice(id, text(o, "reason")); result = Map.of("message", "Đã hủy hóa đơn."); break;
            case "refund":
                Map<String, Object> refund = dao.refundInvoice(id, text(o, "reason"));
                if ("Pending".equals(refund.get("status"))) {
                    VnPayRefundDAO vnpay = use(new VnPayRefundDAO());
                    refund.put("vnpay", vnpay.process(((Number) refund.get("refundId")).intValue()));
                }
                result = refund; break;
            default: response.error(404, "Không tìm thấy thao tác."); return;
        }
        response.writer().write(gson.toJson(result));
    }
}
