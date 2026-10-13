/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_persistence.DatTT;

import bssms_catalog.Bed;
import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
/**
 *
 * @author Trần Thành Đạt - CE200857
 */
public class BedDAO extends DBContext {

    public List<Bed> getAllBeds() {
        List<Bed> list = new ArrayList<>();
        String sql = "SELECT * FROM Bed ORDER BY bed_id DESC";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    Bed b = new Bed(
                        rs.getInt("bed_id"),
                        rs.getInt("room_id"),
                        rs.getString("bed_number"),
                        rs.getString("status")
                    );
                    list.add(b);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public boolean addBed(Bed bed) {
        String sql = "INSERT INTO Bed (room_id, bed_number, status) VALUES (?, ?, ?)";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setInt(1, bed.getRoomId());
                ps.setString(2, bed.getBedNumber());
                ps.setString(3, bed.getStatus() != null ? bed.getStatus() : "Available");
                return ps.executeUpdate() > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateBed(Bed bed) {
        String sql = "UPDATE Bed SET room_id = ?, bed_number = ?, status = ? WHERE bed_id = ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setInt(1, bed.getRoomId());
                ps.setString(2, bed.getBedNumber());
                ps.setString(3, bed.getStatus());
                ps.setInt(4, bed.getBedId());
                return ps.executeUpdate() > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean deleteBed(int bedId) {
        String sql = "DELETE FROM Bed WHERE bed_id = ?";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(sql);
                ps.setInt(1, bedId);
                return ps.executeUpdate() > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }
}
