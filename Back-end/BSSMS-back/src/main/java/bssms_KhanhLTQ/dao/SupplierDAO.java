package dao;

import utils.DBContext;
import model.Supplier;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class SupplierDAO extends DBContext {

    // 1. Lấy tất cả nhà cung cấp
    public List<Supplier> getAllSuppliers() {
        List<Supplier> list = new ArrayList<>();
        String sql = "SELECT * FROM Supplier";
        
        try (Connection conn = getConnection();
             PreparedStatement ps = (conn != null) ? conn.prepareStatement(sql) : null) {
            
            if (ps == null) return list;

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Supplier s = new Supplier();
                    s.setSupplierId(rs.getInt("supplier_id"));
                    s.setSupplierName(rs.getString("supplier_name"));
                    s.setContactName(rs.getString("contact_name"));
                    s.setPhone(rs.getString("phone"));
                    s.setEmail(rs.getString("email"));
                    s.setAddress(rs.getString("address"));
                    list.add(s);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // 2. Lấy nhà cung cấp theo ID
    public Supplier getSupplierById(int id) {
        String sql = "SELECT * FROM Supplier WHERE supplier_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = (conn != null) ? conn.prepareStatement(sql) : null) {
            
            if (ps != null) {
                ps.setInt(1, id);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        Supplier s = new Supplier();
                        s.setSupplierId(rs.getInt("supplier_id"));
                        s.setSupplierName(rs.getString("supplier_name"));
                        s.setContactName(rs.getString("contact_name"));
                        s.setPhone(rs.getString("phone"));
                        s.setEmail(rs.getString("email"));
                        s.setAddress(rs.getString("address"));
                        return s;
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    // 3. Thêm mới nhà cung cấp
    public boolean createSupplier(Supplier supplier) {
        String sql = "INSERT INTO Supplier (supplier_name, contact_name, phone, email, address) "
                   + "VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = getConnection();
             PreparedStatement ps = (conn != null) ? conn.prepareStatement(sql) : null) {
            
            if (ps != null) {
                ps.setString(1, supplier.getSupplierName());
                ps.setString(2, supplier.getContactName());
                ps.setString(3, supplier.getPhone());
                ps.setString(4, supplier.getEmail());
                ps.setString(5, supplier.getAddress());
                
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 4. Cập nhật thông tin nhà cung cấp
    public boolean updateSupplier(Supplier supplier) {
        String sql = "UPDATE Supplier SET supplier_name = ?, contact_name = ?, phone = ?, "
                   + "email = ?, address = ? WHERE supplier_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = (conn != null) ? conn.prepareStatement(sql) : null) {
            
            if (ps != null) {
                ps.setString(1, supplier.getSupplierName());
                ps.setString(2, supplier.getContactName());
                ps.setString(3, supplier.getPhone());
                ps.setString(4, supplier.getEmail());
                ps.setString(5, supplier.getAddress());
                ps.setInt(6, supplier.getSupplierId());
                
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 5. Xóa nhà cung cấp
    public boolean deleteSupplier(int id) {
        String sql = "DELETE FROM Supplier WHERE supplier_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = (conn != null) ? conn.prepareStatement(sql) : null) {
            
            if (ps != null) {
                ps.setInt(1, id);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
}