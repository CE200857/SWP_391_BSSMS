package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * @author HienLNM
 */
public class TreatmentOutcomeDAO extends DBContext implements AutoCloseable {

    private void requireConnection() {
        if (conn == null) throw new DataAccessException("Database connection unavailable");
    }
    @Override public void close() throws java.sql.SQLException { if (conn != null) conn.close(); }

    /**
     * Kiểm tra appointment có tồn tại hay không.
     */
    public boolean appointmentExists(int appointmentId) {
        requireConnection();
        if (conn == null) {
            System.out.println("Database connection is null in TreatmentOutcomeDAO.appointmentExists()");
            return false;
        }
        String sql = "SELECT COUNT(*) FROM Appointment WHERE appointment_id = ?";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setInt(1, appointmentId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                int count = rs.getInt(1);
                rs.close();
                ps.close();
                return count > 0;
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
        }
        return false;
    }

    /**
     * Ghi nhận kết quả điều trị: cập nhật notes + status của Appointment.
     *
     * @param appointmentId
     * @param notes Kết quả điều trị (lưu vào Appointment.notes)
     * @param status Trạng thái mới của appointment, ví dụ 'Completed'
     * @return true nếu cập nhật thành công
     */
    public boolean recordOutcome(int appointmentId, String notes, String status) throws Exception {
        workflow().roles("Technician");
        workflow().appointmentAccess(appointmentId);
        if (!"In-progress".equals(status) && !"Completed".equals(status))
            throw new IllegalArgumentException("Chỉ được bắt đầu hoặc hoàn thành điều trị.");
        if ("Completed".equals(status) && (notes==null || notes.trim().isEmpty()))
            throw new IllegalArgumentException("Vui lòng nhập kết quả điều trị.");
        if (notes!=null && notes.length()>500) throw new IllegalArgumentException("Kết quả tối đa 500 ký tự.");
        workflow().call("usp_ChangeAppointmentStatus",requireActorAccountId(),appointmentId,status,null,notes,null);
        return true;
    }

    /**
     * Lấy kết quả điều trị (notes + status) của 1 appointment.
     */
    public String getOutcomeByAppointmentId(int appointmentId) {
        try {
            workflow().appointmentAccess(appointmentId);
            java.util.Map<String,Object> row=workflow().one("SELECT a.status,tr.result_notes FROM Appointment a LEFT JOIN " + bssms_persistence.common.SchemaSql.TREATMENTS + " tr ON tr.appointment_id=a.appointment_id WHERE a.appointment_id=?",appointmentId);
            return java.util.Objects.toString(row.get("resultNotes"),"")+"|||"+row.get("status");
        } catch(java.sql.SQLException e) {throw new DataAccessException(e);}
    }
}
