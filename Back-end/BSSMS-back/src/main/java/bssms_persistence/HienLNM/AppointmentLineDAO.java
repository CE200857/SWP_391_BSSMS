package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Các dịch vụ (dòng) trong một lịch hẹn: xem, thêm dịch vụ, xóa dịch vụ đã thêm. Quy tắc nghiệp vụ nằm trong các thủ tục SQL. */
public class AppointmentLineDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    /** Danh sách dịch vụ của lịch hẹn kèm người phụ trách từng dịch vụ; chỉ người có quyền xem lịch hẹn đó mới xem được. */
    public List<Map<String, Object>> lines(int appointmentId) throws SQLException {
        workflow().appointmentAccess(appointmentId);
        List<Map<String, Object>> lines = workflow().query(
            "SELECT l.line_no,l.service_id,s.service_name,l.start_time,l.end_time,l.unit_price,r.room_name,b.bed_number "
          + "FROM dbo.vw_AppointmentLine l JOIN dbo.Service s ON s.service_id=l.service_id "
          + "LEFT JOIN dbo.Room r ON r.room_id=l.room_id LEFT JOIN dbo.Bed b ON b.bed_id=l.bed_id "
          + "WHERE l.appointment_id=? ORDER BY l.line_no",
            appointmentId);
        List<Map<String, Object>> staff = workflow().query(
            "SELECT x.line_no,x.staff_id,st.full_name,x.role FROM dbo.vw_AppointmentLineStaff x JOIN dbo.Staff st ON st.staff_id=x.staff_id "
          + "WHERE x.appointment_id=? ORDER BY x.line_no,CASE x.role WHEN 'Main' THEN 0 ELSE 1 END,st.full_name",
            appointmentId);
        Map<Integer, List<Map<String, Object>>> byLine = new HashMap<>();
        for (Map<String, Object> row : staff) {
            byLine.computeIfAbsent(((Number) row.get("lineNo")).intValue(), k -> new ArrayList<>()).add(row);
        }
        for (Map<String, Object> line : lines) {
            line.put("staff", byLine.getOrDefault(((Number) line.get("lineNo")).intValue(), new ArrayList<>()));
        }
        return lines;
    }

    /** Thêm dịch vụ vào cuối lịch hẹn; hệ thống tự chọn phòng, giường trống đúng loại và kỹ thuật viên đang rảnh. */
    public void add(int appointmentId, int serviceId) throws SQLException {
        workflow().roles("Customer", "Receptionist");
        workflow().call("usp_AddAppointmentService", requireActorAccountId(), appointmentId, serviceId);
    }

    public void remove(int appointmentId, int serviceId) throws SQLException {
        workflow().roles("Customer", "Receptionist");
        workflow().call("usp_RemoveAppointmentService", requireActorAccountId(), appointmentId, serviceId);
    }
}
