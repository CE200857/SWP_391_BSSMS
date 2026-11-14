package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import java.sql.SQLException;
import java.util.*;

public class RoomBedStatusDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    public Map<String, Object> getAllRoomsWithBeds() throws SQLException {
        Workflow w = workflow();
        w.roles("Receptionist", "Manager", "Technician");
        List<Map<String, Object>> rooms = w.query("SELECT room_id,room_name,room_type,status FROM Room ORDER BY room_name");
        List<Map<String, Object>> beds = w.query("SELECT b.bed_id,b.room_id,b.bed_number,b.status,b.use_state,b.use_state_updated_at,cur.appointment_id,cur.customer_name,cur.service_name,cur.start_time,cur.end_time,cur.technician_name "
                + "FROM Bed b OUTER APPLY (SELECT TOP 1 a.appointment_id,c.full_name AS customer_name,s.service_name,l.start_time,l.end_time,st.full_name AS technician_name "
                + "FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id JOIN Customer c ON c.customer_id=a.customer_id JOIN Service s ON s.service_id=l.service_id LEFT JOIN Staff st ON st.staff_id=l.technician_id "
                + "WHERE l.bed_id=b.bed_id AND a.appointment_date=CAST(SYSDATETIME() AS date) AND a.status IN ('Checked-in','In-progress') AND l.status<>'Done' ORDER BY CASE WHEN l.status='InProgress' THEN 0 ELSE 1 END,l.start_time) cur "
                + "ORDER BY b.room_id,b.bed_number");
        int free = 0, inUse = 0, maintenance = 0;
        for (Map<String, Object> room : rooms) {
            List<Map<String, Object>> own = new ArrayList<>();
            for (Map<String, Object> b : beds) if (Objects.equals(b.get("roomId"), room.get("roomId"))) own.add(b);
            room.put("beds", own);
            boolean roomMaintenance = "Maintenance".equals(room.get("status"));
            long active = own.stream().filter(b -> "Active".equals(b.get("status"))).count();
            long used = own.stream().filter(b -> "Active".equals(b.get("status")) && "InUse".equals(b.get("useState"))).count();
            room.put("state", roomMaintenance || active == 0 ? "Maintenance" : used >= active ? "Full" : "Free");
            for (Map<String, Object> b : own) {
                if (roomMaintenance || !"Active".equals(b.get("status"))) maintenance++;
                else if ("InUse".equals(b.get("useState"))) inUse++; else free++;
            }
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("rooms", rooms);
        result.put("summary", Map.of("free", free, "inUse", inUse, "maintenance", maintenance));
        return result;
    }

    public boolean updateBedStatus(int bedId, String useState) throws SQLException {
        Workflow w = workflow();
        w.roles("Receptionist");
        if (!"Free".equals(useState) && !"InUse".equals(useState)) throw new IllegalArgumentException("Trạng thái sử dụng phải là Free hoặc InUse.");
        Map<String, Object> bed = w.one("SELECT b.status,r.status AS room_status FROM Bed b JOIN Room r ON r.room_id=b.room_id WHERE b.bed_id=?", bedId);
        if (!"Active".equals(bed.get("status")) || !"Active".equals(bed.get("roomStatus"))) throw new WorkflowException(409, "Giường đang bảo trì nên không đổi được trạng thái sử dụng.");
        return w.update("UPDATE Bed SET use_state=?,use_state_updated_at=SYSDATETIME() WHERE bed_id=?", useState, bedId) == 1;
    }
    public boolean updateRoomStatus(int roomId, String status) {
        throw new WorkflowException(409, "Trạng thái phòng (hoạt động/bảo trì) do quản lý đổi trong Phòng & giường.");
    }
}
