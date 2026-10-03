package bssms_KhanhLTQ.dao;

import bssms_common.model.Supplier;
import bssms_common.util.DBContext;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class SupplierDAO extends DBContext {

    // 1. Lấy tất cả nhà cung cấp
    public List<Supplier> getAllSuppliers() {
        List<Supplier> list = new ArrayList<>();
        String sql = "SELECT * FROM Supplier";

        if (this.conn == null) return list;

        try (PreparedStatement ps = this.conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Supplier s = new Supplier();
                s.setSupplierId(rs.getInt("supplier_id"));
                s.setSupplierName(rs.getString("supplier_name"));
                s.setPhone(rs.getString("phone"));
                s.setEmail(rs.getString("email"));
                s.setAddress(rs.getString("address"));
                s.setStatus(rs.getString("status"));
                list.add(s);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // 2. Lấy nhà cung cấp theo ID
    public Supplier getSupplierById(int id) {
        String sql = "SELECT * FROM Supplier WHERE supplier_id = ?";

        if (this.conn == null) return null;

        try (PreparedStatement ps = this.conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Supplier s = new Supplier();
                    s.setSupplierId(rs.getInt("supplier_id"));
                    s.setSupplierName(rs.getString("supplier_name"));
                    s.setPhone(rs.getString("phone"));
                    s.setEmail(rs.getString("email"));
                    s.setAddress(rs.getString("address"));
                    s.setStatus(rs.getString("status"));
                    return s;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    // 3. Thêm mới nhà cung cấp
    public boolean createSupplier(Supplier supplier) {
        String sql = "INSERT INTO Supplier (supplier_name, phone, email, address, status) "
                   + "VALUES (?, ?, ?, ?, ?)";

        if (this.conn == null) return false;

        try (PreparedStatement ps = this.conn.prepareStatement(sql)) {
            ps.setString(1, supplier.getSupplierName());
            ps.setString(2, supplier.getPhone());
            ps.setString(3, supplier.getEmail());
            ps.setString(4, supplier.getAddress());
            ps.setString(5, supplier.getStatus());

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 4. Cập nhật thông tin nhà cung cấp
    public boolean updateSupplier(Supplier supplier) {
        String sql = "UPDATE Supplier SET supplier_name = ?, phone = ?, email = ?, "
                   + "address = ?, status = ? WHERE supplier_id = ?";

        if (this.conn == null) return false;

        try (PreparedStatement ps = this.conn.prepareStatement(sql)) {
            ps.setString(1, supplier.getSupplierName());
            ps.setString(2, supplier.getPhone());
            ps.setString(3, supplier.getEmail());
            ps.setString(4, supplier.getAddress());
            ps.setString(5, supplier.getStatus());
            ps.setInt(6, supplier.getSupplierId());

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 5. Xóa nhà cung cấp
    public boolean deleteSupplier(int id) {
        String sql = "DELETE FROM Supplier WHERE supplier_id = ?";

        if (this.conn == null) return false;

        try (PreparedStatement ps = this.conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
}