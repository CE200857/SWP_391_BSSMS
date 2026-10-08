package bssms_api.KhanhLTQ;

<<<<<<< Updated upstream
import bssms_inventory.PurchaseOrder;
import bssms_persistence.KhanhLTQ.PurchaseOrderDAO;
import com.google.gson.Gson;
=======
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import bssms_persistence.KhanhLTQ.ProductDAO;

>>>>>>> Stashed changes
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
<<<<<<< Updated upstream

@WebServlet("/api/purchase-order")
public class PurchaseOrderServlet extends HttpServlet {
    private final PurchaseOrderDAO purchaseOrderDAO = new PurchaseOrderDAO();
    private final Gson gson = new Gson();

    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setContentType("application/json;charset=UTF-8");
=======
import java.io.PrintWriter;

@WebServlet("/PurchaseOrderServlet")
public class PurchaseOrderServlet extends HttpServlet {

    private ProductDAO productDAO = new ProductDAO();
    private Gson gson = new Gson();

    private void setCorsHeaders(HttpServletRequest req, HttpServletResponse resp) {
        String origin = req.getHeader("Origin");
        if (origin == null || origin.isEmpty()) {
            origin = "http://localhost:5173";
        }
        resp.setHeader("Access-Control-Allow-Origin", origin);
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        resp.setHeader("Access-Control-Allow-Credentials", "true");
>>>>>>> Stashed changes
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
<<<<<<< Updated upstream
        setCorsHeaders(resp);
=======
        setCorsHeaders(req, resp);
>>>>>>> Stashed changes
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
<<<<<<< Updated upstream
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
=======
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(req, resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        PrintWriter out = resp.getWriter();
        try {
            BufferedReader reader = req.getReader();
            JsonObject jsonObject = gson.fromJson(reader, JsonObject.class);

            if (jsonObject != null && jsonObject.has("items")) {
                JsonArray items = jsonObject.getAsJsonArray("items");

                // Duyệt danh sách sản phẩm nhập và cập nhật số lượng tồn trong CSDL
                for (JsonElement elem : items) {
                    JsonObject item = elem.getAsJsonObject();
                    int productId = item.get("productId").getAsInt();
                    int quantity = item.get("quantity").getAsInt();

                    // Gọi DAO cập nhật stock
                    productDAO.updateStockQuantity(productId, quantity);
                }

                resp.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\": \"Tạo đơn nhập hàng thành công!\"}");
            } else {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Dữ liệu đơn nhập không hợp lệ!\"}");
            }
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"message\": \"Lỗi máy chủ khi tạo đơn nhập hàng!\"}");
        }
        out.flush();
>>>>>>> Stashed changes
    }
}