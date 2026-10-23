package bssms_persistence.KhanhND;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import bssms_billing.InvoiceProduct;
import bssms_persistence.DBContext;

//Handles invoice creation, product details, and front-desk payments.
public class InvoiceDAO extends DBContext {

    // Returns invoice rows for the Manager invoice-management screen.
    public List<Map<String, Object>> getInvoices() throws SQLException {
        List<Map<String, Object>> list = new ArrayList<>();

        String sql
                = "SELECT i.invoice_id, i.appointment_id, i.invoice_date, "
                + "i.subtotal, i.discount, i.total_amount, i.status, "
                + "a.appointment_date, a.start_time, a.end_time, "
                + "c.customer_id, c.full_name AS customer_name, "
                + "c.phone AS customer_phone, s.service_name, "
                + "COALESCE((SELECT SUM(p.amount) FROM Payment p "
                + "WHERE p.invoice_id = i.invoice_id AND p.status = N'Success'), 0) "
                + "AS paid_amount, "
                + "COALESCE((SELECT SUM(l.amount) FROM InvoiceActionLog l "
                + "WHERE l.invoice_id = i.invoice_id AND l.action_type = 'Refund'), 0) "
                + "AS refunded_amount "
                + "FROM Invoice i "
                + "JOIN Appointment a ON a.appointment_id = i.appointment_id "
                + "JOIN Customer c ON c.customer_id = a.customer_id "
                + "JOIN Service s ON s.service_id = a.service_id "
                + "ORDER BY i.invoice_date DESC, i.invoice_id DESC";

        if (conn == null) {
            throw new SQLException("Không kết nối được database.");
        }

        try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("invoiceId", rs.getInt("invoice_id"));
                item.put("appointmentId", rs.getInt("appointment_id"));
                item.put("invoiceDate", rs.getTimestamp("invoice_date"));
                item.put("subtotal", rs.getBigDecimal("subtotal"));
                item.put("discount", rs.getBigDecimal("discount"));
                item.put("totalAmount", rs.getBigDecimal("total_amount"));
                item.put("status", rs.getString("status"));
                item.put("appointmentDate", rs.getDate("appointment_date"));
                item.put("startTime", rs.getTime("start_time"));
                item.put("endTime", rs.getTime("end_time"));
                item.put("customerId", rs.getInt("customer_id"));
                item.put("customerName", rs.getString("customer_name"));
                item.put("customerPhone", rs.getString("customer_phone"));
                item.put("serviceName", rs.getString("service_name"));
                item.put("paidAmount", rs.getBigDecimal("paid_amount"));
                item.put("refundedAmount", rs.getBigDecimal("refunded_amount"));
                list.add(item);
            }
        }

        return list;
    }

    // Returns a single invoice and its payments, product lines, and action history.
    public Map<String, Object> getInvoiceDetails(int invoiceId) throws SQLException {
        if (conn == null) {
            throw new SQLException("Không kết nối được database.");
        }
        if (invoiceId <= 0) {
            throw new IllegalArgumentException("Mã hóa đơn không hợp lệ.");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        Map<String, Object> invoice = new LinkedHashMap<>();

        String invoiceSql
                = "SELECT i.invoice_id, i.appointment_id, i.voucher_id, i.invoice_date, "
                + "i.subtotal, i.discount, i.total_amount, i.status, "
                + "a.appointment_date, a.start_time, a.end_time, "
                + "c.customer_id, c.full_name AS customer_name, "
                + "c.phone AS customer_phone, s.service_name "
                + "FROM Invoice i "
                + "JOIN Appointment a ON a.appointment_id = i.appointment_id "
                + "JOIN Customer c ON c.customer_id = a.customer_id "
                + "JOIN Service s ON s.service_id = a.service_id "
                + "WHERE i.invoice_id = ?";

        try (PreparedStatement ps = conn.prepareStatement(invoiceSql)) {
            ps.setInt(1, invoiceId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    throw new IllegalArgumentException("Không tìm thấy hóa đơn.");
                }
                invoice.put("invoiceId", rs.getInt("invoice_id"));
                invoice.put("appointmentId", rs.getInt("appointment_id"));
                int voucherId = rs.getInt("voucher_id");
                invoice.put("voucherId", rs.wasNull() ? null : voucherId);
                invoice.put("invoiceDate", rs.getTimestamp("invoice_date"));
                invoice.put("subtotal", rs.getBigDecimal("subtotal"));
                invoice.put("discount", rs.getBigDecimal("discount"));
                invoice.put("totalAmount", rs.getBigDecimal("total_amount"));
                invoice.put("status", rs.getString("status"));
                invoice.put("appointmentDate", rs.getDate("appointment_date"));
                invoice.put("startTime", rs.getTime("start_time"));
                invoice.put("endTime", rs.getTime("end_time"));
                invoice.put("customerId", rs.getInt("customer_id"));
                invoice.put("customerName", rs.getString("customer_name"));
                invoice.put("customerPhone", rs.getString("customer_phone"));
                invoice.put("serviceName", rs.getString("service_name"));
            }
        }

        List<Map<String, Object>> payments = new ArrayList<>();
        String paymentSql
                = "SELECT payment_id, payment_method, amount, payment_date, "
                + "transaction_code, status FROM Payment "
                + "WHERE invoice_id = ? ORDER BY payment_date DESC, payment_id DESC";
        try (PreparedStatement ps = conn.prepareStatement(paymentSql)) {
            ps.setInt(1, invoiceId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("paymentId", rs.getInt("payment_id"));
                    item.put("paymentMethod", rs.getString("payment_method"));
                    item.put("amount", rs.getBigDecimal("amount"));
                    item.put("paymentDate", rs.getTimestamp("payment_date"));
                    item.put("transactionCode", rs.getString("transaction_code"));
                    item.put("status", rs.getString("status"));
                    payments.add(item);
                }
            }
        }

        List<Map<String, Object>> products = new ArrayList<>();
        String productSql
                = "SELECT ip.product_id, p.product_name, ip.quantity, "
                + "ip.unit_price, ip.subtotal FROM InvoiceProduct ip "
                + "JOIN Product p ON p.product_id = ip.product_id "
                + "WHERE ip.invoice_id = ? ORDER BY p.product_name";
        try (PreparedStatement ps = conn.prepareStatement(productSql)) {
            ps.setInt(1, invoiceId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("productId", rs.getInt("product_id"));
                    item.put("productName", rs.getString("product_name"));
                    item.put("quantity", rs.getInt("quantity"));
                    item.put("unitPrice", rs.getBigDecimal("unit_price"));
                    item.put("subtotal", rs.getBigDecimal("subtotal"));
                    products.add(item);
                }
            }
        }

        List<Map<String, Object>> actions = new ArrayList<>();
        String actionSql
                = "SELECT action_id, payment_id, action_type, amount, reason, "
                + "performed_by_account_id, created_at FROM InvoiceActionLog "
                + "WHERE invoice_id = ? ORDER BY created_at DESC, action_id DESC";
        try (PreparedStatement ps = conn.prepareStatement(actionSql)) {
            ps.setInt(1, invoiceId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("actionId", rs.getInt("action_id"));
                    int paymentId = rs.getInt("payment_id");
                    item.put("paymentId", rs.wasNull() ? null : paymentId);
                    item.put("actionType", rs.getString("action_type"));
                    item.put("amount", rs.getBigDecimal("amount"));
                    item.put("reason", rs.getString("reason"));
                    item.put("performedByAccountId", rs.getInt("performed_by_account_id"));
                    item.put("createdAt", rs.getTimestamp("created_at"));
                    actions.add(item);
                }
            }
        }

        result.put("invoice", invoice);
        result.put("payments", payments);
        result.put("products", products);
        result.put("actions", actions);
        return result;
    }

    // Returns completed appointments that do not have an invoice.
    public List<Map<String, Object>> getCompletedAppointmentsWithoutInvoice()
            throws SQLException {

        List<Map<String, Object>> list = new ArrayList<>();

        String sql
                = "SELECT a.appointment_id, a.appointment_date, "
                + "a.start_time, a.end_time, a.customer_id, "
                + "c.full_name AS customer_name, c.phone AS customer_phone, "
                + "c.membership_tier_id AS customer_membership_tier_id, "
                + "mt.membership_tier_id AS tier_id, "
                + "mt.tier_name, mt.description AS tier_description, "
                + "mt.discount_percent, mt.min_spending, "
                + "s.service_name, s.price AS service_price "
                + "FROM Appointment a "
                + "JOIN Customer c ON c.customer_id = a.customer_id "
                + "LEFT JOIN MembershipTier mt "
                + "ON mt.membership_tier_id = c.membership_tier_id "
                + "JOIN Service s ON s.service_id = a.service_id "
                + "LEFT JOIN Invoice i ON i.appointment_id = a.appointment_id "
                + "WHERE a.status = N'Completed' "
                + "AND i.invoice_id IS NULL "
                + "ORDER BY a.appointment_date DESC, a.start_time DESC";

        if (conn == null) {
            throw new SQLException("Không kết nối được database.");
        }

        try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Map<String, Object> item = new HashMap<>();

                item.put("appointmentId", rs.getInt("appointment_id"));
                item.put("appointmentDate", rs.getDate("appointment_date"));
                item.put("startTime", rs.getTime("start_time"));
                item.put("endTime", rs.getTime("end_time"));
                item.put("customerId", rs.getInt("customer_id"));
                item.put("customerName", rs.getString("customer_name"));
                item.put("customerPhone", rs.getString("customer_phone"));

                item.put("membershipTierId",rs.getObject("customer_membership_tier_id"));

                Map<String, Object> membership = null;

                if (rs.getObject("tier_id") != null) {
                    membership = new HashMap<>();

                    membership.put("membershipTierId", rs.getInt("tier_id"));
                    membership.put("tierName", rs.getString("tier_name"));
                    membership.put("description", rs.getString("tier_description"));
                    membership.put("discountPercent", rs.getBigDecimal("discount_percent"));
                    membership.put("minSpending", rs.getBigDecimal("min_spending"));
                }
                item.put("membership", membership);
                item.put("serviceName", rs.getString("service_name"));
                item.put("servicePrice", rs.getBigDecimal("service_price"));

                list.add(item);
            }
        }

        return list;
    }

    public List<Map<String, Object>> getActiveProducts()
            throws SQLException {

        List<Map<String, Object>> list = new ArrayList<>();

        String sql
                = "SELECT product_id, product_name, unit_price, "
                + "stock_quantity "
                + "FROM Product "
                + "WHERE status = N'Active' AND stock_quantity > 0 "
                + "ORDER BY product_name";

        if (conn == null) {
            throw new SQLException("Không kết nối được database.");
        }

        try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Map<String, Object> item = new HashMap<>();

                item.put("productId", rs.getInt("product_id"));
                item.put("productName", rs.getString("product_name"));
                item.put("unitPrice", rs.getBigDecimal("unit_price"));
                item.put("stockQuantity", rs.getInt("stock_quantity"));

                list.add(item);
            }
        }

        return list;
    }

    public Map<String, Object> createInvoiceAndPayment(
            int appointmentId,
            Integer voucherId,
            BigDecimal manualDiscount,
            String paymentMethod,
            BigDecimal receivedAmount,
            List<InvoiceProduct> productItems
    ) throws SQLException {

        if (conn == null) {
            throw new SQLException("Không kết nối được database.");
        }

        if (appointmentId <= 0) {
            throw new IllegalArgumentException("Mã lịch hẹn không hợp lệ.");
        }

        if (paymentMethod == null) {
            throw new IllegalArgumentException("Vui lòng chọn phương thức thanh toán.");
        }

        String method = paymentMethod.trim();

        if (!method.equals("Cash")
                && !method.equals("Card")
                && !method.equals("Transfer")) {
            throw new IllegalArgumentException(
                    "Phương thức thanh toán phải là Cash, Card hoặc Transfer.");
        }

        if (receivedAmount == null || receivedAmount.signum() < 0) {
            throw new IllegalArgumentException("Số tiền nhận không hợp lệ.");
        }

        if (manualDiscount == null) {
            manualDiscount = BigDecimal.ZERO;
        }

        manualDiscount = manualDiscount.setScale(2, RoundingMode.HALF_UP);

        if (manualDiscount.signum() < 0) {
            throw new IllegalArgumentException("Giảm giá không được âm.");
        }

        if (voucherId != null && voucherId <= 0) {
            throw new IllegalArgumentException("Mã voucher không hợp lệ.");
        }

        if (voucherId != null && manualDiscount.signum() > 0) {
            throw new IllegalArgumentException(
                    "Vui lòng chọn voucher hoặc giảm giá trực tiếp, không dùng cả hai.");
        }

        // Merge duplicate product IDs before inserting invoice details.
        Map<Integer, Integer> quantities = new LinkedHashMap<>();

        if (productItems != null) {
            for (InvoiceProduct item : productItems) {
                if (item == null
                        || item.getProductId() <= 0
                        || item.getQuantity() <= 0) {
                    throw new IllegalArgumentException(
                            "Sản phẩm hoặc số lượng không hợp lệ.");
                }

                quantities.merge(
                        item.getProductId(),
                        item.getQuantity(),
                        Integer::sum
                );
            }
        }

        boolean originalAutoCommit = conn.getAutoCommit();
        int originalIsolation = conn.getTransactionIsolation();

        try {
            conn.setTransactionIsolation(Connection.TRANSACTION_SERIALIZABLE);
            conn.setAutoCommit(false);

            // Validate and lock the appointment during the transaction.
            int customerId;
            BigDecimal servicePrice;

            String appointmentSql
                    = "SELECT a.customer_id, s.price "
                    + "FROM Appointment a WITH (UPDLOCK, HOLDLOCK) "
                    + "JOIN Service s ON s.service_id = a.service_id "
                    + "WHERE a.appointment_id = ? "
                    + "AND a.status = N'Completed'";

            try (PreparedStatement ps
                    = conn.prepareStatement(appointmentSql)) {

                ps.setInt(1, appointmentId);

                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        throw new IllegalStateException(
                                "Lịch hẹn không tồn tại, chưa hoàn thành "
                                + "hoặc không có dịch vụ.");
                    }

                    customerId = rs.getInt("customer_id");
                    servicePrice = rs.getBigDecimal("price");
                }
            }

            if (servicePrice == null || servicePrice.signum() < 0) {
                throw new IllegalStateException("Giá dịch vụ không hợp lệ.");
            }

            // Prevent duplicate invoices for the same appointment.
            String duplicateSql
                    = "SELECT invoice_id "
                    + "FROM Invoice WITH (UPDLOCK, HOLDLOCK) "
                    + "WHERE appointment_id = ?";

            try (PreparedStatement ps
                    = conn.prepareStatement(duplicateSql)) {

                ps.setInt(1, appointmentId);

                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        throw new IllegalStateException(
                                "Lịch hẹn này đã có hóa đơn.");
                    }
                }
            }

            BigDecimal subtotal
                    = servicePrice.setScale(2, RoundingMode.HALF_UP);

            Map<Integer, Map<String, Object>> products = new LinkedHashMap<>();

            // Read current product prices and validate stock availability.
            for (Map.Entry<Integer, Integer> entry : quantities.entrySet()) {
                int productId = entry.getKey();
                int quantity = entry.getValue();

                String productSql
                        = "SELECT product_name, unit_price, stock_quantity "
                        + "FROM Product WITH (UPDLOCK, HOLDLOCK) "
                        + "WHERE product_id = ? AND status = N'Active'";

                try (PreparedStatement ps
                        = conn.prepareStatement(productSql)) {

                    ps.setInt(1, productId);

                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()) {
                            throw new IllegalArgumentException(
                                    "Sản phẩm không tồn tại hoặc không hoạt động: "
                                    + productId);
                        }

                        BigDecimal unitPrice = rs.getBigDecimal("unit_price");
                        int stock = rs.getInt("stock_quantity");

                        if (stock < quantity) {
                            throw new IllegalStateException(
                                    "Sản phẩm " + rs.getString("product_name")
                                    + " không đủ tồn kho.");
                        }

                        BigDecimal lineSubtotal = unitPrice
                                .multiply(BigDecimal.valueOf(quantity))
                                .setScale(2, RoundingMode.HALF_UP);

                        Map<String, Object> product = new HashMap<>();
                        product.put("productId", productId);
                        product.put("quantity", quantity);
                        product.put("unitPrice", unitPrice);
                        product.put("subtotal", lineSubtotal);

                        products.put(productId, product);
                        subtotal = subtotal.add(lineSubtotal);
                    }
                }
            }

            subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);

            // Calculate the applicable discount.
            BigDecimal discount = manualDiscount;

            if (voucherId != null) {
                String voucherSql
                        = "SELECT customer_id, discount_type, discount_value "
                        + "FROM Voucher WITH (UPDLOCK, HOLDLOCK) "
                        + "WHERE voucher_id = ? "
                        + "AND status = N'Active' "
                        + "AND (start_date IS NULL OR "
                        + "CONVERT(date, start_date) <= CONVERT(date, GETDATE())) "
                        + "AND (end_date IS NULL OR "
                        + "CONVERT(date, end_date) >= CONVERT(date, GETDATE()))";

                try (PreparedStatement ps
                        = conn.prepareStatement(voucherSql)) {

                    ps.setInt(1, voucherId);

                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()) {
                            throw new IllegalArgumentException(
                                    "Voucher không tồn tại, hết hạn hoặc không hoạt động.");
                        }

                        int voucherCustomerId = rs.getInt("customer_id");
                        boolean customerSpecific = !rs.wasNull();

                        if (customerSpecific
                                && voucherCustomerId != customerId) {
                            throw new IllegalArgumentException(
                                    "Voucher không thuộc khách hàng này.");
                        }

                        String discountType = rs.getString("discount_type");
                        BigDecimal discountValue
                                = rs.getBigDecimal("discount_value");

                        if (discountValue == null
                                || discountValue.signum() < 0) {
                            throw new IllegalArgumentException(
                                    "Giá trị voucher không hợp lệ.");
                        }

                        if ("Percentage".equalsIgnoreCase(discountType)) {
                            if (discountValue.compareTo(
                                    BigDecimal.valueOf(100)) > 0) {
                                throw new IllegalArgumentException(
                                        "Tỷ lệ giảm giá không được vượt quá 100%.");
                            }

                            discount = subtotal
                                    .multiply(discountValue)
                                    .divide(BigDecimal.valueOf(100),
                                            2, RoundingMode.HALF_UP);

                        } else if ("Fixed".equalsIgnoreCase(discountType)) {
                            discount = discountValue.setScale(
                                    2, RoundingMode.HALF_UP);

                        } else {
                            throw new IllegalArgumentException(
                                    "Loại voucher chưa được hỗ trợ.");
                        }
                    }
                }
            }

            discount = discount.setScale(2, RoundingMode.HALF_UP);

            if (discount.compareTo(subtotal) >= 0) {
                throw new IllegalArgumentException(
                        "Giảm giá phải nhỏ hơn tổng tiền.");
            }

            BigDecimal total = subtotal.subtract(discount)
                    .setScale(2, RoundingMode.HALF_UP);

            // Validate the amount received at the front desk.
            if (receivedAmount.compareTo(total) < 0) {
                throw new IllegalArgumentException(
                        "Số tiền nhận chưa đủ để thanh toán hóa đơn.");
            }

            if (!"Cash".equals(method)
                    && receivedAmount.compareTo(total) != 0) {
                throw new IllegalArgumentException(
                        "Số tiền Card/Transfer phải bằng tổng hóa đơn.");
            }

            // Creat the invoice with an explicit Paid status.
            String invoiceSql
                    = "INSERT INTO Invoice "
                    + "(appointment_id, voucher_id, subtotal, discount, "
                    + "total_amount, status) "
                    + "VALUES (?, ?, ?, ?, ?, N'Paid')";

            int invoiceId;

            try (PreparedStatement ps = conn.prepareStatement(
                    invoiceSql, Statement.RETURN_GENERATED_KEYS)) {

                ps.setInt(1, appointmentId);

                if (voucherId == null) {
                    ps.setNull(2, java.sql.Types.INTEGER);
                } else {
                    ps.setInt(2, voucherId);
                }

                ps.setBigDecimal(3, subtotal);
                ps.setBigDecimal(4, discount);
                ps.setBigDecimal(5, total);
                ps.executeUpdate();

                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (!keys.next()) {
                        throw new SQLException(
                                "Không lấy được mã hóa đơn mới.");
                    }

                    invoiceId = keys.getInt(1);
                }
            }

            // Save invoice product details and update stock quantities.
            String invoiceProductSql
                    = "INSERT INTO InvoiceProduct "
                    + "(invoice_id, product_id, quantity, unit_price, subtotal) "
                    + "VALUES (?, ?, ?, ?, ?)";

            String updateStockSql
                    = "UPDATE Product "
                    + "SET stock_quantity = stock_quantity - ? "
                    + "WHERE product_id = ? AND stock_quantity >= ? "
                    + "AND status = N'Active'";

            for (Map.Entry<Integer, Map<String, Object>> entry
                    : products.entrySet()) {

                Map<String, Object> product = entry.getValue();

                int productId = (Integer) product.get("productId");
                int quantity = (Integer) product.get("quantity");
                BigDecimal unitPrice = (BigDecimal) product.get("unitPrice");
                BigDecimal lineSubtotal
                        = (BigDecimal) product.get("subtotal");

                try (PreparedStatement ps
                        = conn.prepareStatement(invoiceProductSql)) {

                    ps.setInt(1, invoiceId);
                    ps.setInt(2, productId);
                    ps.setInt(3, quantity);
                    ps.setBigDecimal(4, unitPrice);
                    ps.setBigDecimal(5, lineSubtotal);
                    ps.executeUpdate();
                }

                try (PreparedStatement ps
                        = conn.prepareStatement(updateStockSql)) {

                    ps.setInt(1, quantity);
                    ps.setInt(2, productId);
                    ps.setInt(3, quantity);

                    if (ps.executeUpdate() != 1) {
                        throw new IllegalStateException(
                                "Không thể cập nhật tồn kho sản phẩm "
                                + productId + ".");
                    }
                }
            }

            // Record the successful front-desk payment.
            String transactionCode
                    = "POS-" + UUID.randomUUID().toString().replace("-", "");

            String paymentSql
                    = "INSERT INTO Payment "
                    + "(invoice_id, payment_method, amount, "
                    + "transaction_code, status) "
                    + "VALUES (?, ?, ?, ?, N'Success')";

            int paymentId;

            try (PreparedStatement ps = conn.prepareStatement(
                    paymentSql, Statement.RETURN_GENERATED_KEYS)) {

                ps.setInt(1, invoiceId);
                ps.setString(2, method);
                ps.setBigDecimal(3, total);
                ps.setString(4, transactionCode);
                ps.executeUpdate();

                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (!keys.next()) {
                        throw new SQLException(
                                "Không lấy được mã giao dịch thanh toán.");
                    }

                    paymentId = keys.getInt(1);
                }
            }

            conn.commit();

            Map<String, Object> result = new HashMap<>();
            result.put("invoiceId", invoiceId);
            result.put("appointmentId", appointmentId);
            result.put("subtotal", subtotal);
            result.put("discount", discount);
            result.put("totalAmount", total);
            result.put("invoiceStatus", "Paid");
            result.put("paymentId", paymentId);
            result.put("paymentMethod", method);
            result.put("paymentStatus", "Success");
            result.put("transactionCode", transactionCode);
            result.put("changeDue",
                    receivedAmount.subtract(total).setScale(
                            2, RoundingMode.HALF_UP));

            return result;

        } catch (SQLException | RuntimeException ex) {
            try {
                conn.rollback();
            } catch (SQLException rollbackError) {
                ex.addSuppressed(rollbackError);
            }

            throw ex;

        } finally {
            try {
                conn.setTransactionIsolation(originalIsolation);
                conn.setAutoCommit(originalAutoCommit);
            } catch (SQLException ignored) {
                // Preserve the original exception if restoring the connection fails.
            }
        }
    }

    public Map<String, Object> refundInvoice(
            int invoiceId,
            BigDecimal amount,
            String reason,
            int accountId
    ) throws SQLException {

        if (conn == null) {
            throw new SQLException("Không kết nối được database.");
        }

        if (invoiceId <= 0 || accountId <= 0) {
            throw new IllegalArgumentException("Mã hóa đơn hoặc tài khoản không hợp lệ.");
        }

        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Số tiền hoàn phải lớn hơn 0.");
        }

        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập lý do hoàn tiền.");
        }

        reason = reason.trim();

        if (reason.length() > 500) {
            throw new IllegalArgumentException("Lý do không được vượt quá 500 ký tự.");
        }

        amount = amount.setScale(2, RoundingMode.HALF_UP);

        boolean originalAutoCommit = conn.getAutoCommit();
        int originalIsolation = conn.getTransactionIsolation();

        try {
            conn.setTransactionIsolation(Connection.TRANSACTION_SERIALIZABLE);
            conn.setAutoCommit(false);

            BigDecimal invoiceTotal;
            String invoiceStatus;

            String invoiceSql
                    = "SELECT total_amount, status "
                    + "FROM Invoice WITH (UPDLOCK, HOLDLOCK) "
                    + "WHERE invoice_id = ?";

            try (PreparedStatement ps = conn.prepareStatement(invoiceSql)) {
                ps.setInt(1, invoiceId);

                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        throw new IllegalArgumentException("Không tìm thấy hóa đơn.");
                    }

                    invoiceTotal = rs.getBigDecimal("total_amount");
                    invoiceStatus = rs.getString("status");
                }
            }

            if (!"Paid".equalsIgnoreCase(invoiceStatus)
                    && !"Partially Refunded".equalsIgnoreCase(invoiceStatus)) {
                throw new IllegalStateException(
                        "Chỉ có thể hoàn tiền cho hóa đơn đã thanh toán hợp lệ."
                );
            }

            int paymentId;
            BigDecimal successfulPaymentTotal;
            int successfulPaymentCount;

            String paymentSql
                    = "SELECT COUNT(*) AS payment_count, "
                    + "COALESCE(SUM(amount), 0) AS payment_total, "
                    + "MIN(payment_id) AS payment_id "
                    + "FROM Payment WITH (UPDLOCK, HOLDLOCK) "
                    + "WHERE invoice_id = ? AND status = N'Success'";

            try (PreparedStatement ps = conn.prepareStatement(paymentSql)) {
                ps.setInt(1, invoiceId);

                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();

                    successfulPaymentCount = rs.getInt("payment_count");
                    successfulPaymentTotal = rs.getBigDecimal("payment_total");
                    paymentId = rs.getInt("payment_id");
                }
            }

            if (successfulPaymentCount != 1
                    || successfulPaymentTotal == null
                    || successfulPaymentTotal.compareTo(invoiceTotal) != 0) {
                throw new IllegalStateException(
                        "Dữ liệu thanh toán không khớp hóa đơn. "
                        + "Vui lòng kiểm tra trước khi hoàn tiền."
                );
            }

            BigDecimal previousRefunds;

            String refundTotalSql
                    = "SELECT COALESCE(SUM(amount), 0) AS refunded_total "
                    + "FROM InvoiceActionLog WITH (UPDLOCK, HOLDLOCK) "
                    + "WHERE invoice_id = ? AND action_type = 'Refund'";

            try (PreparedStatement ps = conn.prepareStatement(refundTotalSql)) {
                ps.setInt(1, invoiceId);

                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();
                    previousRefunds = rs.getBigDecimal("refunded_total");
                }
            }

            BigDecimal remainingAmount
                    = invoiceTotal.subtract(previousRefunds);

            if (remainingAmount.signum() <= 0) {
                throw new IllegalStateException("Hóa đơn đã được hoàn đủ tiền.");
            }

            if (amount.compareTo(remainingAmount) > 0) {
                throw new IllegalArgumentException(
                        "Số tiền hoàn vượt quá số tiền còn có thể hoàn: "
                        + remainingAmount
                );
            }

            BigDecimal refundedAfterThisAction
                    = previousRefunds.add(amount);

            String newStatus
                    = refundedAfterThisAction.compareTo(invoiceTotal) >= 0
                    ? "Refunded"
                    : "Partially Refunded";

            String logSql
                    = "INSERT INTO InvoiceActionLog "
                    + "(invoice_id, payment_id, action_type, amount, "
                    + "reason, performed_by_account_id) "
                    + "VALUES (?, ?, 'Refund', ?, ?, ?)";

            try (PreparedStatement ps = conn.prepareStatement(logSql)) {
                ps.setInt(1, invoiceId);
                ps.setInt(2, paymentId);
                ps.setBigDecimal(3, amount);
                ps.setString(4, reason);
                ps.setInt(5, accountId);
                ps.executeUpdate();
            }

            String updateInvoiceSql
                    = "UPDATE Invoice SET status = ? WHERE invoice_id = ?";

            try (PreparedStatement ps = conn.prepareStatement(updateInvoiceSql)) {
                ps.setString(1, newStatus);
                ps.setInt(2, invoiceId);
                ps.executeUpdate();
            }

            conn.commit();

            Map<String, Object> result = new HashMap<>();
            result.put("invoiceId", invoiceId);
            result.put("paymentId", paymentId);
            result.put("refundAmount", amount);
            result.put("totalRefunded", refundedAfterThisAction);
            result.put("remainingRefundable", invoiceTotal.subtract(refundedAfterThisAction));
            result.put("invoiceStatus", newStatus);
            result.put("message", "Refund recorded successfully.");

            return result;

        } catch (SQLException | RuntimeException ex) {
            try {
                conn.rollback();
            } catch (SQLException rollbackError) {
                ex.addSuppressed(rollbackError);
            }

            throw ex;

        } finally {
            try {
                conn.setTransactionIsolation(originalIsolation);
                conn.setAutoCommit(originalAutoCommit);
            } catch (SQLException ignored) {
                // Preserve the original exception if restoring the connection fails.
            }
        }
    }

    public Map<String, Object> cancelInvoice(
            int invoiceId,
            String reason,
            int accountId
    ) throws SQLException {

        if (conn == null) {
            throw new SQLException("Không kết nối được database.");
        }

        if (invoiceId <= 0 || accountId <= 0) {
            throw new IllegalArgumentException("Mã hóa đơn hoặc tài khoản không hợp lệ.");
        }

        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập lý do hủy hóa đơn.");
        }

        reason = reason.trim();

        if (reason.length() > 500) {
            throw new IllegalArgumentException("Lý do không được vượt quá 500 ký tự.");
        }

        boolean originalAutoCommit = conn.getAutoCommit();
        int originalIsolation = conn.getTransactionIsolation();

        try {
            conn.setTransactionIsolation(Connection.TRANSACTION_SERIALIZABLE);
            conn.setAutoCommit(false);

            String invoiceStatus;

            String invoiceSql
                    = "SELECT status FROM Invoice WITH (UPDLOCK, HOLDLOCK) "
                    + "WHERE invoice_id = ?";

            try (PreparedStatement ps = conn.prepareStatement(invoiceSql)) {
                ps.setInt(1, invoiceId);

                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        throw new IllegalArgumentException("Không tìm thấy hóa đơn.");
                    }

                    invoiceStatus = rs.getString("status");
                }
            }

            if (!"Unpaid".equalsIgnoreCase(invoiceStatus)) {
                throw new IllegalStateException(
                        "Chỉ có thể hủy hóa đơn chưa thanh toán."
                );
            }

            String paymentSql
                    = "SELECT COUNT(*) AS payment_count "
                    + "FROM Payment WITH (UPDLOCK, HOLDLOCK) "
                    + "WHERE invoice_id = ? AND status = N'Success'";

            try (PreparedStatement ps = conn.prepareStatement(paymentSql)) {
                ps.setInt(1, invoiceId);

                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();

                    if (rs.getInt("payment_count") > 0) {
                        throw new IllegalStateException(
                                "Hóa đơn đã có thanh toán thành công, không thể hủy."
                        );
                    }
                }
            }

            String logCheckSql
                    = "SELECT COUNT(*) AS action_count "
                    + "FROM InvoiceActionLog WITH (UPDLOCK, HOLDLOCK) "
                    + "WHERE invoice_id = ?";

            try (PreparedStatement ps = conn.prepareStatement(logCheckSql)) {
                ps.setInt(1, invoiceId);

                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();

                    if (rs.getInt("action_count") > 0) {
                        throw new IllegalStateException(
                                "Hóa đơn đã có lịch sử thao tác, không thể hủy trực tiếp."
                        );
                    }
                }
            }

            String logSql
                    = "INSERT INTO InvoiceActionLog "
                    + "(invoice_id, payment_id, action_type, amount, "
                    + "reason, performed_by_account_id) "
                    + "VALUES (?, NULL, 'Cancel', NULL, ?, ?)";

            try (PreparedStatement ps = conn.prepareStatement(logSql)) {
                ps.setInt(1, invoiceId);
                ps.setString(2, reason);
                ps.setInt(3, accountId);
                ps.executeUpdate();
            }

            String updateInvoiceSql
                    = "UPDATE Invoice SET status = N'Cancelled' "
                    + "WHERE invoice_id = ?";

            try (PreparedStatement ps = conn.prepareStatement(updateInvoiceSql)) {
                ps.setInt(1, invoiceId);
                ps.executeUpdate();
            }

            conn.commit();

            Map<String, Object> result = new HashMap<>();
            result.put("invoiceId", invoiceId);
            result.put("invoiceStatus", "Cancelled");
            result.put("message", "Invoice cancelled successfully.");

            return result;

        } catch (SQLException | RuntimeException ex) {
            try {
                conn.rollback();
            } catch (SQLException rollbackError) {
                ex.addSuppressed(rollbackError);
            }
            throw ex;

        } finally {
            try {
                conn.setTransactionIsolation(originalIsolation);
                conn.setAutoCommit(originalAutoCommit);
            } catch (SQLException ignored) {
                // Preserve the original exception if restoring the connection fails.
            }
        }
    }
}
