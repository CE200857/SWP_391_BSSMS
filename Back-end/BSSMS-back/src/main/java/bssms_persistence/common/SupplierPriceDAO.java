package bssms_persistence.common;

import bssms_persistence.DBContext;
import com.google.gson.JsonObject;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

public final class SupplierPriceDAO extends DBContext implements AutoCloseable {
    @Override
    public void close() throws SQLException {
        if (conn != null) conn.close();
    }

    public List<Map<String, Object>> list() throws SQLException {
        Workflow workflow = workflow();
        workflow.roles("Manager");
        return workflow.query(
            "SELECT price.supplier_id, supplier.supplier_name, price.product_id, "
                + "product.product_name, product.unit, product.purchase_unit, "
                + "product.units_per_purchase_unit, price.unit_price, price.updated_at "
                + "FROM dbo.SupplierProductPrice price "
                + "JOIN dbo.Supplier supplier ON supplier.supplier_id=price.supplier_id "
                + "JOIN dbo.Product product ON product.product_id=price.product_id "
                + "WHERE supplier.status='Active' AND product.status='Active' "
                + "ORDER BY product.product_name, price.unit_price, supplier.supplier_name"
        );
    }

    public Map<String, Object> save(JsonObject data) throws SQLException {
        Workflow workflow = workflow();
        int supplierId = requiredPositiveInt(data, "supplierId");
        int productId = requiredPositiveInt(data, "productId");
        BigDecimal unitPrice = data.has("unitPrice") && !data.get("unitPrice").isJsonNull()
            ? data.get("unitPrice").getAsBigDecimal()
            : null;
        if (unitPrice == null || unitPrice.signum() < 0 || unitPrice.scale() > 2) {
            throw new IllegalArgumentException("Invalid supplier product price.");
        }

        List<Map<String, Object>> rows = workflow.call(
            "usp_SetSupplierProductPrice",
            requireActorAccountId(), supplierId, productId, unitPrice
        );
        if (rows.isEmpty()) throw new SQLException("Supplier price procedure returned no row.");
        return workflow.one(
            "SELECT price.supplier_id, supplier.supplier_name, price.product_id, "
                + "product.product_name, product.unit, product.purchase_unit, "
                + "product.units_per_purchase_unit, price.unit_price, price.updated_at "
                + "FROM dbo.SupplierProductPrice price "
                + "JOIN dbo.Supplier supplier ON supplier.supplier_id=price.supplier_id "
                + "JOIN dbo.Product product ON product.product_id=price.product_id "
                + "WHERE price.supplier_id=? AND price.product_id=?",
            supplierId, productId
        );
    }

    public void delete(int supplierId, int productId) throws SQLException {
        Workflow workflow = workflow();
        workflow.call(
            "usp_RemoveSupplierProductPrice",
            requireActorAccountId(), supplierId, productId
        );
    }

    private static int requiredPositiveInt(JsonObject data, String field) {
        if (!data.has(field) || data.get(field).isJsonNull()) {
            throw new IllegalArgumentException("Missing " + field + ".");
        }
        int value = data.get(field).getAsBigDecimal().intValueExact();
        if (value <= 0) throw new IllegalArgumentException("Invalid " + field + ".");
        return value;
    }
}
