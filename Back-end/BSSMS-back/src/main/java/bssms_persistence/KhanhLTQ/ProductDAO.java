package bssms_persistence.KhanhLTQ;

import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import bssms_inventory.Product;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ProductDAO extends DBContext implements AutoCloseable {

    private void requireConnection() {
        if (conn == null) throw new DataAccessException("Database connection unavailable");
    }
    @Override public void close() throws java.sql.SQLException { if (conn != null) conn.close(); }

    // 1. Lấy tất cả sản phẩm
    public List<Product> getAllProducts() {
        requireConnection();
        List<Product> list = new ArrayList<>();
        String sql = "SELECT p.*, "
                   + "(SELECT TOP 1 po.supplier_id "
                   + " FROM PurchaseOrderProduct pop "
                   + " JOIN PurchaseOrder po ON pop.purchase_order_id = po.purchase_order_id "
                   + " WHERE pop.product_id = p.product_id) AS supplier_id "
                   + "FROM Product p";

        if (this.conn == null) {
            return list;
        }

        try (PreparedStatement ps = this.conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Product p = new Product();
                p.setProductId(rs.getInt("product_id"));
                p.setProductName(rs.getString("product_name"));
                p.setDescription(rs.getString("description"));
                p.setUnitPrice(rs.getDouble("unit_price"));
                p.setStockQuantity(rs.getBigDecimal("stock_quantity"));
                p.setReorderLevel(rs.getBigDecimal("reorder_level"));
                p.setStatus(rs.getString("status"));
                p.setProductType(rs.getString("product_type"));p.setUnit(rs.getString("unit"));
                p.setSupplierId(rs.getInt("supplier_id")); // Tự động trả về 0 nếu chưa có đơn nhập

                list.add(p);
            }
        } catch (SQLException e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return list;
    }

    // 2. Lấy sản phẩm theo ID
    public Product getProductById(int id) {
        requireConnection();
        String sql = "SELECT p.*, "
                   + "(SELECT TOP 1 po.supplier_id "
                   + " FROM PurchaseOrderProduct pop "
                   + " JOIN PurchaseOrder po ON pop.purchase_order_id = po.purchase_order_id "
                   + " WHERE pop.product_id = p.product_id) AS supplier_id "
                   + "FROM Product p WHERE p.product_id = ?";

        if (this.conn == null) {
            return null;
        }

        try (PreparedStatement ps = this.conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Product p = new Product();
                    p.setProductId(rs.getInt("product_id"));
                    p.setProductName(rs.getString("product_name"));
                    p.setDescription(rs.getString("description"));
                    p.setUnitPrice(rs.getDouble("unit_price"));
                    p.setStockQuantity(rs.getBigDecimal("stock_quantity"));
                    p.setReorderLevel(rs.getBigDecimal("reorder_level"));
                    p.setStatus(rs.getString("status"));
                p.setProductType(rs.getString("product_type"));p.setUnit(rs.getString("unit"));
                    p.setSupplierId(rs.getInt("supplier_id"));
                    return p;
                }
            }
        } catch (SQLException e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return null;
    }

    // 3. Thêm mới sản phẩm
    public boolean createProduct(Product product) {
        try {
            bssms_persistence.common.Workflow w=workflow();w.roles("Manager");
            return w.transaction(()->{
                int id=((Number)w.one("INSERT Product(product_name,description,unit_price,stock_quantity,reorder_level,status,product_type,unit) OUTPUT inserted.product_id VALUES(?,?,?,0,?,?,?,?)",product.getProductName(),product.getDescription(),product.getUnitPrice(),product.getReorderLevel(),product.getStatus(),product.getProductType(),product.getUnit()).get("productId")).intValue();
                if(product.getStockQuantity().signum()!=0) w.call("usp_AdjustStock",requireActorAccountId(),id,product.getStockQuantity(),"Opening stock for new product");
                return true;
            });
        } catch(SQLException e){throw new DataAccessException(e);}
    }

    // 4. Cập nhật thông tin sản phẩm
    public boolean updateProduct(Product product) {
        try {
            bssms_persistence.common.Workflow w=workflow();w.roles("Manager");
            java.math.BigDecimal current=(java.math.BigDecimal)w.one("SELECT stock_quantity FROM Product WHERE product_id=?",product.getProductId()).get("stockQuantity");
            if(current.compareTo(product.getStockQuantity())!=0) throw new bssms_persistence.common.WorkflowException(409,"Use stock adjustment with a reason to change quantity. Refresh the product first.");
            return w.update("UPDATE Product SET product_name=?,description=?,unit_price=?,reorder_level=?,status=?,product_type=?,unit=? WHERE product_id=?",product.getProductName(),product.getDescription(),product.getUnitPrice(),product.getReorderLevel(),product.getStatus(),product.getProductType(),product.getUnit(),product.getProductId())==1;
        } catch(SQLException e){throw new DataAccessException(e);}
    }

    // 5. Xóa sản phẩm
    public boolean deleteProduct(int id) {
        try {workflow().roles("Manager");return workflow().update("UPDATE Product SET status='Inactive' WHERE product_id=?",id)==1;}
        catch(SQLException e){throw new DataAccessException(e);}
    }

    // 6. Cập nhật số lượng tồn kho
    public boolean updateStockQuantity(int productId, int quantityToAdd) {
        throw new bssms_persistence.common.WorkflowException(409,"Use stock adjustment with a reason.");
    }

    /** Apply an entire stock receipt atomically; the original endpoint only updates stock. */
    public void receiveStock(java.util.Map<Integer,Integer> quantities) throws SQLException {
        throw new bssms_persistence.common.WorkflowException(409,"Create a purchase order and receive it by ID.");
    }
}
