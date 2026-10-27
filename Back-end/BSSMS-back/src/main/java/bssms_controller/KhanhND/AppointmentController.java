package bssms_controller.KhanhND;

import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import java.io.IOException;
import bssms_booking.Appointment;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.JsonObject;
import java.sql.SQLException;
import com.google.gson.Gson;

import bssms_persistence.KhanhND.AppointmentDAO;
public class AppointmentController extends ControllerSupport {

    private final Gson gson = new Gson();

    public void get(ActionRequest request,
            ActionResult response)
            throws IOException {
        bind(request);

        AppointmentDAO dao = use(new AppointmentDAO());

        String pathInfo = request.pathInfo();

        // GET /api/appointments
        if (pathInfo == null || pathInfo.equals("/")) {

            List<Appointment> appointmentList = dao.getAllAppointmentDetails();

            String jsonString = gson.toJson(appointmentList);

            PrintWriter out = response.writer();
            out.print(jsonString);
            out.flush();

            return;
        }

        try {

            int appointmentId = Integer.parseInt(pathInfo.substring(1));

            Appointment appointment = dao.getAppointmentDetails(appointmentId);

            if (appointment != null) {

                String jsonString = gson.toJson(appointment);

                PrintWriter out = response.writer();
                out.print(jsonString);
                out.flush();

            } else {

                response.status(404);

                Map<String, String> error = new HashMap<>();
                error.put("message", "Không tìm thấy lịch hẹn");

                PrintWriter out = response.writer();
                out.print(gson.toJson(error));
                out.flush();
            }

        } catch (NumberFormatException e) {

            response.status(400);

            Map<String, String> error = new HashMap<>();
            error.put("message", "Appointment ID không hợp lệ");

            PrintWriter out = response.writer();
            out.print(gson.toJson(error));
            out.flush();
        }
    }

    public void post(
            ActionRequest request,
            ActionResult response)
            throws IOException {
        bind(request);

        // Only POST /api/appointments is supported.
        String pathInfo = request.pathInfo();

        if (pathInfo != null && !pathInfo.equals("/")) {
            response.status(404);
            response.writer().write(
                    "{\"message\":\"Appointment endpoint not found.\"}");
            return;
        }

        try {
            JsonObject data = gson.fromJson(
                    request.bodyReader(), JsonObject.class);

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

                response.status(
                        400);

                response.writer().write(
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

            AppointmentDAO dao = use(new AppointmentDAO());

            Appointment result
                    = dao.createWalkInAppointment(
                            customerId,
                            serviceId,
                            customerPackageId,
                            appointmentDate,
                            startTime,
                            technicianId,
                            notes);

            response.status(201);
            response.writer().write(gson.toJson(result));

        } catch (IllegalArgumentException e) {

            response.status(400);

            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());

            response.writer().write(gson.toJson(error));

        } catch (IllegalStateException e) {

            response.status(409);

            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());

            response.writer().write(gson.toJson(error));

        } catch (SQLException e) {

            response.status(
                    500);

            response.writer().write(
                    "{\"message\":\"A database error occurred while creating the appointment.\"}");

        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);

            response.status(
                    400);

            response.writer().write(
                    "{\"message\":\"Invalid appointment data.\"}");
        }
    }

    public void put(
            ActionRequest request,
            ActionResult response)
            throws IOException {
        bind(request);

        String pathInfo = request.pathInfo();

        try {

            if (pathInfo == null || pathInfo.equals("/")) {

                response.status(
                        400
                );

                response.writer().write(
                        "{\"message\":\"Appointment ID không hợp lệ\"}"
                );

                return;
            }

            String[] pathParts = pathInfo.split("/");

            if (pathParts.length == 2) {

                int appointmentId = Integer.parseInt(pathParts[1]);

                Appointment data = gson.fromJson(
                        request.bodyReader(),
                        Appointment.class
                );

                String appointmentDate = data.getAppointmentDate();
                String startTime = data.getStartTime();
                String endTime = data.getEndTime();

                AppointmentDAO dao = use(new AppointmentDAO());

                boolean success = dao.rescheduleAppointment(
                        appointmentId,
                        appointmentDate,
                        startTime,
                        endTime
                );

                if (success) {

                    response.status(
                            200
                    );

                    response.writer().write(
                            "{\"message\":\"Reschedule appointment thành công\"}"
                    );

                } else {

                    response.status(
                            404
                    );

                    response.writer().write(
                            "{\"message\":\"Không tìm thấy appointment\"}"
                    );
                }

                return;
            }

            if (pathParts.length == 3
                    && pathParts[2].equals("cancel")) {

                int appointmentId = Integer.parseInt(pathParts[1]);

                AppointmentDAO dao = use(new AppointmentDAO());

                JsonObject cancelData=gson.fromJson(request.bodyReader(),JsonObject.class);
                if(cancelData==null || !cancelData.has("reason")) throw new IllegalArgumentException("Cancellation reason required.");
                boolean success = dao.cancelAppointment(appointmentId,cancelData.get("reason").getAsString());

                if (success) {

                    response.status(
                            200
                    );

                    response.writer().write(
                            "{\"message\":\"Cancel appointment thành công\"}"
                    );

                } else {

                    response.status(
                            400
                    );

                    response.writer().write(
                            "{\"message\":\"Không thể cancel appointment\"}"
                    );
                }

                return;
            }

            response.status(
                    400
            );

            response.writer().write(
                    "{\"message\":\"URL appointment không hợp lệ\"}"
            );

        } catch (NumberFormatException e) {

            response.status(
                    400
            );

            response.writer().write(
                    "{\"message\":\"Appointment ID không hợp lệ\"}"
            );

        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);

            response.status(
                    500
            );

            response.writer().write(
                    "{\"message\":\"Lỗi khi xử lý appointment\"}"
            );
        }
    }
}
