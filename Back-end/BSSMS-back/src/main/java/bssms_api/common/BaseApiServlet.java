package bssms_api.common;

import bssms_account.Account;
import bssms_common.SessionUsers;
import bssms_controller.DatTT.ControllerException;
import bssms_controller.DatTT.ServiceController.NotFoundException;
import com.google.gson.Gson;
import com.google.gson.JsonParseException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.sql.SQLException;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.Map;

/** Shared transport helpers only; no SQL or application rules. */
public abstract class BaseApiServlet extends HttpServlet {
    private final Gson gson = new Gson();
    @FunctionalInterface
    protected interface Action { Object run() throws Exception; }

    private void prepare(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
    }
    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) {
        prepare(response);
        response.setStatus(200);
    }
    protected void handle(HttpServletRequest request, HttpServletResponse response,
            int success, Action action) throws IOException {
        prepare(response);
        request.setCharacterEncoding("UTF-8");
        Object result;
        try {
            result = action.run();
        } catch (bssms_persistence.common.WorkflowException e) {
            error(response,e.status,e.getMessage()); return;
        } catch (ControllerException e) {
            error(response, e.getStatus(), e.getMessage()); return;
        } catch (NotFoundException e) {
            error(response, 404, e.getMessage()); return;
        } catch (JsonParseException | DateTimeParseException e) {
            error(response, 400, "Invalid JSON, field type, date or time."); return;
        } catch (IllegalArgumentException e) {
            error(response, 400, e.getMessage()); return;
        } catch (IllegalStateException e) {
            error(response, 409, e.getMessage()); return;
        } catch (SQLException e) {
            log("DatTT database operation failed", e);
            int code = e.getErrorCode();
            error(response, code == 547 || code == 2601 || code == 2627 ? 409 : 500,
                    code == 547 || code == 2601 || code == 2627
                    ? "Operation conflicts with existing data or database constraints."
                    : "Unable to access data. Please try again."); return;
        } catch (Exception e) {
            log("DatTT operation failed", e);
            error(response, 500, "Unable to process request. Please try again."); return;
        }
        response.setStatus(success);
        if (result != null) response.getWriter().write(gson.toJson(result));
    }
    private void error(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.getWriter().write(gson.toJson(message(message)));
    }
    protected static Map<String, String> message(String text) {
        return Collections.singletonMap("message", text);
    }
    protected <T> T body(HttpServletRequest request, Class<T> type) throws IOException {
        T value = gson.fromJson(request.getReader(), type);
        if (value == null) throw new IllegalArgumentException("Request body is required.");
        return value;
    }
    protected int id(HttpServletRequest request, String name) {
        String value = request.getParameter(name);
        try {
            int number = Integer.parseInt(value);
            if (number <= 0) throw new NumberFormatException();
            return number;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(name + " must be a positive integer.");
        }
    }
    protected Integer optionalId(HttpServletRequest request, String name) {
        String value = request.getParameter(name);
        return value == null || value.isEmpty() ? null : id(request, name);
    }
    @SuppressWarnings("unchecked")
    protected Account user(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        Object value = session == null ? null : session.getAttribute("user");
        return SessionUsers.from(value);
    }
    protected Object unsupported() { throw new ControllerException(405, "Method not supported for this endpoint."); }
}
