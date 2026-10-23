package bssms_api.KhanhND;

import bssms_persistence.KhanhND.MembershipTierDAO;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

@WebServlet(
        name = "MembershipTierTransferServlet",
        urlPatterns = {"/api/membership-tiers/transfer"}
)
public class MembershipTierTransferServlet extends HttpServlet {

    private final Gson gson = new Gson();

    private void setAccessControlHeaders(
            HttpServletResponse response
    ) {
        response.setHeader(
                "Access-Control-Allow-Origin",
                "http://localhost:5173"
        );
        response.setHeader(
                "Access-Control-Allow-Methods",
                "GET, POST, OPTIONS"
        );
        response.setHeader(
                "Access-Control-Allow-Headers",
                "Content-Type"
        );
        response.setHeader(
                "Access-Control-Allow-Credentials",
                "true"
        );
    }

    private void sendJson(
            HttpServletResponse response,
            int status,
            Object data
    ) throws IOException {

        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().print(gson.toJson(data));
    }

    private void sendMessage(
            HttpServletResponse response,
            int status,
            String message
    ) throws IOException {

        Map<String, String> result = new HashMap<>();
        result.put("message", message);
        sendJson(response, status, result);
    }

    private boolean requireManager(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        HttpSession session = request.getSession(false);

        if (session == null
                || session.getAttribute("user") == null) {

            sendMessage(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Authentication required."
            );
            return false;
        }

        Object sessionUser = session.getAttribute("user");

        if (!(sessionUser instanceof Map)) {
            sendMessage(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Invalid session."
            );
            return false;
        }

        Map<?, ?> user = (Map<?, ?>) sessionUser;
        Object role = user.get("role");

        if (!"Manager".equals(role)) {
            sendMessage(
                    response,
                    HttpServletResponse.SC_FORBIDDEN,
                    "Only Manager can transfer customers between tiers."
            );
            return false;
        }

        return true;
    }

    private int parsePositiveId(
            String value,
            String fieldName
    ) {

        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    fieldName + " is required."
            );
        }

        try {
            int id = Integer.parseInt(value.trim());

            if (id <= 0) {
                throw new IllegalArgumentException(
                        fieldName + " must be positive."
                );
            }

            return id;

        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(
                    fieldName + " must be a valid integer."
            );
        }
    }

    private int readId(
            JsonObject body,
            String fieldName
    ) {

        if (body == null
                || !body.has(fieldName)
                || body.get(fieldName).isJsonNull()) {

            throw new IllegalArgumentException(
                    fieldName + " is required."
            );
        }

        try {
            return parsePositiveId(
                    body.get(fieldName).getAsString(),
                    fieldName
            );
        } catch (UnsupportedOperationException
                | IllegalStateException e) {

            throw new IllegalArgumentException(
                    fieldName + " must be a valid integer."
            );
        }
    }

    private JsonObject readRequestBody(
            HttpServletRequest request
    ) throws IOException {

        try {
            JsonObject body = gson.fromJson(
                    request.getReader(),
                    JsonObject.class
            );

            if (body == null) {
                throw new IllegalArgumentException(
                        "Request body is required."
                );
            }

            return body;

        } catch (JsonParseException e) {
            throw new IllegalArgumentException(
                    "Request body must contain valid JSON."
            );
        }
    }

    // GET /api/membership-tiers/transfer
    //     ?sourceTierId=1&targetTierId=2
    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ServletException, IOException {

        setAccessControlHeaders(response);

        if (!requireManager(request, response)) {
            return;
        }

        try {
            int sourceTierId = parsePositiveId(
                    request.getParameter("sourceTierId"),
                    "sourceTierId"
            );

            int targetTierId = parsePositiveId(
                    request.getParameter("targetTierId"),
                    "targetTierId"
            );

            MembershipTierDAO dao = new MembershipTierDAO();

            Map<String, Object> preview
                    = dao.getTierTransferPreview(
                            sourceTierId,
                            targetTierId
                    );

            if (preview == null) {
                sendMessage(
                        response,
                        HttpServletResponse.SC_NOT_FOUND,
                        "Source or target membership tier not found."
                );
                return;
            }

            sendJson(
                    response,
                    HttpServletResponse.SC_OK,
                    preview
            );

        } catch (IllegalArgumentException e) {
            sendMessage(
                    response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    e.getMessage()
            );

        } catch (SQLException e) {
            e.printStackTrace();

            sendMessage(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Unable to preview membership tier transfer."
            );
        }
    }

    // POST /api/membership-tiers/transfer
    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ServletException, IOException {

        setAccessControlHeaders(response);

        if (!requireManager(request, response)) {
            return;
        }

        try {
            JsonObject body = readRequestBody(request);

            int sourceTierId = readId(
                    body,
                    "sourceTierId"
            );

            int targetTierId = readId(
                    body,
                    "targetTierId"
            );

            if (sourceTierId == targetTierId) {
                throw new IllegalArgumentException(
                        "Source and target tiers must be different."
                );
            }

            MembershipTierDAO dao = new MembershipTierDAO();

            int transferredCustomers
                    = dao.transferCustomersToTier(
                            sourceTierId,
                            targetTierId
                    );

            Map<String, Object> result = new HashMap<>();

            result.put(
                    "message",
                    "Customer membership tiers transferred successfully."
            );
            result.put(
                    "sourceTierId",
                    sourceTierId
            );
            result.put(
                    "targetTierId",
                    targetTierId
            );
            result.put(
                    "transferredCustomers",
                    transferredCustomers
            );

            sendJson(
                    response,
                    HttpServletResponse.SC_OK,
                    result
            );

        } catch (IllegalArgumentException e) {
            sendMessage(
                    response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    e.getMessage()
            );

        } catch (SQLException e) {
            e.printStackTrace();

            sendMessage(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Unable to transfer customers. No transfer was "
                    + "completed if the transaction was rolled back."
            );
        }
    }

    @Override
    protected void doOptions(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ServletException, IOException {

        setAccessControlHeaders(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }
}
