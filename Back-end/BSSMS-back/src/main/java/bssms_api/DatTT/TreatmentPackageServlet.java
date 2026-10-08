/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_api.DatTT;

import bssms_catalog.TreatmentPackage;
import bssms_persistence.DatTT.TreatmentPackageDAO;
import com.google.gson.Gson;
import java.io.IOException;
import java.util.List;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 *
 * @author Trần Thành Đạt - CE200857
 */

@WebServlet("/api/treatment-packages")
public class TreatmentPackageServlet extends HttpServlet {
    
    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setContentType("application/json;charset=UTF-8");
    }

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setCorsHeaders(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    // Xử lý VIEW
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setCorsHeaders(response);
        TreatmentPackageDAO dao = new TreatmentPackageDAO();
        List<TreatmentPackage> list = dao.getAllTreatmentPackages();
        response.getWriter().print(new Gson().toJson(list));
    }

    // Xử lý CREATE
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setCorsHeaders(response);
        TreatmentPackage tp = new Gson().fromJson(request.getReader(), TreatmentPackage.class);
        TreatmentPackageDAO dao = new TreatmentPackageDAO();
        
        if (dao.createTreatmentPackage(tp)) {
            response.setStatus(HttpServletResponse.SC_CREATED);
            response.getWriter().print("{\"message\": \"Thêm gói liệu trình thành công!\"}");
        } else {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"message\": \"Thêm thất bại!\"}");
        }
    }

    // Xử lý UPDATE
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setCorsHeaders(response);
        TreatmentPackage tp = new Gson().fromJson(request.getReader(), TreatmentPackage.class);
        TreatmentPackageDAO dao = new TreatmentPackageDAO();
        
        if (dao.updateTreatmentPackage(tp)) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().print("{\"message\": \"Cập nhật thành công!\"}");
        } else {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"message\": \"Cập nhật thất bại!\"}");
        }
    }

    // Xử lý DELETE
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setCorsHeaders(response);
        int id = Integer.parseInt(request.getParameter("id"));
        TreatmentPackageDAO dao = new TreatmentPackageDAO();
        
        if (dao.deleteTreatmentPackage(id)) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().print("{\"message\": \"Xóa thành công!\"}");
        } else {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print("{\"message\": \"Xóa thất bại!\"}");
        }
    }
}
