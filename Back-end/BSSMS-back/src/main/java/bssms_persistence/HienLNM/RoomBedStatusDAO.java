package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author HienLNM
 */
public class RoomBedStatusDAO extends DBContext {

    /**
     * Lấy danh sách tất cả Room kèm các Bed thuộc room đó.
     */
    public List<Map<String, Object>> getAllRoomsWithBeds() {
        List<Map<String, Object>> list = new ArrayList<>();
        if (conn == null) {
            System.out.println("Database connection is null in RoomBedStatusDAO.getAllRoomsWithBeds()");
            return list;
        }

        String roomSql = "SELECT room_id, room_name, room_type, status FROM Room ORDER BY room_id";
        String bedSql  = "SELECT bed_id, room_id, bed_number, status FROM Bed WHERE room_id = ? ORDER BY bed_number";

        try {
            PreparedStatement psRoom = conn.prepareStatement(roomSql);
            ResultSet rsRoom = psRoom.executeQuery();
            while (rsRoom.next()) {
                Map<String, Object> room = new HashMap<>();
                int roomId = rsRoom.getInt("room_id");
                room.put("roomId", roomId);
                room.put("roomName", rsRoom.getString("room_name"));
                room.put("roomType", rsRoom.getString("room_type"));
                room.put("status", rsRoom.getString("status"));

                List<Map<String, Object>> beds = new ArrayList<>();
                PreparedStatement psBed = conn.prepareStatement(bedSql);
                psBed.setInt(1, roomId);
                ResultSet rsBed = psBed.executeQuery();
                while (rsBed.next()) {
                    Map<String, Object> bed = new HashMap<>();
                    bed.put("bedId", rsBed.getInt("bed_id"));
                    bed.put("roomId", rsBed.getInt("room_id"));
                    bed.put("bedNumber", rsBed.getString("bed_number"));
                    bed.put("status", rsBed.getString("status"));
                    beds.add(bed);
                }
                rsBed.close();
                psBed.close();

                room.put("beds", beds);
                list.add(room);
            }
            rsRoom.close();
            psRoom.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public boolean updateRoomStatus(int roomId, String status) throws Exception {
        if (conn == null) {
            throw new Exception("Database connection is null in RoomBedStatusDAO.updateRoomStatus()");
        }
        if (!isValidRoomStatus(status)) {
            throw new Exception("Trang thai room khong hop le. Chi chap nhan 'Available', 'Occupied', 'Maintenance'");
        }

        String sql = "UPDATE Room SET status = ? WHERE room_id = ?";
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, status);
        ps.setInt(2, roomId);
        int rows = ps.executeUpdate();
        ps.close();
        return rows > 0;
    }

    public boolean updateBedStatus(int bedId, String status) throws Exception {
        if (conn == null) {
            throw new Exception("Database connection is null in RoomBedStatusDAO.updateBedStatus()");
        }
        if (!isValidBedStatus(status)) {
            throw new Exception("Trang thai bed khong hop le. Chi chap nhan 'Available', 'Occupied', 'Maintenance'");
        }

        String sql = "UPDATE Bed SET status = ? WHERE bed_id = ?";
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, status);
        ps.setInt(2, bedId);
        int rows = ps.executeUpdate();
        ps.close();
        return rows > 0;
    }

    private boolean isValidRoomStatus(String s) {
        return s != null
                && (s.equalsIgnoreCase("Available")
                || s.equalsIgnoreCase("Occupied")
                || s.equalsIgnoreCase("Maintenance"));
    }

    private boolean isValidBedStatus(String s) {
        return s != null
                && (s.equalsIgnoreCase("Available")
                || s.equalsIgnoreCase("Occupied")
                || s.equalsIgnoreCase("Maintenance"));
    }
}
