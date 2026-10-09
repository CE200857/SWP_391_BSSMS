package bssms_api.KhanhLTQ;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import bssms_persistence.KhanhLTQ.ProductDAO;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
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
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(req, resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
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
    }
}