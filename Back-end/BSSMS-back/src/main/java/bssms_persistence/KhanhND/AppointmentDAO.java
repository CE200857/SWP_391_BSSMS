package bssms_persistence.KhanhND;

import java.sql.PreparedStatement;
import bssms_booking.Appointment;
import bssms_persistence.common.ModelRows;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Time;
import java.sql.Types;
import java.time.LocalDate;
import java.time.LocalTime;

import bssms_persistence.DBContext;
import bssms_persistence.common.DataAccessException;

public class AppointmentDAO extends DBContext implements AutoCloseable {

    private void requireConnection() {
        if (conn == null) throw new DataAccessException("Database connection unavailable");
    }
    @Override public void close() throws java.sql.SQLException { if (conn != null) conn.close(); }

    // View Appointment List
    public List<Appointment> getAllAppointmentDetails() {
        try {return workflow().query(ModelRows::appointment, "SELECT a.*,tr.result_notes,c.full_name AS customer_name,c.phone AS customer_phone,s.service_name,s.price AS service_price,st.full_name AS staff_name,ast.staff_id,r.room_name,b.bed_number FROM Appointment a LEFT JOIN " + bssms_persistence.common.SchemaSql.TREATMENTS + " tr ON tr.appointment_id=a.appointment_id JOIN " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c ON c.customer_id=a.customer_id JOIN Service s ON s.service_id=a.service_id LEFT JOIN AppointmentStaff ast ON ast.appointment_id=a.appointment_id AND ast.role='Main Technician' LEFT JOIN " + bssms_persistence.common.SchemaSql.STAFF + " st ON st.staff_id=ast.staff_id LEFT JOIN Room r ON r.room_id=a.room_id LEFT JOIN Bed b ON b.bed_id=a.bed_id WHERE "+bssms_persistence.common.Workflow.appointmentScope()+" ORDER BY a.appointment_date DESC,a.start_time",requireActorAccountId());}
        catch(java.sql.SQLException e) {throw new DataAccessException(e);}
    }

    // View Appointment Details
    public Appointment getAppointmentDetails(int appointmentId) {
        try {return workflow().one(ModelRows::appointment, "SELECT a.*,tr.result_notes,c.full_name AS customer_name,c.phone AS customer_phone,s.service_name,s.price AS service_price,st.full_name AS staff_name,ast.staff_id,r.room_name,b.bed_number FROM Appointment a LEFT JOIN " + bssms_persistence.common.SchemaSql.TREATMENTS + " tr ON tr.appointment_id=a.appointment_id JOIN " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c ON c.customer_id=a.customer_id JOIN Service s ON s.service_id=a.service_id LEFT JOIN AppointmentStaff ast ON ast.appointment_id=a.appointment_id AND ast.role='Main Technician' LEFT JOIN " + bssms_persistence.common.SchemaSql.STAFF + " st ON st.staff_id=ast.staff_id LEFT JOIN Room r ON r.room_id=a.room_id LEFT JOIN Bed b ON b.bed_id=a.bed_id WHERE a.appointment_id=? AND "+bssms_persistence.common.Workflow.appointmentScope(),appointmentId,requireActorAccountId());}
        catch(java.sql.SQLException e) {throw new DataAccessException(e);}
    }

    // Reschedule Appointment
    public boolean rescheduleAppointment(
            int appointmentId,
            String appointmentDate,
            String startTime,
            String endTime) {
        try {
            bssms_persistence.common.Workflow w=workflow();w.roles("Customer","Receptionist");w.appointmentAccess(appointmentId);
            Appointment a=w.one(ModelRows::appointment, "SELECT a.*,ast.staff_id FROM Appointment a JOIN AppointmentStaff ast ON ast.appointment_id=a.appointment_id AND ast.role='Main Technician' WHERE a.appointment_id=?",appointmentId);
            new bssms_persistence.common.BookingWorkflow(conn,requireActorAccountId()).save(a.getCustomerId(),a.getServiceId(),a.getCustomerPackageId(),appointmentDate,startTime,a.getStaffId(),a.getBedId(),appointmentId,null);
            return true;
        } catch(java.sql.SQLException e) {throw new DataAccessException(e);}
    }

    // Cancel Appointment
    public boolean cancelAppointment(int appointmentId, String cancellationReason) {
        try {workflow().call("usp_ChangeAppointmentStatus",requireActorAccountId(),appointmentId,"Cancelled",cancellationReason,null,null);return true;}
        catch(java.sql.SQLException e) {throw new DataAccessException(e);}
    }

    // Create Walk-in Appointment
    public Appointment createWalkInAppointment(
            int customerId,
            int serviceId,
            Integer customerPackageId,
            String appointmentDate,
            String startTime,
            Integer technicianId,
            String notes) throws Exception {
        return new bssms_persistence.common.BookingWorkflow(conn,requireActorAccountId()).save(customerId,serviceId,customerPackageId,appointmentDate,startTime,technicianId,null,null,notes);
    }

// Check that the customer exists and is active.
}
