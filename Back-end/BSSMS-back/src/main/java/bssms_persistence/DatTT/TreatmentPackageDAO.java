/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_persistence.DatTT;

import bssms_catalog.TreatmentPackage;
import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author Trần Thành Đạt - CE200857
 */

public class TreatmentPackageDAO extends DBContext {

    // 1. VIEW: Xem danh sách gói liệu trình
    public List<TreatmentPackage> getAllTreatmentPackages() {
        List<TreatmentPackage> list = new ArrayList<>();
        String sql = "SELECT * FROM TreatmentPackage";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    TreatmentPackage tp = new TreatmentPackage();
                    tp.setTreatmentPackageId(rs.getInt("treatment_package_id"));
                    tp.setServiceId(rs.getInt("service_id"));
                    tp.setPackageName(rs.getString("package_name"));
                    tp.setDescription(rs.getString("description"));
                    tp.setPrice(rs.getDouble("price"));
                    tp.setNumberOfSessions(rs.getInt("number_of_sessions"));
                    list.add(tp);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    // 2. CREATE: Thêm gói liệu trình mới
    public boolean createTreatmentPackage(TreatmentPackage tp) {
        String sql = "INSERT INTO TreatmentPackage (service_id, package_name, description, price, number_of_sessions) VALUES (?, ?, ?, ?, ?)";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setInt(1, tp.getServiceId());
                ps.setString(2, tp.getPackageName());
                ps.setString(3, tp.getDescription());
                ps.setDouble(4, tp.getPrice());
                ps.setInt(5, tp.getNumberOfSessions());
                return ps.executeUpdate() > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    // 3. UPDATE: Cập nhật gói liệu trình
    public boolean updateTreatmentPackage(TreatmentPackage tp) {
        String sql = "UPDATE TreatmentPackage SET service_id = ?, package_name = ?, description = ?, price = ?, number_of_sessions = ? WHERE treatment_package_id = ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setInt(1, tp.getServiceId());
                ps.setString(2, tp.getPackageName());
                ps.setString(3, tp.getDescription());
                ps.setDouble(4, tp.getPrice());
                ps.setInt(5, tp.getNumberOfSessions());
                ps.setInt(6, tp.getTreatmentPackageId());
                return ps.executeUpdate() > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    // 4. DELETE: Xóa gói liệu trình
    public boolean deleteTreatmentPackage(int id) {
        String sql = "DELETE FROM TreatmentPackage WHERE treatment_package_id = ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setInt(1, id);
                return ps.executeUpdate() > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }
}