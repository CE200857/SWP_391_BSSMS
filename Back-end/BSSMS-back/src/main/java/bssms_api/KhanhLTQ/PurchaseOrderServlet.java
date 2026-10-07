package bssms_api.KhanhLTQ;

import bssms_inventory.PurchaseOrder;
import bssms_persistence.KhanhLTQ.PurchaseOrderDAO;
import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;

@WebServlet("/api/purchase-order")
public class PurchaseOrderServlet extends HttpServlet {
    private final PurchaseOrderDAO purchaseOrderDAO = new PurchaseOrderDAO();
    private final Gson gson = new Gson();

    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setContentType("application/json;charset=UTF-8");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setCorsHeaders(response);
        BufferedReader reader = request.getReader();
        PurchaseOrder order = gson.fromJson(reader, PurchaseOrder.class);

        boolean success = purchaseOrderDAO.createPurchaseOrder(order);
        if (success) {
            response.setStatus(HttpServletResponse.SC_CREATED);
            response.getWriter().print("{\"message\": \"Tạo đơn nhập hàng thành công\"}");
        } else {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().print("{\"message\": \"Tạo đơn nhập hàng thất bại\"}");
        }
    }
}