package bssms_controller.KhanhND;

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

        String path = getApiPath(request);

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

            InvoiceDAO dao = use(new InvoiceDAO());

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
}
