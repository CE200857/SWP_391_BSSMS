package bssms_controller.KhanhLTQ;

import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import com.google.gson.Gson;
import bssms_inventory.Product;
import bssms_persistence.KhanhLTQ.ProductDAO;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

public class ProductController extends ControllerSupport {

    private final ProductDAO productDAO = use(new ProductDAO());
    private final Gson gson = new Gson();

    public void get(ActionRequest req, ActionResult resp) throws IOException {
        bind(req);

        PrintWriter out = resp.writer();
        String pathInfo = req.pathInfo();
        String idParam = req.parameter("id");

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
                    resp.status(404);
                    out.print("{\"message\": \"Product not found\"}");
                }
            } else {
                List<Product> list = productDAO.getAllProducts();
                out.print(gson.toJson(list));
            }
        } catch (NumberFormatException e) {
            resp.status(400);
            out.print("{\"message\": \"Invalid product ID\"}");
        }
        out.flush();
    }

    public void post(ActionRequest req, ActionResult resp) throws IOException {
        bind(req);

        BufferedReader reader = req.bodyReader();
        Product product = gson.fromJson(reader, Product.class);

        InputValidation.product(product,false);
        boolean success = productDAO.createProduct(product);
        PrintWriter out = resp.writer();

        if (success) {
            resp.status(201);
            out.print("{\"message\": \"Product created successfully\"}");
        } else {
            resp.status(400);
            out.print("{\"message\": \"Failed to create product\"}");
        }
        out.flush();
    }

    public void put(ActionRequest req, ActionResult resp) throws IOException {
        bind(req);

        BufferedReader reader = req.bodyReader();
        com.google.gson.JsonObject body=com.google.gson.JsonParser.parseReader(reader).getAsJsonObject();
        Product product=gson.fromJson(body,Product.class);
        Product existing=productDAO.getProductById(product.getProductId());
        if(existing==null) throw new IllegalArgumentException("Product not found.");
        if(!body.has("productType")) product.setProductType(existing.getProductType());
        if(!body.has("unit")) product.setUnit(existing.getUnit());
        if(!body.has("stockQuantity")) product.setStockQuantity(existing.getStockQuantity());
        InputValidation.product(product,true);
        boolean success = productDAO.updateProduct(product);
        PrintWriter out = resp.writer();

        if (success) {
            out.print("{\"message\": \"Product updated successfully\"}");
        } else {
            resp.status(400);
            out.print("{\"message\": \"Failed to update product\"}");
        }
        out.flush();
    }

    public void delete(ActionRequest req, ActionResult resp) throws IOException {
        bind(req);

        PrintWriter out = resp.writer();
        String pathInfo = req.pathInfo();
        String idParam = req.parameter("id");
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
                resp.status(400);
                out.print("{\"message\": \"Failed to delete product\"}");
            }
        } else {
            resp.status(400);
            out.print("{\"message\": \"Missing product ID\"}");
        }
        out.flush();
    }
}