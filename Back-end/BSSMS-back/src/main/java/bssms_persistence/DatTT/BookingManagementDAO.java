package bssms_persistence.DatTT;

import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import java.sql.SQLException;
import java.util.*;

public class BookingManagementDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    private BookingWorkflow booking() { return new BookingWorkflow(workflow()); }

    public Map<String, Object> slots(List<Integer> serviceIds, String date, Integer technician, Integer excludeAppointment) throws SQLException {
        Workflow w = workflow();
        String role = w.role();
        if (!Arrays.asList("Customer", "Receptionist", "Manager").contains(role)) throw new WorkflowException(403, "Role not permitted.");
        if (excludeAppointment != null) w.appointmentAccess(excludeAppointment);
        return new BookingWorkflow(w).slots(serviceIds, date, technician, excludeAppointment, "Customer".equals(role));
    }

    public int createOnline(List<BookingWorkflow.LineInput> lines, String date, String start, Integer technician, String paymentChoice, String notes) throws SQLException {
        Workflow w = workflow();
        w.roles("Customer");
        return new BookingWorkflow(w).create(w.customerId(), lines, date, start, technician, paymentChoice, notes, null);
    }

    public Map<String, Object> checkInPlan(int appointment) throws SQLException {
        workflow().roles("Receptionist");
        return booking().checkInPlan(appointment);
    }

    public void checkIn(int appointment, Map<Integer, Integer> technicians, Map<Integer, Integer> beds) throws SQLException {
        workflow().roles("Receptionist");
        booking().checkIn(appointment, technicians, beds);
    }

    public Map<String, Object> openInvoice(int appointmentId) throws SQLException {
        List<Map<String, Object>> rows = workflow().query("SELECT invoice_id,total_amount,status FROM Invoice WHERE appointment_id=? AND status='Unpaid'", appointmentId);
        return rows.isEmpty() ? null : rows.get(0);
    }
}
