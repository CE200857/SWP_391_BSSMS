/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package bssms_api.DatTT;

import bssms_catalog.Equipment;
import bssms_persistence.DatTT.EquipmentDAO;
import com.google.gson.Gson;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 *
 * @author Trần Thành Đạt - CE200857
 */
@WebServlet(name = "EquipmentServlet", urlPatterns = {"/api/equipment"})
public class EquipmentServlet extends HttpServlet {

    private EquipmentDAO equipmentDAO = new EquipmentDAO();
    private Gson gson = new Gson();

    private void setCorsHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setHeader("Access-Control-Allow-Credentials", "true");
        resp.setContentType("application/json;charset=UTF-8");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }
    
    private boolean isManager(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session != null && session.getAttribute("user") != null) {
            Map<String, Object> user = (Map<String, Object>) session.getAttribute("user");
            return "Manager".equals(user.get("role"));
        }
        return false;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        List<Equipment> list = equipmentDAO.getAllEquipments();
        resp.getWriter().print(gson.toJson(list));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        if (!isManager(req)) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            resp.getWriter().print("{\"message\": \"Bạn không có quyền thêm thiết bị!\"}");
            return;
        }

        BufferedReader reader = req.getReader();
        Equipment newEq = gson.fromJson(reader, Equipment.class);
        
        if (equipmentDAO.addEquipment(newEq)) {
            resp.setStatus(HttpServletResponse.SC_CREATED);
            resp.getWriter().print("{\"message\": \"Thêm thiết bị thành công!\"}");
        } else {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().print("{\"message\": \"Thêm thiết bị thất bại!\"}");
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        if (!isManager(req)) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            resp.getWriter().print("{\"message\": \"Bạn không có quyền cập nhật thiết bị!\"}");
            return;
        }

        BufferedReader reader = req.getReader();
        Equipment eq = gson.fromJson(reader, Equipment.class);
        
        if (equipmentDAO.updateEquipment(eq)) {
            resp.setStatus(HttpServletResponse.SC_OK);
            resp.getWriter().print("{\"message\": \"Cập nhật thiết bị thành công!\"}");
        } else {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().print("{\"message\": \"Cập nhật thất bại!\"}");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        if (!isManager(req)) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            resp.getWriter().print("{\"message\": \"Bạn không có quyền xóa thiết bị!\"}");
            return;
        }

        String idParam = req.getParameter("id");
        if (idParam != null) {
            if (equipmentDAO.deleteEquipment(Integer.parseInt(idParam))) {
                resp.setStatus(HttpServletResponse.SC_OK);
                resp.getWriter().print("{\"message\": \"Xóa thiết bị thành công!\"}");
            } else {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                resp.getWriter().print("{\"message\": \"Xóa thất bại! Thiết bị này đang được phân công trong lịch hẹn.\"}");
            }
        }
    }
}
