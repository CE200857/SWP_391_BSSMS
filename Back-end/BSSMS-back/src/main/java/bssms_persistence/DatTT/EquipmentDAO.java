/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_persistence.DatTT;

import bssms_catalog.Equipment;
import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
/**
 *
 * @author Trần Thành Đạt - CE200857
 */
public class EquipmentDAO extends DBContext {

    public List<Equipment> getAllEquipments() {
        List<Equipment> list = new ArrayList<>();
        String sql = "SELECT * FROM Equipment ORDER BY equipment_id DESC";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    Equipment e = new Equipment(
                        rs.getInt("equipment_id"),
                        rs.getString("equipment_name"),
                        rs.getString("description"),
                        rs.getString("status")
                    );
                    list.add(e);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public boolean addEquipment(Equipment equipment) {
        String sql = "INSERT INTO Equipment (equipment_name, description, status) VALUES (?, ?, ?)";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setString(1, equipment.getEquipmentName());
                ps.setString(2, equipment.getDescription());
                ps.setString(3, equipment.getStatus() != null ? equipment.getStatus() : "Available");
                return ps.executeUpdate() > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateEquipment(Equipment equipment) {
        String sql = "UPDATE Equipment SET equipment_name = ?, description = ?, status = ? WHERE equipment_id = ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setString(1, equipment.getEquipmentName());
                ps.setString(2, equipment.getDescription());
                ps.setString(3, equipment.getStatus());
                ps.setInt(4, equipment.getEquipmentId());
                return ps.executeUpdate() > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean deleteEquipment(int equipmentId) {
        String sql = "DELETE FROM Equipment WHERE equipment_id = ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setInt(1, equipmentId);
                return ps.executeUpdate() > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }
}
