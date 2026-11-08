package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import bssms_persistence.common.Workflow;
import java.sql.SQLException;
import java.util.LinkedHashMap;
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
    public Map<String, Object> getAllRoomsWithBeds() {
        requireConnection();
        Workflow workflow = workflow();
        try {
            List<Map<String, Object>> rooms = workflow.query(
                "DECLARE @today date=CONVERT(date,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time'); "
                    + "DECLARE @now time=CONVERT(time,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time'); "
                    + "SELECT r.room_id,r.room_name,r.room_type,r.status, "
                    + "u.appointment_id AS current_appointment_id,u.customer_name AS current_customer_name, "
                    + "u.service_name AS current_service_name,u.start_time AS current_start_time,u.end_time AS current_end_time, "
                    + "u.appointment_status AS current_appointment_status, "
                    + "CASE WHEN r.status='Maintenance' THEN 'Maintenance' "
                    + "WHEN u.appointment_status='In-progress' THEN 'InUse' "
                    + "WHEN u.appointment_status='Checked-in' THEN 'CheckedIn' ELSE 'Available' END AS usage_status, "
                    + "CASE WHEN EXISTS(SELECT 1 FROM vw_AppointmentBedUsage a JOIN AppointmentStaff ast ON ast.appointment_id=a.appointment_id "
                    + "JOIN " + bssms_persistence.common.SchemaSql.STAFF + " st ON st.staff_id=ast.staff_id "
                    + "WHERE a.room_id=r.room_id AND st.account_id=? AND a.appointment_date=@today "
                    + "AND a.status NOT IN ('Cancelled','No-show')) THEN 1 ELSE 0 END AS technician_can_update "
                    + "FROM Room r OUTER APPLY (SELECT TOP(1) a.appointment_id,c.full_name AS customer_name,s.service_name, "
                    + "a.start_time,a.end_time,a.status AS appointment_status FROM vw_AppointmentBedUsage a "
                    + "JOIN Appointment ap ON ap.appointment_id=a.appointment_id JOIN Customer c ON c.customer_id=ap.customer_id "
                    + "JOIN vw_AppointmentLine ln ON ln.appointment_id=a.appointment_id AND ln.line_no=a.line_no JOIN Service s ON s.service_id=ln.service_id WHERE a.room_id=r.room_id AND a.appointment_date=@today "
                    + "AND ((a.status='In-progress' AND a.start_time<=@now) "
                    + "OR (a.status='Checked-in' AND a.start_time<=@now AND a.end_time>@now)) "
                    + "ORDER BY CASE WHEN a.status='In-progress' THEN 0 ELSE 1 END,a.start_time) u ORDER BY r.room_id",
                requireActorAccountId()
            );
            List<Map<String, Object>> beds = workflow.query(
                "DECLARE @today date=CONVERT(date,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time'); "
                    + "DECLARE @now time=CONVERT(time,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time'); "
                    + "SELECT b.bed_id,b.room_id,b.bed_number,b.status,r.room_name, "
                    + "u.appointment_id AS current_appointment_id,u.customer_name AS current_customer_name, "
                    + "u.service_name AS current_service_name,u.start_time AS current_start_time,u.end_time AS current_end_time, "
                    + "u.appointment_status AS current_appointment_status, "
                    + "CASE WHEN b.status='Maintenance' OR r.status='Maintenance' THEN 'Maintenance' "
                    + "WHEN u.appointment_status='In-progress' THEN 'InUse' "
                    + "WHEN u.appointment_status='Checked-in' THEN 'CheckedIn' ELSE 'Available' END AS usage_status, "
                    + "CASE WHEN EXISTS(SELECT 1 FROM vw_AppointmentBedUsage a JOIN AppointmentStaff ast ON ast.appointment_id=a.appointment_id "
                    + "JOIN " + bssms_persistence.common.SchemaSql.STAFF + " st ON st.staff_id=ast.staff_id "
                    + "WHERE a.bed_id=b.bed_id AND st.account_id=? AND a.appointment_date=@today "
                    + "AND a.status NOT IN ('Cancelled','No-show')) THEN 1 ELSE 0 END AS technician_can_update "
                    + "FROM Bed b JOIN Room r ON r.room_id=b.room_id "
                    + "OUTER APPLY (SELECT TOP(1) a.appointment_id,c.full_name AS customer_name,s.service_name, "
                    + "a.start_time,a.end_time,a.status AS appointment_status FROM vw_AppointmentBedUsage a "
                    + "JOIN Appointment ap ON ap.appointment_id=a.appointment_id JOIN Customer c ON c.customer_id=ap.customer_id "
                    + "JOIN vw_AppointmentLine ln ON ln.appointment_id=a.appointment_id AND ln.line_no=a.line_no JOIN Service s ON s.service_id=ln.service_id WHERE a.bed_id=b.bed_id AND a.appointment_date=@today "
                    + "AND ((a.status='In-progress' AND a.start_time<=@now) "
                    + "OR (a.status='Checked-in' AND a.start_time<=@now AND a.end_time>@now)) "
                    + "ORDER BY CASE WHEN a.status='In-progress' THEN 0 ELSE 1 END,a.start_time) u "
                    + "ORDER BY r.room_id,b.bed_number",
                requireActorAccountId()
            );
            List<Map<String, Object>> equipment = workflow.query(
                "DECLARE @today date=CONVERT(date,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time'); "
                    + "DECLARE @now time=CONVERT(time,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time'); "
                    + "SELECT e.equipment_id,e.equipment_name,e.description,e.status,e.room_id AS assigned_room_id, "
                    + "COALESCE(u.room_id,e.room_id) AS room_id,COALESCE(u.room_name,assigned.room_name) AS room_name, "
                    + "u.appointment_id AS current_appointment_id,u.customer_name AS current_customer_name, "
                    + "u.service_name AS current_service_name,u.start_time AS current_start_time,u.end_time AS current_end_time, "
                    + "CASE WHEN e.status='Maintenance' THEN 'Maintenance' "
                    + "WHEN u.appointment_id IS NOT NULL THEN 'InUse' ELSE 'Available' END AS usage_status "
                    + "FROM Equipment e LEFT JOIN Room assigned ON assigned.room_id=e.room_id "
                    + "OUTER APPLY (SELECT TOP(1) a.appointment_id,a.room_id,r.room_name,c.full_name AS customer_name, "
                    + "s.service_name,a.start_time,a.end_time FROM AppointmentEquipment ae "
                    + "JOIN Appointment a ON a.appointment_id=ae.appointment_id "
                    + "JOIN Room r ON r.room_id=a.room_id "
                    + "JOIN Customer c ON c.customer_id=a.customer_id "
                    + "JOIN Service s ON s.service_id=a.service_id WHERE ae.equipment_id=e.equipment_id "
                    + "AND a.appointment_date=@today AND a.status='In-progress' AND a.start_time<=@now "
                    + "ORDER BY a.start_time) u ORDER BY e.equipment_name"
            );
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("rooms", rooms);
            result.put("beds", beds);
            result.put("equipment", equipment);
            return result;
        } catch (SQLException e) {
            DataAccessException.rethrowIfDatabase(e);
            throw new DataAccessException(e);
        }
    }


    public boolean updateRoomStatus(int roomId, String status) throws Exception {
        return updateResource(true, roomId, status);
    }
    public boolean updateBedStatus(int bedId, String status) throws Exception {
        return updateResource(false, bedId, status);
    }
    private boolean updateResource(boolean room, int id, String status) throws Exception {
        bssms_persistence.common.Workflow w=workflow();
        w.roles("Manager"); // theo tài liệu (FE-7.3): chỉ Manager quản lý phòng, giường, thiết bị
        if(id<=0 || !java.util.Arrays.asList("Active","Maintenance").contains(status))
            throw new IllegalArgumentException("Trạng thái tài nguyên không hợp lệ.");
        String table=room ? "Room" : "Bed", column=room ? "room_id" : "bed_id";
        return w.transaction(() -> {
            if("Maintenance".equals(status) && !w.query("SELECT a.appointment_id FROM vw_AppointmentBedUsage a WHERE a."+column+"=? AND (a.status IN ('Checked-in','In-progress') OR (a.status IN ('Pending','Confirmed') AND a.appointment_date>=CONVERT(date,SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time')))",id).isEmpty())
                throw new bssms_persistence.common.WorkflowException(409,"Tài nguyên còn lịch hẹn. Nhờ lễ tân chuyển lịch/phân công trước khi bảo trì.");
            return w.update("UPDATE "+table+" SET status=? WHERE "+column+"=?",status,id)==1;
        });
    }
}
