package bssms_api.KhanhLTQ;

import bssms_persistence.KhanhLTQ.ProductDAO;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;

@WebServlet("/api/stock")
public class StockServlet extends HttpServlet {
    private final ProductDAO productDAO = new ProductDAO();
    private final Gson gson = new Gson();

    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "PUT, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setContentType("application/json;charset=UTF-8");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setCorsHeaders(response);
        BufferedReader reader = request.getReader();
        JsonObject data = gson.fromJson(reader, JsonObject.class);

        int productId = data.get("productId").getAsInt();
        int stockQuantity = data.get("stockQuantity").getAsInt();

        boolean success = productDAO.updateStockQuantity(productId, stockQuantity);
        if (success) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().print("{\"message\": \"Cập nhật số lượng tồn kho thành công\"}");
        } else {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().print("{\"message\": \"Cập nhật kho thất bại\"}");
        }
    }
}