package bssms_controller.HienLNM;

import bssms_controller.common.*;
import bssms_persistence.HienLNM.VoucherDAO;
import com.google.gson.*;
import java.math.BigDecimal;

public class VoucherController extends ControllerSupport {
    private final Gson gson = new Gson();

    public void get(ActionRequest request, ActionResult response) throws Exception {
        bind(request);
        VoucherDAO dao = use(new VoucherDAO());
        String id = request.parameter("id"), preview = request.parameter("preview");
        Object data;
        if (preview != null) data = dao.preview(preview, request.parameter("customerId") == null || request.parameter("customerId").isBlank() ? 0 : Integer.parseInt(request.parameter("customerId")), new BigDecimal(request.parameter("subtotal")));
        else if (id != null && !id.isBlank()) data = dao.getVoucherById(Integer.parseInt(id));
        else data = dao.getAllVouchers(request.parameter("search"), request.parameter("status"));
        response.writer().print(gson.toJson(data));
    }

    public void post(ActionRequest request, ActionResult response) throws Exception {
        bind(request);
        JsonObject o = JsonParser.parseReader(request.bodyReader()).getAsJsonObject();
        VoucherDAO dao = use(new VoucherDAO());
        String action = o.has("action") ? o.get("action").getAsString() : "create";
        if ("setStatus".equals(action)) {
            dao.setVoucherStatus(o.get("voucherId").getAsInt(), o.get("status").getAsString());
            response.writer().print("{\"message\": \"Đã cập nhật trạng thái voucher.\"}");
            return;
        }
        VoucherDAO.Data d = gson.fromJson(o, VoucherDAO.Data.class);
        if ("update".equals(action)) {
            dao.updateVoucher(o.get("voucherId").getAsInt(), d);
            response.writer().print("{\"message\": \"Cập nhật voucher thành công!\"}");
        } else {
            int id = dao.createVoucher(d);
            response.status(201);
            response.writer().print("{\"message\": \"Tạo voucher thành công!\",\"voucherId\":" + id + "}");
        }
    }

    public void delete(ActionRequest request, ActionResult response) throws Exception {
        bind(request);
        use(new VoucherDAO()).deleteVoucher(Integer.parseInt(request.parameter("id")));
        response.writer().print("{\"message\": \"Đã ngừng áp dụng voucher.\"}");
    }
}
