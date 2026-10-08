package bssms_api.KhanhLTQ;

import bssms_inventory.Supplier;
import bssms_persistence.KhanhLTQ.SupplierDAO;
import com.google.gson.Gson;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@WebServlet("/api/suppliers")
public class SupplierServlet extends HttpServlet {

    private final SupplierDAO supplierDAO = new SupplierDAO();
    private final Gson gson = new Gson();

    // Thiết lập CORS Header cho phép React kết nối
    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setContentType("application/json;charset=UTF-8");
        
    }

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        setCorsHeaders(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    // 1. GET: Lấy danh sách hoặc 1 nhà cung cấp theo ID
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        setCorsHeaders(response);
        PrintWriter out = response.getWriter();

        String idParam = request.getParameter("id");
        if (idParam != null && !idParam.isEmpty()) {
            int id = Integer.parseInt(idParam);
            Supplier supplier = supplierDAO.getSupplierById(id);
            out.print(gson.toJson(supplier));
        } else {
            List<Supplier> list = supplierDAO.getAllSuppliers();
            out.print(gson.toJson(list));
        }
        out.flush();
    }

    // 2. POST: Thêm mới nhà cung cấp
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        setCorsHeaders(response);
        PrintWriter out = response.getWriter();

        BufferedReader reader = request.getReader();
        Supplier supplier = gson.fromJson(reader, Supplier.class);

        boolean success = supplierDAO.createSupplier(supplier);
        if (success) {
            response.setStatus(HttpServletResponse.SC_CREATED);
            out.print("{\"message\": \"Thêm thành công\"}");
        } else {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"Thêm thất bại\"}");
        }
        out.flush();
    }

    // 3. PUT: Cập nhật nhà cung cấp
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        setCorsHeaders(response);
        PrintWriter out = response.getWriter();

        BufferedReader reader = request.getReader();
        Supplier supplier = gson.fromJson(reader, Supplier.class);

        boolean success = supplierDAO.updateSupplier(supplier);
        if (success) {
            response.setStatus(HttpServletResponse.SC_OK);
            out.print("{\"message\": \"Cập nhật thành công\"}");
        } else {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"Cập nhật thất bại\"}");
        }
        out.flush();
    }

    // 4. DELETE: Xóa nhà cung cấp
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        setCorsHeaders(response);
        PrintWriter out = response.getWriter();

        String idParam = request.getParameter("id");
        if (idParam != null && !idParam.isEmpty()) {
            int id = Integer.parseInt(idParam);
            boolean success = supplierDAO.deleteSupplier(id);

            if (success) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\": \"Xóa thành công\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Xóa thất bại\"}");
            }
        } else {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"Thiếu ID nhà cung cấp\"}");
        }
        out.flush();
    }
}