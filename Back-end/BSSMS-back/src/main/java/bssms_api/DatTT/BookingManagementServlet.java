/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package bssms_api.DatTT;

import bssms_persistence.DatTT.BookingManagementDAO;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * @author Trần Thành Đạt - CE200857
 */
@WebServlet(name = "BookingManagementServlet", urlPatterns = {
    "/api/booking/slots",
    "/api/booking/my-packages",
    "/api/booking/online",
    "/api/booking/coordination",
    "/api/booking/checkin",
    "/api/booking/coordinate"
})
public class BookingManagementServlet extends HttpServlet {

    private final Gson gson = new Gson();

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

    @SuppressWarnings("unchecked")
    private Map<String, Object> getSessionUser(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session != null && session.getAttribute("user") != null) {
            return (Map<String, Object>) session.getAttribute("user");
        }
        return null;
    }

    private int extractAccountId(Map<String, Object> user) {
        if (user == null) {
            return -1;
        }
        if (user.get("accountId") instanceof Number) {
            return ((Number) user.get("accountId")).intValue();
        }
        if (user.get("account_id") instanceof Number) {
            return ((Number) user.get("account_id")).intValue();
        }
        return -1;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        PrintWriter out = resp.getWriter();
        String path = req.getServletPath();
        BookingManagementDAO dao = new BookingManagementDAO();

        try {
            // 1. CHECK SLOT AVAILABILITY (Guest, Customer, Receptionist)
            if ("/api/booking/slots".equals(path)) {
                String serviceIdStr = req.getParameter("serviceId");
                String dateStr = req.getParameter("date");
                String techIdStr = req.getParameter("technicianId");

                if (serviceIdStr == null || dateStr == null || serviceIdStr.isEmpty() || dateStr.isEmpty()) {
                    resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"message\": \"Vui lòng chọn dịch vụ và ngày kiểm tra!\"}");
                    return;
                }

                int serviceId = Integer.parseInt(serviceIdStr);
                Integer techId = (techIdStr != null && !techIdStr.isEmpty()) ? Integer.parseInt(techIdStr) : null;

                Map<String, Object> result = dao.checkSlotAvailability(serviceId, dateStr, techId);
                out.print(gson.toJson(result));
                return;
            }

            // 2. LẤY GÓI LIỆU TRÌNH CỦA KHÁCH ĐANG ĐĂNG NHẬP
            if ("/api/booking/my-packages".equals(path)) {
                Map<String, Object> user = getSessionUser(req);
                int accountId = extractAccountId(user);
                int customerId = dao.getCustomerIdByAccountId(accountId);
                if (customerId <= 0 && req.getParameter("customerId") != null) {
                    customerId = Integer.parseInt(req.getParameter("customerId"));
                }
                List<Map<String, Object>> packages = dao.getActivePackagesByCustomer(customerId);
                out.print(gson.toJson(packages));
                return;
            }

            // 3. LẤY DỮ LIỆU ĐIỀU PHỐI & CHECK-IN (Receptionist / Manager)
            if ("/api/booking/coordination".equals(path)) {
                String apptIdStr = req.getParameter("appointmentId");
                if (apptIdStr != null && !apptIdStr.isEmpty()) {
                    int appointmentId = Integer.parseInt(apptIdStr);
                    Map<String, Object> detail = dao.getCoordinationResources(appointmentId);
                    out.print(gson.toJson(detail));
                } else {
                    List<Map<String, Object>> list = dao.getAllAppointmentsForCoordination();
                    out.print(gson.toJson(list));
                }
            }
        } catch (IllegalArgumentException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"message\": \"Lỗi máy chủ: " + e.getMessage() + "\"}");
        } finally {
            out.flush();
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        PrintWriter out = resp.getWriter();
        String path = req.getServletPath();
        BookingManagementDAO dao = new BookingManagementDAO();

        // CREATE ONLINE APPOINTMENT (Customer)
        if ("/api/booking/online".equals(path)) {
            Map<String, Object> user = getSessionUser(req);
            if (user == null || !"Customer".equals(user.get("role"))) {
                resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
                out.print("{\"message\": \"Chỉ khách hàng đã đăng nhập mới có thể đặt lịch hẹn online!\"}");
                out.flush();
                return;
            }

            try {
                JsonObject body = gson.fromJson(req.getReader(), JsonObject.class);
                int accountId = extractAccountId(user);
                int customerId = dao.getCustomerIdByAccountId(accountId);

                if (customerId <= 0 && body.has("customerId") && !body.get("customerId").isJsonNull()) {
                    customerId = body.get("customerId").getAsInt();
                }
                if (customerId <= 0) {
                    resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"message\": \"Không tìm thấy hồ sơ khách hàng. Vui lòng cập nhật hồ sơ cá nhân trước!\"}");
                    return;
                }

                int serviceId = body.get("serviceId").getAsInt();
                String appointmentDate = body.get("appointmentDate").getAsString();
                String startTime = body.get("startTime").getAsString();

                Integer customerPackageId = (body.has("customerPackageId") && !body.get("customerPackageId").isJsonNull()
                        && !body.get("customerPackageId").getAsString().isEmpty())
                        ? body.get("customerPackageId").getAsInt() : null;

                Integer technicianId = (body.has("technicianId") && !body.get("technicianId").isJsonNull()
                        && !body.get("technicianId").getAsString().isEmpty())
                        ? body.get("technicianId").getAsInt() : null;

                String notes = (body.has("notes") && !body.get("notes").isJsonNull())
                        ? body.get("notes").getAsString() : null;

                Map<String, Object> result = dao.createOnlineAppointment(
                        customerId, serviceId, customerPackageId, appointmentDate, startTime, technicianId, notes
                );

                resp.setStatus(HttpServletResponse.SC_CREATED);
                out.print(gson.toJson(result));
            } catch (IllegalArgumentException e) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"" + e.getMessage() + "\"}");
            } catch (IllegalStateException e) {
                resp.setStatus(HttpServletResponse.SC_CONFLICT);
                out.print("{\"message\": \"" + e.getMessage() + "\"}");
            } catch (Exception e) {
                e.printStackTrace();
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"message\": \"Không thể tạo lịch hẹn online: " + e.getMessage() + "\"}");
            } finally {
                out.flush();
            }
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCorsHeaders(resp);
        PrintWriter out = resp.getWriter();
        String path = req.getServletPath();
        BookingManagementDAO dao = new BookingManagementDAO();

        Map<String, Object> user = getSessionUser(req);
        String role = user != null ? (String) user.get("role") : "";
        if (!"Receptionist".equals(role) && !"Manager".equals(role)) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            out.print("{\"message\": \"Chỉ Lễ tân hoặc Quản lý mới có quyền thực hiện thao tác này!\"}");
            out.flush();
            return;
        }

        try {
            JsonObject body = gson.fromJson(req.getReader(), JsonObject.class);

            // 3. CHECK-IN & STATUS UPDATE
            if ("/api/booking/checkin".equals(path)) {
                int appointmentId = body.get("appointmentId").getAsInt();
                String status = body.get("status").getAsString();
                String notes = (body.has("notes") && !body.get("notes").isJsonNull())
                        ? body.get("notes").getAsString() : null;

                boolean ok = dao.updateCheckInAndStatus(appointmentId, status, notes);
                if (ok) {
                    resp.setStatus(HttpServletResponse.SC_OK);
                    out.print("{\"message\": \"Cập nhật trạng thái lịch hẹn #" + appointmentId + " thành công!\"}");
                } else {
                    resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"message\": \"Không thể cập nhật trạng thái!\"}");
                }
                return;
            }

            // 4. COORDINATE SERVICE
            if ("/api/booking/coordinate".equals(path)) {
                int appointmentId = body.get("appointmentId").getAsInt();
                Integer technicianId = (body.has("technicianId") && !body.get("technicianId").isJsonNull()
                        && !body.get("technicianId").getAsString().isEmpty())
                        ? body.get("technicianId").getAsInt() : null;
                Integer roomId = (body.has("roomId") && !body.get("roomId").isJsonNull()
                        && !body.get("roomId").getAsString().isEmpty())
                        ? body.get("roomId").getAsInt() : null;
                Integer bedId = (body.has("bedId") && !body.get("bedId").isJsonNull()
                        && !body.get("bedId").getAsString().isEmpty())
                        ? body.get("bedId").getAsInt() : null;

                List<Integer> equipmentIds = new ArrayList<>();
                if (body.has("equipmentIds") && body.get("equipmentIds").isJsonArray()) {
                    JsonArray arr = body.getAsJsonArray("equipmentIds");
                    for (JsonElement el : arr) {
                        equipmentIds.add(el.getAsInt());
                    }
                }

                boolean ok = dao.coordinateAppointment(appointmentId, technicianId, roomId, bedId, equipmentIds);
                if (ok) {
                    resp.setStatus(HttpServletResponse.SC_OK);
                    out.print("{\"message\": \"Điều phối nhân sự & tài nguyên cho lịch hẹn #" + appointmentId + " thành công!\"}");
                } else {
                    resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"message\": \"Điều phối thất bại!\"}");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"" + e.getMessage() + "\"}");
        } finally {
            out.flush();
        }
    }
}
