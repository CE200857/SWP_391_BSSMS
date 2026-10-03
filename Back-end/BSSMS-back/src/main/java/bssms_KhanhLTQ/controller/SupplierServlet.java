package bssms_KhanhLTQ.controller;

import bssms_KhanhLTQ.dao.SupplierDAO; 
import bssms_common.model.Supplier; 
import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

@WebServlet("/api/suppliers/*")
public class SupplierServlet extends HttpServlet {

    private SupplierDAO supplierDAO = new SupplierDAO();
    private Gson gson = new Gson();

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

    // 1. GET: Lấy danh sách Nhà cung cấp
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        resp.setContentType("application/json;charset=UTF-8");
        List<Supplier> list = supplierDAO.getAllSuppliers();
        resp.getWriter().print(gson.toJson(list));
    }

// 2. POST: Thêm mới Nhà cung cấp (Create Supplier)
@Override
protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    setCorsHeaders(resp);
    resp.setContentType("application/json;charset=UTF-8");
    Supplier supplier = gson.fromJson(req.getReader(), Supplier.class);
    
    // Đổi addSupplier -> createSupplier
    boolean success = supplierDAO.createSupplier(supplier); 
    resp.getWriter().print("{\"success\":" + success + "}");
}

    // 3. PUT: Cập nhật Nhà cung cấp
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        resp.setContentType("application/json;charset=UTF-8");
        Supplier supplier = gson.fromJson(req.getReader(), Supplier.class);
        boolean success = supplierDAO.updateSupplier(supplier);
        resp.getWriter().print("{\"success\":" + success + "}");
    }

    // 4. DELETE: Xóa Nhà cung cấp
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        resp.setContentType("application/json;charset=UTF-8");
        String pathInfo = req.getPathInfo();
        if (pathInfo != null && pathInfo.length() > 1) {
            int supplierId = Integer.parseInt(pathInfo.substring(1));
            boolean success = supplierDAO.deleteSupplier(supplierId);
            resp.getWriter().print("{\"success\":" + success + "}");
        }
    }
}