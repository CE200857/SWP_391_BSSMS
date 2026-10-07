package bssms_persistence.KhanhLTQ;

import bssms_inventory.PurchaseOrder;
import bssms_inventory.PurchaseOrderProduct;
import bssms_persistence.DBContext;
import java.sql.*;

public class PurchaseOrderDAO extends DBContext {

    public boolean createPurchaseOrder(PurchaseOrder order) {
        String insertOrderSql = "INSERT INTO PurchaseOrder (supplier_id, order_date, total_amount, status) VALUES (?, GETDATE(), ?, 'Completed')";
        String insertDetailSql = "INSERT INTO PurchaseOrderProduct (purchase_order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)";
        String updateStockSql = "UPDATE Product SET stock_quantity = stock_quantity + ? WHERE product_id = ?";

        if (this.conn == null) return false;

        try {
            this.conn.setAutoCommit(false); // Bắt đầu Transaction

            try (PreparedStatement psOrder = this.conn.prepareStatement(insertOrderSql, Statement.RETURN_GENERATED_KEYS)) {
                psOrder.setInt(1, order.getSupplierId());
                psOrder.setDouble(2, order.getTotalAmount());
                int affectedRows = psOrder.executeUpdate();

                if (affectedRows == 0) {
                    this.conn.rollback();
                    return false;
                }

                ResultSet generatedKeys = psOrder.getGeneratedKeys();
                int orderId = 0;
                if (generatedKeys.next()) {
                    orderId = generatedKeys.getInt(1);
                }

                try (PreparedStatement psDetail = this.conn.prepareStatement(insertDetailSql);
                     PreparedStatement psStock = this.conn.prepareStatement(updateStockSql)) {

                    if (order.getItems() != null) {
                        for (PurchaseOrderProduct item : order.getItems()) {
                            // 1. Thêm chi tiết đơn nhập
                            psDetail.setInt(1, orderId);
                            psDetail.setInt(2, item.getProductId());
                            psDetail.setInt(3, item.getQuantity());
                            psDetail.setDouble(4, item.getUnitPrice());
                            psDetail.addBatch();

                            // 2. Tăng số lượng stock_quantity trong bảng Product
                            psStock.setInt(1, item.getQuantity());
                            psStock.setInt(2, item.getProductId());
                            psStock.addBatch();
                        }
                        psDetail.executeBatch();
                        psStock.executeBatch();
                    }
                }
            }

            this.conn.commit();
            return true;

        } catch (SQLException e) {
            try {
                this.conn.rollback();
            } catch (SQLException ex) {
                ex.printStackTrace();
            }
            e.printStackTrace();
        } finally {
            try {
                this.conn.setAutoCommit(true);
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
        return false;
    }
}