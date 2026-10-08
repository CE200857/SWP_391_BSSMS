package bssms_api.KhanhND;

import bssms_persistence.KhanhND.AppointmentDAO;
import com.google.gson.Gson;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.HashMap;

@WebServlet(name = "AppointmentServlet", urlPatterns = {"/api/appointments/*"})
public class AppointmentServlet extends HttpServlet {

    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        resp.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
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

            List<Map<String, Object>> appointmentList
                    = dao.getAllAppointmentDetails();

            String jsonString = gson.toJson(appointmentList);

            PrintWriter out = response.getWriter();
            out.print(jsonString);
            out.flush();

            return;
        }

        try {

            int appointmentId
                    = Integer.parseInt(pathInfo.substring(1));

            Map<String, Object> appointment
                    = dao.getAppointmentDetails(appointmentId);

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
