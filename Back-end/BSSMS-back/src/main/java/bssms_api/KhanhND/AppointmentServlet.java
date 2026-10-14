package bssms_api.KhanhND;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.JsonObject;
import java.sql.SQLException;
import com.google.gson.Gson;

import bssms_persistence.KhanhND.AppointmentDAO;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(name = "AppointmentServlet", urlPatterns = {"/api/appointments/*"})
public class AppointmentServlet extends HttpServlet {

    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        resp.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setHeader("Access-Control-Allow-Credentials", "true");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        setAccessControlHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        AppointmentDAO dao = new AppointmentDAO();

        String pathInfo = request.getPathInfo();

        // GET /api/appointments
        if (pathInfo == null || pathInfo.equals("/")) {

            List<Map<String, Object>> appointmentList = dao.getAllAppointmentDetails();

            String jsonString = gson.toJson(appointmentList);

            PrintWriter out = response.getWriter();
            out.print(jsonString);
            out.flush();

            return;
        }

        try {

            int appointmentId = Integer.parseInt(pathInfo.substring(1));

            Map<String, Object> appointment = dao.getAppointmentDetails(appointmentId);

            if (appointment != null) {

                String jsonString = gson.toJson(appointment);

                PrintWriter out = response.getWriter();
                out.print(jsonString);
                out.flush();

            } else {

                response.setStatus(HttpServletResponse.SC_NOT_FOUND);

                Map<String, String> error = new HashMap<>();
                error.put("message", "Không tìm thấy lịch hẹn");

                PrintWriter out = response.getWriter();
                out.print(gson.toJson(error));
                out.flush();
            }

        } catch (NumberFormatException e) {

            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);

            Map<String, String> error = new HashMap<>();
            error.put("message", "Appointment ID không hợp lệ");

            PrintWriter out = response.getWriter();
            out.print(gson.toJson(error));
            out.flush();
        }
    }

    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        setAccessControlHeaders(response);
        request.setCharacterEncoding("UTF-8");

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        // Only POST /api/appointments is supported.
        String pathInfo = request.getPathInfo();

        if (pathInfo != null && !pathInfo.equals("/")) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.getWriter().write(
                    "{\"message\":\"Appointment endpoint not found.\"}");
            return;
        }

        try {
            JsonObject data = gson.fromJson(
                    request.getReader(), JsonObject.class);

            // Validate required fields.
            if (data == null
                    || !data.has("customerId")
                    || data.get("customerId").isJsonNull()
                    || !data.has("serviceId")
                    || data.get("serviceId").isJsonNull()
                    || !data.has("appointmentDate")
                    || data.get("appointmentDate").isJsonNull()
                    || !data.has("startTime")
                    || data.get("startTime").isJsonNull()) {

                response.setStatus(
                        HttpServletResponse.SC_BAD_REQUEST);

                response.getWriter().write(
                        "{\"message\":\"Please provide customer, service, date and start time.\"}");
                return;
            }

            int customerId = data.get("customerId").getAsInt();
            int serviceId = data.get("serviceId").getAsInt();

            String appointmentDate
                    = data.get("appointmentDate").getAsString();

            String startTime
                    = data.get("startTime").getAsString();

            Integer technicianId = null;

            if (data.has("technicianId")
                    && !data.get("technicianId").isJsonNull()
                    && !data.get("technicianId").getAsString().isBlank()) {

                technicianId = data.get("technicianId").getAsInt();

                if (technicianId <= 0) {
                    technicianId = null;
                }
            }

            Integer customerPackageId = null;

            if (data.has("customerPackageId")
                    && !data.get("customerPackageId").isJsonNull()
                    && !data.get("customerPackageId").getAsString().isBlank()) {

                customerPackageId
                        = data.get("customerPackageId").getAsInt();
            }

            String notes = null;

            if (data.has("notes") && !data.get("notes").isJsonNull()) {
                notes = data.get("notes").getAsString();
            }

            AppointmentDAO dao = new AppointmentDAO();

            Map<String, Object> result
                    = dao.createWalkInAppointment(
                            customerId,
                            serviceId,
                            customerPackageId,
                            appointmentDate,
                            startTime,
                            technicianId,
                            notes);

            response.setStatus(HttpServletResponse.SC_CREATED);
            response.getWriter().write(gson.toJson(result));

        } catch (IllegalArgumentException e) {

            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);

            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());

            response.getWriter().write(gson.toJson(error));

        } catch (IllegalStateException e) {

            response.setStatus(HttpServletResponse.SC_CONFLICT);

            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());

            response.getWriter().write(gson.toJson(error));

        } catch (SQLException e) {

            e.printStackTrace();

            response.setStatus(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR);

            response.getWriter().write(
                    "{\"message\":\"A database error occurred while creating the appointment.\"}");

        } catch (Exception e) {

            e.printStackTrace();

            response.setStatus(
                    HttpServletResponse.SC_BAD_REQUEST);

            response.getWriter().write(
                    "{\"message\":\"Invalid appointment data.\"}");
        }
    }

    @Override
    protected void doPut(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        setAccessControlHeaders(response);

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String pathInfo = request.getPathInfo();

        try {

            if (pathInfo == null || pathInfo.equals("/")) {

                response.setStatus(
                        HttpServletResponse.SC_BAD_REQUEST
                );

                response.getWriter().write(
                        "{\"message\":\"Appointment ID không hợp lệ\"}"
                );

                return;
            }

            String[] pathParts = pathInfo.split("/");

            if (pathParts.length == 2) {

                int appointmentId = Integer.parseInt(pathParts[1]);

                Map<String, String> data = gson.fromJson(
                        request.getReader(),
                        Map.class
                );

                String appointmentDate = data.get("appointmentDate");
                String startTime = data.get("startTime");
                String endTime = data.get("endTime");

                AppointmentDAO dao = new AppointmentDAO();

                boolean success = dao.rescheduleAppointment(
                        appointmentId,
                        appointmentDate,
                        startTime,
                        endTime
                );

                if (success) {

                    response.setStatus(
                            HttpServletResponse.SC_OK
                    );

                    response.getWriter().write(
                            "{\"message\":\"Reschedule appointment thành công\"}"
                    );

                } else {

                    response.setStatus(
                            HttpServletResponse.SC_NOT_FOUND
                    );

                    response.getWriter().write(
                            "{\"message\":\"Không tìm thấy appointment\"}"
                    );
                }

                return;
            }

            if (pathParts.length == 3
                    && pathParts[2].equals("cancel")) {

                int appointmentId = Integer.parseInt(pathParts[1]);

                AppointmentDAO dao = new AppointmentDAO();

                boolean success = dao.cancelAppointment(
                        appointmentId
                );

                if (success) {

                    response.setStatus(
                            HttpServletResponse.SC_OK
                    );

                    response.getWriter().write(
                            "{\"message\":\"Cancel appointment thành công\"}"
                    );

                } else {

                    response.setStatus(
                            HttpServletResponse.SC_BAD_REQUEST
                    );

                    response.getWriter().write(
                            "{\"message\":\"Không thể cancel appointment\"}"
                    );
                }

                return;
            }

            response.setStatus(
                    HttpServletResponse.SC_BAD_REQUEST
            );

            response.getWriter().write(
                    "{\"message\":\"URL appointment không hợp lệ\"}"
            );

        } catch (NumberFormatException e) {

            response.setStatus(
                    HttpServletResponse.SC_BAD_REQUEST
            );

            response.getWriter().write(
                    "{\"message\":\"Appointment ID không hợp lệ\"}"
            );

        } catch (Exception e) {

            e.printStackTrace();

            response.setStatus(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );

            response.getWriter().write(
                    "{\"message\":\"Lỗi khi xử lý appointment\"}"
            );
        }
    }
}
