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
import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet(
        name = "MembershipTierServlet",
        urlPatterns = {"/api/membership-tiers"}
)
public class MembershipTierServlet extends HttpServlet {

    private final Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse response) {
        response.setHeader(
                "Access-Control-Allow-Origin",
                "http://localhost:5173"
        );
        response.setHeader(
                "Access-Control-Allow-Methods",
                "GET, POST, PUT, DELETE, OPTIONS"
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

    private String getSessionRole(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("user") == null) {
            sendMessage(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Authentication required."
            );
            return null;
        }

        Object sessionUser = session.getAttribute("user");

        if (!(sessionUser instanceof Map)) {
            sendMessage(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Invalid session."
            );
            return null;
        }

        Map<?, ?> user = (Map<?, ?>) sessionUser;
        Object role = user.get("role");

        if (role == null) {
            sendMessage(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "User role is missing."
            );
            return null;
        }

        return String.valueOf(role);
    }

    private boolean isManager(
            String role,
            HttpServletResponse response
    ) throws IOException {

        if (!"Manager".equals(role)) {
            sendMessage(
                    response,
                    HttpServletResponse.SC_FORBIDDEN,
                    "Only Manager can manage membership tiers."
            );
            return false;
        }

        return true;
    }

    private int getTierId(HttpServletRequest request) {
        String id = request.getParameter("id");

        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Membership tier ID is required."
            );
        }

        try {
            int tierId = Integer.parseInt(id);

            if (tierId <= 0) {
                throw new IllegalArgumentException(
                        "Membership tier ID must be positive."
                );
            }

            return tierId;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(
                    "Membership tier ID must be a valid integer."
            );
        }
    }

    private MembershipTierInput readTierInput(
            HttpServletRequest request
    ) throws IOException {

        JsonObject body;

        try {
            body = gson.fromJson(
                    request.getReader(),
                    JsonObject.class
            );
        } catch (JsonParseException e) {
            throw new IllegalArgumentException(
                    "Request body must contain valid JSON."
            );
        }

        if (body == null) {
            throw new IllegalArgumentException(
                    "Request body is required."
            );
        }

        String tierName = readString(body, "tierName");
        String description = readString(body, "description");

        BigDecimal discountPercent = readDecimal(
                body,
                "discountPercent"
        );

        BigDecimal minSpending = readDecimal(
                body,
                "minSpending"
        );

        if (tierName == null || tierName.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Tier name is required."
            );
        }

        if (discountPercent.compareTo(BigDecimal.ZERO) < 0
                || discountPercent.compareTo(
                        new BigDecimal("100")
                ) > 0) {

            throw new IllegalArgumentException(
                    "Discount percent must be between 0 and 100."
            );
        }

        if (minSpending.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Minimum spending cannot be negative."
            );
        }

        MembershipTierInput input = new MembershipTierInput();
        input.tierName = tierName.trim();
        input.description = description == null
                ? ""
                : description.trim();
        input.discountPercent = discountPercent;
        input.minSpending = minSpending;

        return input;
    }

    private String readString(
            JsonObject body,
            String field
    ) {
        if (!body.has(field) || body.get(field).isJsonNull()) {
            return null;
        }

        return body.get(field).getAsString();
    }

    private BigDecimal readDecimal(
            JsonObject body,
            String field
    ) {

        if (!body.has(field) || body.get(field).isJsonNull()) {
            throw new IllegalArgumentException(
                    field + " is required."
            );
        }

        try {
            return new BigDecimal(
                    body.get(field).getAsString()
            );
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(
                    field + " must be a valid number."
            );
        }
    }

    private static class MembershipTierInput {

        String tierName;
        String description;
        BigDecimal discountPercent;
        BigDecimal minSpending;
    }

    @Override
    protected void doOptions(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ServletException, IOException {

        setAccessControlHeaders(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    // GET /api/membership-tiers
    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ServletException, IOException {

        setAccessControlHeaders(response);

        String role = getSessionRole(request, response);

        if (role == null) {
            return;
        }

        List<String> allowedRoles = Arrays.asList(
                "Customer",
                "Receptionist",
                "Manager"
        );

        if (!allowedRoles.contains(role)) {
            sendMessage(
                    response,
                    HttpServletResponse.SC_FORBIDDEN,
                    "Access denied."
            );
            return;
        }

        try {
            MembershipTierDAO dao = new MembershipTierDAO();

            sendJson(
                    response,
                    HttpServletResponse.SC_OK,
                    dao.getAllMembershipTiers()
            );
        } catch (SQLException e) {
            e.printStackTrace();

            sendMessage(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Unable to load membership tiers."
            );
        }
    }

    // POST /api/membership-tiers
    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ServletException, IOException {

        setAccessControlHeaders(response);

        String role = getSessionRole(request, response);

        if (role == null || !isManager(role, response)) {
            return;
        }

        try {
            MembershipTierInput input = readTierInput(request);

            MembershipTierDAO dao = new MembershipTierDAO();

            int newId = dao.createMembershipTier(
                    input.tierName,
                    input.description,
                    input.discountPercent,
                    input.minSpending
            );

            Map<String, Object> result = new HashMap<>();
            result.put("message", "Membership tier created successfully.");
            result.put("membershipTierId", newId);

            sendJson(
                    response,
                    HttpServletResponse.SC_CREATED,
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
                    "Unable to create membership tier."
            );
        }
    }

    // PUT /api/membership-tiers?id=1
    @Override
    protected void doPut(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ServletException, IOException {

        setAccessControlHeaders(response);

        String role = getSessionRole(request, response);

        if (role == null || !isManager(role, response)) {
            return;
        }

        try {
            int tierId = getTierId(request);
            MembershipTierInput input = readTierInput(request);

            MembershipTierDAO dao = new MembershipTierDAO();

            boolean updated = dao.updateMembershipTier(
                    tierId,
                    input.tierName,
                    input.description,
                    input.discountPercent,
                    input.minSpending
            );

            if (!updated) {
                sendMessage(
                        response,
                        HttpServletResponse.SC_NOT_FOUND,
                        "Membership tier not found."
                );
                return;
            }

            sendMessage(
                    response,
                    HttpServletResponse.SC_OK,
                    "Membership tier updated successfully."
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
                    "Unable to update membership tier."
            );
        }
    }

    // DELETE /api/membership-tiers?id=1
    @Override
    protected void doDelete(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ServletException, IOException {

        setAccessControlHeaders(response);

        String role = getSessionRole(request, response);

        if (role == null || !isManager(role, response)) {
            return;
        }

        try {
            int tierId = getTierId(request);

            MembershipTierDAO dao = new MembershipTierDAO();

            boolean deleted = dao.deleteMembershipTier(tierId);

            if (!deleted) {
                sendMessage(
                        response,
                        HttpServletResponse.SC_NOT_FOUND,
                        "Membership tier not found."
                );
                return;
            }

            sendMessage(
                    response,
                    HttpServletResponse.SC_OK,
                    "Membership tier deleted successfully."
            );

        } catch (IllegalArgumentException e) {
            sendMessage(
                    response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    e.getMessage()
            );
        } catch (SQLException e) {
            e.printStackTrace();

            if ("23000".equals(e.getSQLState())
                    || e.getErrorCode() == 547) {

                sendMessage(
                        response,
                        HttpServletResponse.SC_CONFLICT,
                        "Cannot delete this tier because it may be used "
                        + "by existing customers."
                );
            } else {
                sendMessage(
                        response,
                        HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                        "Unable to delete membership tier."
                );
            }
        }
    }
}