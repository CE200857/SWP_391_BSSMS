package bssms_api.HienLNM;

import bssms_persistence.HienLNM.RoomBedStatusDAO;
import com.google.gson.Gson;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * @author HienLNM
 */
@WebServlet(name = "RoomBedStatusServlet", urlPatterns = {"/api/room-bed-status","/api/room-bed-status/*"})
public class RoomBedStatusServlet extends HttpServlet {

    private RoomBedStatusDAO dao = new RoomBedStatusDAO();
    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setHeader("Access-Control-Allow-Credentials", "true");
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
        PrintWriter out = resp.getWriter();

        List<Map<String, Object>> list = dao.getAllRoomsWithBeds();
        out.print(gson.toJson(list));
        out.flush();
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\":\"Thieu thong tin room hoac bed ID\"}");
            out.flush();
            return;
        }

        String[] parts = pathInfo.split("/");
        if (parts.length < 3) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\":\"URL khong hop le. Dung cu phap: /api/room-bed-status/room/{id} hoac /api/room-bed-status/bed/{id}\"}");
            out.flush();
            return;
        }

        String type = parts[1];
        String idStr = parts[2];

        try {
            int id = Integer.parseInt(idStr);

            BufferedReader reader = req.getReader();
            Map<String, String> data = gson.fromJson(reader, Map.class);
            String newStatus = data.get("status");

            if (newStatus == null || newStatus.trim().isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\":\"Trang thai moi khong duoc de trong\"}");
                out.flush();
                return;
            }

            boolean success;
            if (type.equalsIgnoreCase("room")) {
                success = dao.updateRoomStatus(id, newStatus);
            } else if (type.equalsIgnoreCase("bed")) {
                success = dao.updateBedStatus(id, newStatus);
            } else {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\":\"Loai (room/bed) khong hop le\"}");
                out.flush();
                return;
            }

            if (success) {
                resp.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\":\"Cap nhat trang thai " + type + " thanh cong\"}");
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"message\":\"Khong tim thay " + type + " de cap nhat\"}");
            }
        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\":\"ID khong hop le\"}");
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"message\":\"" + e.getMessage() + "\"}");
        }
        out.flush();
    }
}
