package bssms_api.KhanhLTQ;

import com.google.gson.Gson;
import bssms_inventory.Product;
import bssms_persistence.KhanhLTQ.ProductDAO;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@WebServlet("/api/products/*")
public class ProductServlet extends HttpServlet {

    private ProductDAO productDAO = new ProductDAO();
    private Gson gson = new Gson();

    // Cấu hình CORS để VS Code (localhost:5173 / localhost:3000) gọi được API
    private void setCorsHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    // GET: Lấy danh sách sản phẩm hoặc 1 sản phẩm theo ID
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        PrintWriter out = resp.getWriter();
        String pathInfo = req.getPathInfo();

        if (pathInfo == null || pathInfo.equals("/")) {
            List<Product> list = productDAO.getAllProducts();
            out.print(gson.toJson(list));
        } else {
            try {
                int id = Integer.parseInt(pathInfo.substring(1));
                Product p = productDAO.getProductById(id);
                if (p != null) {
                    out.print(gson.toJson(p));
                } else {
                    resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"message\": \"Product not found\"}");
                }
            } catch (NumberFormatException e) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            }
        }
        out.flush();
    }

    // POST: Thêm sản phẩm mới
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        BufferedReader reader = req.getReader();
        Product product = gson.fromJson(reader, Product.class);

        boolean success = productDAO.createProduct(product);
        PrintWriter out = resp.getWriter();

        if (success) {
            resp.setStatus(HttpServletResponse.SC_CREATED);
            out.print("{\"message\": \"Product created successfully\"}");
        } else {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"Failed to create product\"}");
        }
        out.flush();
    }

    // PUT: Cập nhật sản phẩm
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        BufferedReader reader = req.getReader();
        Product product = gson.fromJson(reader, Product.class);

        boolean success = productDAO.updateProduct(product);
        PrintWriter out = resp.getWriter();

        if (success) {
            out.print("{\"message\": \"Product updated successfully\"}");
        } else {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"Failed to update product\"}");
        }
        out.flush();
    }

    // DELETE: Xóa sản phẩm
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String pathInfo = req.getPathInfo();
        PrintWriter out = resp.getWriter();

        if (pathInfo != null && !pathInfo.equals("/")) {
            int id = Integer.parseInt(pathInfo.substring(1));
            boolean success = productDAO.deleteProduct(id);
            if (success) {
                out.print("{\"message\": \"Product deleted successfully\"}");
            } else {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Failed to delete product\"}");
            }
        }
        out.flush();
    }
}