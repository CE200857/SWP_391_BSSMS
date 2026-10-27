package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author HienLNM
 */
public class RoomBedStatusDAO extends DBContext implements AutoCloseable {

    private void requireConnection() {
        if (conn == null) throw new DataAccessException("Database connection unavailable");
    }
    @Override public void close() throws java.sql.SQLException { if (conn != null) conn.close(); }

    /**
     * Lấy danh sách tất cả Room kèm các Bed thuộc room đó.
     */
    public List<Map<String, Object>> getAllRoomsWithBeds() {
        requireConnection();
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
            DataAccessException.rethrowIfDatabase(e);
        }
        return list;
    }


    public boolean updateRoomStatus(int roomId, String status) throws Exception {
        return updateResource(true, roomId, status);
    }
    public boolean updateBedStatus(int bedId, String status) throws Exception {
        return updateResource(false, bedId, status);
    }
    private boolean updateResource(boolean room, int id, String status) throws Exception {
        bssms_persistence.common.Workflow w=workflow();
        w.roles("Manager","Technician");
        if(id<=0 || !java.util.Arrays.asList("Active","Maintenance").contains(status))
            throw new IllegalArgumentException("Trạng thái tài nguyên không hợp lệ.");
        String table=room ? "Room" : "Bed", column=room ? "room_id" : "bed_id";
        return w.transaction(() -> {
            String role=(String)w.one("SELECT role FROM " + bssms_persistence.common.SchemaSql.ACCOUNTS + " Account WHERE account_id=?",requireActorAccountId()).get("role");
            if("Technician".equals(role) && w.query("SELECT a.appointment_id FROM Appointment a JOIN AppointmentStaff ast ON ast.appointment_id=a.appointment_id JOIN " + bssms_persistence.common.SchemaSql.STAFF + " st ON st.staff_id=ast.staff_id WHERE a."+column+"=? AND st.account_id=? AND a.appointment_date=CONVERT(date,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time') AND a.status NOT IN ('Cancelled','No-show')",id,requireActorAccountId()).isEmpty())
                throw new bssms_persistence.common.WorkflowException(403,"Chỉ cập nhật phòng/giường được phân công hôm nay.");
            if("Maintenance".equals(status) && !w.query("SELECT a.appointment_id FROM Appointment a WHERE a."+column+"=? AND (a.status IN ('Checked-in','In-progress') OR (a.status IN ('Pending','Confirmed') AND a.appointment_date>=CONVERT(date,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time')))",id).isEmpty())
                throw new bssms_persistence.common.WorkflowException(409,"Tài nguyên còn lịch hẹn. Nhờ lễ tân chuyển lịch/phân công trước khi bảo trì.");
            return w.update("UPDATE "+table+" SET status=? WHERE "+column+"=?",status,id)==1;
        });
    }
}
