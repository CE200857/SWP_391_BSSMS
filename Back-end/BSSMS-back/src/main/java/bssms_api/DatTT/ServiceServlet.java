/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package bssms_api.DatTT;
import bssms_persistence.DatTT.ServiceDAO;
import bssms_catalog.Service;

import com.google.gson.Gson;
import java.io.BufferedReader;
import java.util.List;
import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 *
 * @author Trần Thành Đạt - CE200857
 */
@WebServlet(name = "ServiceController", urlPatterns = {"/api/service"})
public class ServiceServlet extends HttpServlet {

    private ServiceDAO serviceDAO = new ServiceDAO();
    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173"); 
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String idParam = req.getParameter("id");
        PrintWriter out = resp.getWriter();

        if (idParam != null && !idParam.isEmpty()) {
            int id = Integer.parseInt(idParam);
            Service service = serviceDAO.getServiceById(id);
            out.print(gson.toJson(service));
        } else {
            List<Service> list = serviceDAO.getAllServices();
            out.print(gson.toJson(list));
        }
        out.flush();
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        req.setCharacterEncoding("UTF-8");
        
        BufferedReader reader = req.getReader();
        Service newService = gson.fromJson(reader, Service.class);
        
        try {
            serviceDAO.addService(newService);
            resp.setStatus(HttpServletResponse.SC_CREATED);
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        req.setCharacterEncoding("UTF-8");
        
        String idParam = req.getParameter("id");
        if (idParam != null) {
            BufferedReader reader = req.getReader();
            Service updatedService = gson.fromJson(reader, Service.class);
            updatedService.setServiceId(Integer.parseInt(idParam));
            
            try {
               
                serviceDAO.updateService(updatedService);
                resp.setStatus(HttpServletResponse.SC_OK); 
            } catch (Exception e) {
                e.printStackTrace();
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR); 
            }
        } else {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        String idParam = req.getParameter("id");
        
        if (idParam != null) {
            try {
                serviceDAO.deleteService(Integer.parseInt(idParam));
                resp.setStatus(HttpServletResponse.SC_OK);
            } catch (Exception e) {
                e.printStackTrace();
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR); 
            }
        } else {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST); 
        }
    }
}
