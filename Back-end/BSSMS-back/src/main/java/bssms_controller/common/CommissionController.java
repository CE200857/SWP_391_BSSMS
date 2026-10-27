package bssms_controller.common;
import bssms_persistence.common.CommissionWorkflowDAO;
import com.google.gson.*;
public class CommissionController extends ControllerSupport {
    public void get(ActionRequest request,ActionResult result) throws Exception {
        bind(request);CommissionWorkflowDAO dao=use(new CommissionWorkflowDAO());
        Object data=request.uri().contains("/manager/")?dao.report(request.parameter("startDate"),request.parameter("endDate")):dao.mine();
        result.writer().print(new Gson().toJson(data));
    }
    public void post(ActionRequest request,ActionResult result) throws Exception {
        bind(request);JsonObject data=JsonParser.parseReader(request.bodyReader()).getAsJsonObject();
        use(new CommissionWorkflowDAO()).closeMonth(data.get("periodMonth").getAsString());result.writer().print("{\"message\":\"Commission period closed.\"}");
    }
}
