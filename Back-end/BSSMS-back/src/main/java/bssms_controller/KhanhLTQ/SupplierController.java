package bssms_controller.KhanhLTQ;

import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import bssms_inventory.Supplier;
import bssms_persistence.KhanhLTQ.SupplierDAO;
import com.google.gson.Gson;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

public class SupplierController extends ControllerSupport {

    private final SupplierDAO supplierDAO = use(new SupplierDAO());
    private final Gson gson = new Gson();

    // Sửa lại hàm để đọc Origin từ request

    // 1. GET: Lấy danh sách hoặc 1 nhà cung cấp theo ID
    
    public void get(ActionRequest request, ActionResult response) 
            throws IOException {
        bind(request);

        PrintWriter out = response.writer();

        String idParam = request.parameter("id");
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
    
    public void post(ActionRequest request, ActionResult response) 
            throws IOException {
        bind(request);

        PrintWriter out = response.writer();

        BufferedReader reader = request.bodyReader();
        Supplier supplier = gson.fromJson(reader, Supplier.class);

        InputValidation.supplier(supplier,false);
        boolean success = supplierDAO.createSupplier(supplier);
        if (success) {
            response.status(201);
            out.print("{\"message\": \"Thêm thành công\"}");
        } else {
            response.status(400);
            out.print("{\"message\": \"Thêm thất bại\"}");
        }
        out.flush();
    }

    // 3. PUT: Cập nhật nhà cung cấp
    
    public void put(ActionRequest request, ActionResult response) 
            throws IOException {
        bind(request);

        PrintWriter out = response.writer();

        BufferedReader reader = request.bodyReader();
        Supplier supplier = gson.fromJson(reader, Supplier.class);

        InputValidation.supplier(supplier,true);
        boolean success = supplierDAO.updateSupplier(supplier);
        if (success) {
            response.status(200);
            out.print("{\"message\": \"Cập nhật thành công\"}");
        } else {
            response.status(400);
            out.print("{\"message\": \"Cập nhật thất bại\"}");
        }
        out.flush();
    }

    // 4. DELETE: Xóa nhà cung cấp
    
    public void delete(ActionRequest request, ActionResult response) 
            throws IOException {
        bind(request);

        PrintWriter out = response.writer();

        String idParam = request.parameter("id");
        if (idParam != null && !idParam.isEmpty()) {
            int id = Integer.parseInt(idParam);
            boolean success = supplierDAO.deleteSupplier(id);

            if (success) {
                response.status(200);
                out.print("{\"message\": \"Xóa thành công\"}");
            } else {
                response.status(400);
                out.print("{\"message\": \"Xóa thất bại\"}");
            }
        } else {
            response.status(400);
            out.print("{\"message\": \"Thiếu ID nhà cung cấp\"}");
        }
        out.flush();
    }
}