package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * @author HienLNM
 */
public class TreatmentOutcomeDAO extends DBContext {

    /**
     * Kiểm tra appointment có tồn tại hay không.
     */
    public boolean appointmentExists(int appointmentId) {
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
            e.printStackTrace();
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
<<<<<<< Updated upstream
        if (conn == null) {
            throw new Exception("Database connection is null in TreatmentOutcomeDAO.recordOutcome()");
        }
        if (notes == null || notes.trim().isEmpty()) {
            throw new Exception("Ket qua dieu tri (notes) khong duoc de trong");
        }
        if (status == null || status.trim().isEmpty()) {
            throw new Exception("Trang thai appointment khong duoc de trong");
        }

        String sql = "UPDATE Appointment SET notes = ?, status = ? WHERE appointment_id = ?";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setString(1, notes);
            ps.setString(2, status);
            ps.setInt(3, appointmentId);
            int rows = ps.executeUpdate();
            ps.close();
            return rows > 0;
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
=======
        workflow().roles("Technician");
        workflow().appointmentAccess(appointmentId);
        if (!"In-progress".equals(status) && !"Completed".equals(status))
            throw new IllegalArgumentException("Chỉ được bắt đầu hoặc hoàn thành điều trị.");
        if ("Completed".equals(status) && (notes==null || notes.trim().isEmpty()))
            throw new IllegalArgumentException("Vui lòng nhập kết quả điều trị.");
        if (notes!=null && notes.length()>500) throw new IllegalArgumentException("Kết quả tối đa 500 ký tự.");
        workflow().call("usp_ChangeAppointmentStatus",requireActorAccountId(),appointmentId,status,null,notes,null);
        return true;
>>>>>>> Stashed changes
    }

    /**
     * Lấy kết quả điều trị (notes + status) của 1 appointment.
     */
    public String getOutcomeByAppointmentId(int appointmentId) {
<<<<<<< Updated upstream
        if (conn == null) {
            System.out.println("Database connection is null in TreatmentOutcomeDAO.getOutcomeByAppointmentId()");
            return null;
        }
        String sql = "SELECT notes, status FROM Appointment WHERE appointment_id = ?";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setInt(1, appointmentId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                String notes = rs.getString("notes");
                String status = rs.getString("status");
                rs.close();
                ps.close();
                return notes + "|||" + status;
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
=======
        try {
            workflow().appointmentAccess(appointmentId);
            java.util.Map<String,Object> row=workflow().one("SELECT a.status,tr.result_notes FROM Appointment a LEFT JOIN " + bssms_persistence.common.SchemaSql.TREATMENTS + " tr ON tr.appointment_id=a.appointment_id WHERE a.appointment_id=?",appointmentId);
            return java.util.Objects.toString(row.get("resultNotes"),"")+"|||"+row.get("status");
        } catch(java.sql.SQLException e) {throw new DataAccessException(e);}
>>>>>>> Stashed changes
    }
}
