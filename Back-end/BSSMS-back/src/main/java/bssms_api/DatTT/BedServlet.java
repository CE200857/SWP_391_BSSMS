/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package bssms_api.DatTT;

import bssms_catalog.Bed;
import bssms_persistence.DatTT.BedDAO;
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
@WebServlet(name = "BedServlet", urlPatterns = {"/api/beds"})
public class BedServlet extends HttpServlet {

    private BedDAO bedDAO = new BedDAO();
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
        List<Bed> list = bedDAO.getAllBeds();
        resp.getWriter().print(gson.toJson(list));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        if (!isManager(req)) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            resp.getWriter().print("{\"message\": \"Bạn không có quyền thêm giường!\"}");
            return;
        }

        BufferedReader reader = req.getReader();
        Bed newBed = gson.fromJson(reader, Bed.class);
        
        if (bedDAO.addBed(newBed)) {
            resp.setStatus(HttpServletResponse.SC_CREATED);
            resp.getWriter().print("{\"message\": \"Thêm giường thành công!\"}");
        } else {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().print("{\"message\": \"Thêm giường thất bại!\"}");
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        if (!isManager(req)) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            resp.getWriter().print("{\"message\": \"Bạn không có quyền cập nhật giường!\"}");
            return;
        }

        BufferedReader reader = req.getReader();
        Bed updatedBed = gson.fromJson(reader, Bed.class);
        
        if (bedDAO.updateBed(updatedBed)) {
            resp.setStatus(HttpServletResponse.SC_OK);
            resp.getWriter().print("{\"message\": \"Cập nhật giường thành công!\"}");
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
            resp.getWriter().print("{\"message\": \"Bạn không có quyền xóa giường!\"}");
            return;
        }

        String idParam = req.getParameter("id");
        if (idParam != null) {
            if (bedDAO.deleteBed(Integer.parseInt(idParam))) {
                resp.setStatus(HttpServletResponse.SC_OK);
                resp.getWriter().print("{\"message\": \"Xóa giường thành công!\"}");
            } else {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                resp.getWriter().print("{\"message\": \"Xóa thất bại! Giường đang có lịch hẹn.\"}");
            }
        }
    }
}
