package bssms_api.KhanhLTQ;
import bssms_api.common.ControllerServlet;
import bssms_controller.common.CommissionController;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
@WebServlet("/api/technician/commission")
public class CommissionServlet extends ControllerServlet {
    protected void doGet(HttpServletRequest req,HttpServletResponse res)throws IOException {
        dispatch(req,res,(input,result)->{try(CommissionController c=new CommissionController()){c.get(input,result);}});
    }
}
