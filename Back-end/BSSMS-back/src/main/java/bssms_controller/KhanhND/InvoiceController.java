package bssms_controller.KhanhND;

import bssms_account.Account;
import bssms_common.SessionUsers;
import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import bssms_billing.InvoiceProduct;
import bssms_persistence.KhanhND.InvoiceDAO;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.BufferedReader;
import java.io.IOException;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class InvoiceController extends ControllerSupport {

    private final Gson gson = new Gson();

    private String getApiPath(ActionRequest request) {
        return request.uri()
                .substring(request.contextPath().length());
    }

    private void sendJson(
            ActionResult response,
            int status,
            Object data
    ) throws IOException {
        response.status(status);

        response.writer().write(gson.toJson(data));
    }

    private void sendError(
            ActionResult response,
            int status,
            String message
    ) throws IOException {
        Map<String, String> error = Map.of("message", message);
        sendJson(response, status, error);
    }

    public void get(
            ActionRequest request,
            ActionResult response
    ) throws IOException {
        bind(request);

        String path = getApiPath(request);

        try {
            InvoiceDAO dao = use(new InvoiceDAO());

            if (path.endsWith("/eligible-appointments")) {
                sendJson(
                        response,
                        200,
                        dao.getCompletedAppointmentsWithoutInvoice()
                );
                return;
            }

            if (path.endsWith("/products")) {
                sendJson(
                        response,
                        200,
                        dao.getActiveProducts()
                );
                return;
            }

            if (path.equals("/api/invoices") || path.equals("/api/invoices/")) {

                sendJson(response, 200, dao.getInvoices());
                return;
            }

            if (path.matches("/api/invoices/\\d+/?")) {

                int invoiceId;
                try {
                    invoiceId = Integer.parseInt(path.split("/")[3]);
                } catch (NumberFormatException ex) {
                    sendError(response, 400, "Invalid invoice ID.");
                    return;
                }
                try {
                    sendJson(response, 200, dao.getInvoiceDetails(invoiceId));
                } catch (IllegalArgumentException ex) {
                    sendError(response, 404, ex.getMessage());
                }
                return;
            }

            sendError(
                    response,
                    404,
                    "Invoice endpoint not found."
            );

        } catch (SQLException ex) {

            sendError(
                    response,
                    500,
                    "Unable to load invoice data."
            );
        }
    }

    public void post(
            ActionRequest request,
            ActionResult response
    ) throws IOException {
        bind(request);

        String path = getApiPath(request);
        if(path.matches("/api/invoices/\\d+/payments/?") || path.matches("/api/invoices/refunds/\\d+/complete/?")) {
            try {
                JsonObject data=JsonParser.parseReader(request.bodyReader()).getAsJsonObject();
                InvoiceDAO dao=use(new InvoiceDAO());
                if(path.contains("/refunds/")) {
                    if(!data.has("confirmedReturned") || !data.get("confirmedReturned").getAsBoolean()) throw new IllegalArgumentException("Confirm that money has been returned.");
                    sendJson(response,200,dao.completeRefund(Integer.parseInt(path.split("/")[4])));
                } else sendJson(response,200,dao.pay(Integer.parseInt(path.split("/")[3]),data.get("paymentMethod").getAsString(),requireDecimal(data,"receivedAmount"),data.get("requestKey").getAsString(),data.has("transactionCode")?data.get("transactionCode").getAsString():null));
            } catch(SQLException ex) {throw new DataAccessException(ex);}
            return;
        }

        if (path.matches("/api/invoices/\\d+/refund")) {
            if (!isCurrentUserManager(request)) {
                sendError(response, 403,
                        "Only Managers can refund invoices.");
                return;
            }
            handleRefund(request, response, path);
            return;
        }

        if (path.matches("/api/invoices/\\d+/cancel")) {
            if (!isCurrentUserManager(request)) {
                sendError(response, 403,
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
                    404,
                    "Invoice endpoint not found."
            );
            return;
        }

        try {
            StringBuilder body = new StringBuilder();

            try (BufferedReader reader = request.bodyReader()) {
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

            Integer appointmentId = optionalInt(data,"appointmentId");
            Integer customerId = optionalInt(data,"customerId");
            Integer packageId = optionalInt(data,"treatmentPackageId");
            boolean birthday=data.has("useBirthday") && data.get("useBirthday").getAsBoolean();

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

            if(manualDiscount.signum()!=0) throw new IllegalArgumentException("Manual discounts are not supported by the new policy.");
            String paymentMethod=data.has("paymentMethod")&&!data.get("paymentMethod").isJsonNull()?data.get("paymentMethod").getAsString():null;
            BigDecimal receivedAmount=paymentMethod==null?null:requireDecimal(data,"receivedAmount");
            String requestKey=data.has("requestKey")?data.get("requestKey").getAsString():null;

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

            InvoiceDAO dao = use(new InvoiceDAO());

            Map<String, Object> result
                    = dao.create(customerId,appointmentId,packageId,voucherId,birthday,products,paymentMethod,receivedAmount,requestKey);

            sendJson(
                    response,
                    201,
                    result
            );

        } catch (IllegalArgumentException ex) {
            sendError(
                    response,
                    400,
                    ex.getMessage()
            );

        } catch (IllegalStateException ex) {
            sendError(
                    response,
                    409,
                    ex.getMessage()
            );

        } catch (SQLException ex) {

            sendError(
                    response,
                    500,
                    "Unable to create invoice and payment."
            );

        } catch (Exception ex) {
            DataAccessException.rethrowIfDatabase(ex);
            InputValidation.rethrowIfInvalid(ex);
            sendError(
                    response,
                    400,
                    "Invalid request data."
            );
        }
    }

    private void handleRefund(
            ActionRequest request,
            ActionResult response,
            String path
    ) throws IOException {
        try {
            int invoiceId = extractInvoiceId(path);
            JsonObject data = JsonParser.parseString(
                    request.bodyReader().lines()
                            .collect(java.util.stream.Collectors.joining("\n"))
            ).getAsJsonObject();
            BigDecimal amount = requireDecimal(data, "amount");

            String reason = requireReason(data, "Refund reason is required.");
            int accountId = getCurrentAccountId(request);

            InvoiceDAO dao = use(new InvoiceDAO());
            sendJson(response,202,dao.refundInvoice(invoiceId, amount, reason, accountId));
        } catch (IllegalArgumentException ex) {
            sendError(response, 400, ex.getMessage());
        } catch (IllegalStateException ex) {
            sendError(response, 409, ex.getMessage());
        } catch (SQLException ex) {
            sendError(response, 500, "Unable to process invoice refund.");
        } catch (Exception ex) {
            DataAccessException.rethrowIfDatabase(ex);
            InputValidation.rethrowIfInvalid(ex);
            sendError(response, 400, "Invalid refund request.");
        }
    }

    private void handleCancel(
            ActionRequest request,
            ActionResult response,
            String path
    ) throws IOException {
        try {
            int invoiceId = extractInvoiceId(path);
            JsonObject data = JsonParser.parseString(
                    request.bodyReader().lines()
                            .collect(java.util.stream.Collectors.joining("\n"))
            ).getAsJsonObject();
            String reason = requireReason(data, "Cancellation reason is required.");
            int accountId = getCurrentAccountId(request);

            InvoiceDAO dao = use(new InvoiceDAO());
            dao.cancelInvoice(invoiceId, reason, accountId);

            JsonObject result = new JsonObject();
            result.addProperty("message", "Invoice cancelled successfully.");
            result.addProperty("invoiceId", invoiceId);
            sendJson(response, 200, result);
        } catch (IllegalArgumentException ex) {
            sendError(response, 400, ex.getMessage());
        } catch (IllegalStateException ex) {
            sendError(response, 409, ex.getMessage());
        } catch (SQLException ex) {
            sendError(response, 500, "Unable to cancel invoice.");
        } catch (Exception ex) {
            DataAccessException.rethrowIfDatabase(ex);
            InputValidation.rethrowIfInvalid(ex);
            sendError(response, 400, "Invalid cancellation request.");
        }
    }

    private String requireReason(JsonObject data, String message) {
        if (!data.has("reason")
                || data.get("reason").isJsonNull()
                || !data.get("reason").isJsonPrimitive()) {
            throw new IllegalArgumentException(message);
        }

        String reason = data.get("reason").getAsString().trim();
        if (reason.isEmpty()) {
            throw new IllegalArgumentException(message);
        }
        return reason;
    }

    private int extractInvoiceId(String path) {
        int invoiceId = Integer.parseInt(path.split("/")[3]);
        if (invoiceId <= 0) {
            throw new IllegalArgumentException("Invoice ID must be positive.");
        }
        return invoiceId;
    }

    private boolean isCurrentUserManager(ActionRequest request) {
        SessionState session = request.session(false);
        if (session == null || SessionUsers.from(session.get("user")) == null) {
            return false;
        }

        Object role = SessionUsers.from(session.get("user")).getRole();
        return role instanceof String
                && "Manager".equalsIgnoreCase(((String) role).trim());
    }

    private int getCurrentAccountId(ActionRequest request) {
        SessionState session = request.session(false);
        if (session == null || SessionUsers.from(session.get("user")) == null) {
            throw new IllegalStateException("Please log in again.");
        }

        Object accountId = SessionUsers.from(session.get("user")).getAccountId();
        if (!(accountId instanceof Number)) {
            throw new IllegalStateException("Account information is missing.");
        }

        int id = ((Number) accountId).intValue();
        if (id <= 0) {
            throw new IllegalStateException("Invalid account information.");
        }
        return id;
    }

    private Integer optionalInt(JsonObject data,String key) {
        return !data.has(key)||data.get(key).isJsonNull()?null:requireInt(data,key);
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
            return data.get(key).getAsBigDecimal().intValueExact();
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
}
