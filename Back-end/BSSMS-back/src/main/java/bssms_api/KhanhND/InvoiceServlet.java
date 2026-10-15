package bssms_api.KhanhND;

import bssms_billing.InvoiceProduct;
import bssms_persistence.KhanhND.InvoiceDAO;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

        if (!path.equals("/api/invoices")
                && !path.equals("/api/invoices/")) {
            sendError(
                    response,
                    HttpServletResponse.SC_NOT_FOUND,
                    "Invoice endpoint not found."
            );
            return;
        }

        request.setCharacterEncoding("UTF-8");

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
}
