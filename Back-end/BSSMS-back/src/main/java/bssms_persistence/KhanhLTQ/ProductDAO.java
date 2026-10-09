package bssms_persistence.KhanhLTQ;

import bssms_persistence.DBContext;
import bssms_inventory.Product;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ProductDAO extends DBContext {

    // 1. Lấy tất cả sản phẩm
    public List<Product> getAllProducts() {
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
                p.setStockQuantity(rs.getInt("stock_quantity"));
                p.setReorderLevel(rs.getInt("reorder_level"));
                p.setStatus(rs.getString("status"));
                p.setSupplierId(rs.getInt("supplier_id")); // Tự động trả về 0 nếu chưa có đơn nhập

                list.add(p);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // 2. Lấy sản phẩm theo ID
    public Product getProductById(int id) {
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
                    p.setStockQuantity(rs.getInt("stock_quantity"));
                    p.setReorderLevel(rs.getInt("reorder_level"));
                    p.setStatus(rs.getString("status"));
                    p.setSupplierId(rs.getInt("supplier_id"));
                    return p;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    // 3. Thêm mới sản phẩm
    public boolean createProduct(Product product) {
        String sql = "INSERT INTO Product (product_name, description, unit_price, stock_quantity, reorder_level, status) "
                + "VALUES (?, ?, ?, ?, ?, ?)";

        if (this.conn == null) {
            return false;
        }

        try (PreparedStatement ps = this.conn.prepareStatement(sql)) {
            ps.setString(1, product.getProductName());
            ps.setString(2, product.getDescription());
            ps.setDouble(3, product.getUnitPrice());
            ps.setInt(4, product.getStockQuantity());
            ps.setInt(5, product.getReorderLevel());
            ps.setString(6, product.getStatus());

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 4. Cập nhật thông tin sản phẩm
    public boolean updateProduct(Product product) {
        String sql = "UPDATE Product SET product_name = ?, description = ?, unit_price = ?, "
                + "stock_quantity = ?, reorder_level = ?, status = ? WHERE product_id = ?";

        if (this.conn == null) {
            return false;
        }

        try (PreparedStatement ps = this.conn.prepareStatement(sql)) {
            ps.setString(1, product.getProductName());
            ps.setString(2, product.getDescription());
            ps.setDouble(3, product.getUnitPrice());
            ps.setInt(4, product.getStockQuantity());
            ps.setInt(5, product.getReorderLevel());
            ps.setString(6, product.getStatus());
            ps.setInt(7, product.getProductId());

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 5. Xóa sản phẩm
    public boolean deleteProduct(int id) {
        String sql = "DELETE FROM Product WHERE product_id = ?";

        if (this.conn == null) {
            return false;
        }

        try (PreparedStatement ps = this.conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 6. Cập nhật số lượng tồn kho
    public boolean updateStockQuantity(int productId, int quantityToAdd) {
        String query = "UPDATE Product SET stock_quantity = stock_quantity + ? WHERE product_id = ?";

        if (this.conn == null) {
            return false;
        }

        try (PreparedStatement ps = this.conn.prepareStatement(query)) {
            ps.setInt(1, quantityToAdd);
            ps.setInt(2, productId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
}