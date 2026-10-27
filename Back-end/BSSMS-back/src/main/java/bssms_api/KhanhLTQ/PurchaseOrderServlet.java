package bssms_api.KhanhLTQ;

import bssms_controller.KhanhLTQ.PurchaseOrderController;
import bssms_api.common.ControllerServlet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(urlPatterns={"/PurchaseOrderServlet","/api/purchase-orders"})
public class PurchaseOrderServlet extends ControllerServlet {
    @Override protected void doGet(HttpServletRequest request,HttpServletResponse response) throws IOException {
        dispatch(request,response,(input,result)->{try(PurchaseOrderController controller=new PurchaseOrderController()){controller.get(input,result);}});
    }
    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        dispatch(request, response, (input, result) -> {
            try (PurchaseOrderController controller = new PurchaseOrderController()) {
                controller.post(input, result);
            }
        });
    }
}
