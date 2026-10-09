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

@WebServlet(urlPatterns = {"/api/products", "/api/products/*"})
public class ProductServlet extends HttpServlet {

    private ProductDAO productDAO = new ProductDAO();
    private Gson gson = new Gson();

    private void setCorsHeaders(HttpServletRequest req, HttpServletResponse resp) {
        String origin = req.getHeader("Origin");
        if (origin == null || origin.isEmpty()) {
            origin = "http://localhost:5173";
        }
        resp.setHeader("Access-Control-Allow-Origin", origin);
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        resp.setHeader("Access-Control-Allow-Credentials", "true");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(req, resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(req, resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        PrintWriter out = resp.getWriter();
        String pathInfo = req.getPathInfo();
        String idParam = req.getParameter("id");

        try {
            if (idParam != null && !idParam.isEmpty()) {
                int id = Integer.parseInt(idParam);
                Product p = productDAO.getProductById(id);
                out.print(gson.toJson(p));
            } else if (pathInfo != null && !pathInfo.equals("/")) {
                int id = Integer.parseInt(pathInfo.substring(1));
                Product p = productDAO.getProductById(id);
                if (p != null) {
                    out.print(gson.toJson(p));
                } else {
                    resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"message\": \"Product not found\"}");
                }
            } else {
                List<Product> list = productDAO.getAllProducts();
                out.print(gson.toJson(list));
            }
        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"Invalid product ID\"}");
        }
        out.flush();
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(req, resp);
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

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(req, resp);
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

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(req, resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        PrintWriter out = resp.getWriter();
        String pathInfo = req.getPathInfo();
        String idParam = req.getParameter("id");
        int id = -1;

        if (idParam != null && !idParam.isEmpty()) {
            id = Integer.parseInt(idParam);
        } else if (pathInfo != null && !pathInfo.equals("/")) {
            id = Integer.parseInt(pathInfo.substring(1));
        }

        if (id != -1) {
            boolean success = productDAO.deleteProduct(id);
            if (success) {
                out.print("{\"message\": \"Product deleted successfully\"}");
            } else {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Failed to delete product\"}");
            }
        } else {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"Missing product ID\"}");
        }
        out.flush();
    }
}