package bssms_api.KhanhND;

import java.io.BufferedReader;
import java.io.IOException;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import bssms_billing.InvoiceProduct;
import bssms_persistence.KhanhND.InvoiceDAO;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet(
        name = "InvoiceServlet",
        urlPatterns = {"/api/invoices", "/api/invoices/*"}
)
public class InvoiceServlet extends HttpServlet {

    private final Gson gson = new Gson();

    private String getApiPath(HttpServletRequest request) {
        return request.getRequestURI()
                .substring(request.getContextPath().length());
    }

    private void sendJson(
            HttpServletResponse response,
            int status,
            Object data
    ) throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(gson.toJson(data));
    }

    private void sendError(
            HttpServletResponse response,
            int status,
            String message
    ) throws IOException {
        Map<String, String> error = Map.of("message", message);
        sendJson(response, status, error);
    }

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ServletException, IOException {

        String path = getApiPath(request);

        try {
            InvoiceDAO dao = new InvoiceDAO();

            if (path.endsWith("/eligible-appointments")) {
                sendJson(
                        response,
                        HttpServletResponse.SC_OK,
                        dao.getCompletedAppointmentsWithoutInvoice()
                );
                return;
            }

            if (path.endsWith("/products")) {
                sendJson(
                        response,
                        HttpServletResponse.SC_OK,
                        dao.getActiveProducts()
                );
                return;
            }

            if (path.equals("/api/invoices") || path.equals("/api/invoices/")) {
                if (!isCurrentUserManager(request)) {
                    sendError(response, HttpServletResponse.SC_FORBIDDEN,
                            "Only Managers can view invoice management.");
                    return;
                }
                sendJson(response, HttpServletResponse.SC_OK, dao.getInvoices());
                return;
            }

            if (path.matches("/api/invoices/\\d+/?")) {
                if (!isCurrentUserManager(request)) {
                    sendError(response, HttpServletResponse.SC_FORBIDDEN,
                            "Only Managers can view invoice details.");
                    return;
                }
                String[] parts = path.split("/");
                int invoiceId;
                try {
                    invoiceId = Integer.parseInt(parts[3]);
                } catch (NumberFormatException ex) {
                    sendError(response, HttpServletResponse.SC_BAD_REQUEST,
                            "Invalid invoice ID.");
                    return;
                }
                try {
                    sendJson(response, HttpServletResponse.SC_OK,
                            dao.getInvoiceDetails(invoiceId));
                } catch (IllegalArgumentException ex) {
                    sendError(response, HttpServletResponse.SC_NOT_FOUND, ex.getMessage());
                }
                return;
            }

            sendError(
                    response,
                    HttpServletResponse.SC_NOT_FOUND,
                    "Invoice endpoint not found."
            );

        } catch (SQLException ex) {
            ex.printStackTrace();

            sendError(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Unable to load invoice data."
            );
        }
    }

    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ServletException, IOException {

        String path = getApiPath(request);
        request.setCharacterEncoding("UTF-8");

        if (path.matches("/api/invoices/\\d+/refund")) {
            if (!isCurrentUserManager(request)) {
                sendError(response, HttpServletResponse.SC_FORBIDDEN,
                        "Only Managers can refund invoices.");
                return;
            }
            handleRefund(request, response, path);
            return;
        }

        if (path.matches("/api/invoices/\\d+/cancel")) {
            if (!isCurrentUserManager(request)) {
                sendError(response, HttpServletResponse.SC_FORBIDDEN,
                        "Only Managers can cancel invoices.");
                return;
            }
            handleCancel(request, response, path);
            return;
        }

        if (!path.equals("/api/invoices")
                && !path.equals("/api/invoices/")) {
            sendError(
                    response,
                    HttpServletResponse.SC_NOT_FOUND,
                    "Invoice endpoint not found."
            );
            return;
        }

        try {
            StringBuilder body = new StringBuilder();

            try (BufferedReader reader = request.getReader()) {
                String line;

                while ((line = reader.readLine()) != null) {
                    body.append(line);
                }
            }

            JsonElement parsed = JsonParser.parseString(body.toString());

            if (!parsed.isJsonObject()) {
                throw new IllegalArgumentException(
                        "Request body must be a JSON object."
                );
            }

            JsonObject data = parsed.getAsJsonObject();

            int appointmentId = requireInt(data, "appointmentId");

            Integer voucherId = null;

            if (data.has("voucherId")
                    && !data.get("voucherId").isJsonNull()) {
                voucherId = requireInt(data, "voucherId");
            }

            BigDecimal manualDiscount = BigDecimal.ZERO;

            if (data.has("manualDiscount")
                    && !data.get("manualDiscount").isJsonNull()) {
                manualDiscount = requireDecimal(data, "manualDiscount");
            }

            if (!data.has("paymentMethod")
                    || data.get("paymentMethod").isJsonNull()) {
                throw new IllegalArgumentException(
                        "Payment method is required."
                );
            }

            String paymentMethod
                    = data.get("paymentMethod").getAsString();

            BigDecimal receivedAmount
                    = requireDecimal(data, "receivedAmount");

            List<InvoiceProduct> products = new ArrayList<>();

            if (data.has("productItems")
                    && !data.get("productItems").isJsonNull()) {

                JsonElement productsElement = data.get("productItems");

                if (!productsElement.isJsonArray()) {
                    throw new IllegalArgumentException(
                            "productItems must be an array."
                    );
                }

                JsonArray productArray = productsElement.getAsJsonArray();

                for (JsonElement element : productArray) {
                    if (!element.isJsonObject()) {
                        throw new IllegalArgumentException(
                                "Each product item must be a JSON object."
                        );
                    }

                    JsonObject productData = element.getAsJsonObject();

                    InvoiceProduct product = new InvoiceProduct();
                    product.setProductId(
                            requireInt(productData, "productId")
                    );
                    product.setQuantity(
                            requireInt(productData, "quantity")
                    );

                    products.add(product);
                }
            }

            InvoiceDAO dao = new InvoiceDAO();

            Map<String, Object> result
                    = dao.createInvoiceAndPayment(
                            appointmentId,
                            voucherId,
                            manualDiscount,
                            paymentMethod,
                            receivedAmount,
                            products
                    );

            sendJson(
                    response,
                    HttpServletResponse.SC_CREATED,
                    result
            );

        } catch (IllegalArgumentException ex) {
            sendError(
                    response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    ex.getMessage()
            );

        } catch (IllegalStateException ex) {
            sendError(
                    response,
                    HttpServletResponse.SC_CONFLICT,
                    ex.getMessage()
            );

        } catch (SQLException ex) {
            ex.printStackTrace();

            sendError(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Unable to create invoice and payment."
            );

        } catch (Exception ex) {
            sendError(
                    response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    "Invalid request data."
            );
        }
    }

    private int requireInt(JsonObject data, String key) {
        if (!data.has(key)
                || data.get(key).isJsonNull()
                || !data.get(key).isJsonPrimitive()
                || !data.get(key).getAsJsonPrimitive().isNumber()) {
            throw new IllegalArgumentException(
                    "Missing or invalid field: " + key
            );
        }

        try {
            return data.get(key).getAsInt();
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException(
                    "Invalid integer field: " + key
            );
        }
    }

    private BigDecimal requireDecimal(JsonObject data, String key) {
        if (!data.has(key)
                || data.get(key).isJsonNull()
                || !data.get(key).isJsonPrimitive()
                || !data.get(key).getAsJsonPrimitive().isNumber()) {
            throw new IllegalArgumentException(
                    "Missing or invalid field: " + key
            );
        }

        try {
            return new BigDecimal(data.get(key).getAsString());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(
                    "Invalid numeric field: " + key
            );
        }
    }

    private void handleRefund(
            HttpServletRequest request,
            HttpServletResponse response,
            String path) throws IOException {

        try {
            int invoiceId = extractInvoiceId(path);
            JsonObject data = JsonParser.parseString(
                    request.getReader().lines()
                            .collect(java.util.stream.Collectors.joining("\n"))
            ).getAsJsonObject();

            BigDecimal amount = requireDecimal(data, "amount");

            if (!data.has("reason")
                    || data.get("reason").isJsonNull()
                    || !data.get("reason").isJsonPrimitive()) {
                sendError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Refund reason is required.");
                return;
            }

            String reason = data.get("reason").getAsString().trim();

            if (reason.isEmpty()) {
                sendError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Refund reason is required.");
                return;
            }

            int accountId = getCurrentAccountId(request);

            InvoiceDAO dao = new InvoiceDAO();
            dao.refundInvoice(invoiceId, amount, reason, accountId);

            JsonObject result = new JsonObject();
            result.addProperty("message", "Invoice refund processed successfully.");
            result.addProperty("invoiceId", invoiceId);
            result.addProperty("amount", amount);
            sendJson(response, HttpServletResponse.SC_OK, result);

        } catch (IllegalArgumentException e) {
            sendError(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (IllegalStateException e) {
            sendError(response, HttpServletResponse.SC_CONFLICT, e.getMessage());
        } catch (SQLException e) {
            e.printStackTrace();
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Unable to process invoice refund.");
        } catch (Exception e) {
            e.printStackTrace();
            sendError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Invalid refund request.");
        }
    }

    private void handleCancel(
            HttpServletRequest request,
            HttpServletResponse response,
            String path) throws IOException {

        try {
            int invoiceId = extractInvoiceId(path);
            JsonObject data = JsonParser.parseString(
                    request.getReader().lines()
                            .collect(java.util.stream.Collectors.joining("\n"))
            ).getAsJsonObject();

            if (!data.has("reason")
                    || data.get("reason").isJsonNull()
                    || !data.get("reason").isJsonPrimitive()) {
                sendError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Cancellation reason is required.");
                return;
            }

            String reason = data.get("reason").getAsString().trim();

            if (reason.isEmpty()) {
                sendError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Cancellation reason is required.");
                return;
            }

            int accountId = getCurrentAccountId(request);

            InvoiceDAO dao = new InvoiceDAO();
            dao.cancelInvoice(invoiceId, reason, accountId);

            JsonObject result = new JsonObject();
            result.addProperty("message", "Invoice cancelled successfully.");
            result.addProperty("invoiceId", invoiceId);
            sendJson(response, HttpServletResponse.SC_OK, result);

        } catch (IllegalArgumentException e) {
            sendError(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (IllegalStateException e) {
            sendError(response, HttpServletResponse.SC_CONFLICT, e.getMessage());
        } catch (SQLException e) {
            e.printStackTrace();
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Unable to cancel invoice.");
        } catch (Exception e) {
            e.printStackTrace();
            sendError(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Invalid cancellation request.");
        }
    }

    private int extractInvoiceId(String path) {
        String[] parts = path.split("/");
        int invoiceId = Integer.parseInt(parts[3]);

        if (invoiceId <= 0) {
            throw new IllegalArgumentException("Invoice ID must be positive.");
        }

        return invoiceId;
    }

    @SuppressWarnings("unchecked")
    private boolean isCurrentUserManager(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute("user") instanceof Map)) {
            return false;
        }

        Map<String, Object> user = (Map<String, Object>) session.getAttribute("user");
        Object role = user.get("role");
        return role instanceof String && "Manager".equalsIgnoreCase(((String) role).trim());
    }

    @SuppressWarnings("unchecked")
    private int getCurrentAccountId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session == null || !(session.getAttribute("user") instanceof Map)) {
            throw new IllegalStateException("Please log in again.");
        }

        Map<String, Object> user
                = (Map<String, Object>) session.getAttribute("user");

        Object accountId = user.get("accountId");

        if (!(accountId instanceof Number)) {
            throw new IllegalStateException("Account information is missing.");
        }

        int id = ((Number) accountId).intValue();

        if (id <= 0) {
            throw new IllegalStateException("Invalid account information.");
        }

        return id;
    }

}