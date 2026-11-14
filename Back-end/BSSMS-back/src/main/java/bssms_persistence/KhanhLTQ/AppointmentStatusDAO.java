package bssms_persistence.KhanhLTQ;

import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import java.sql.SQLException;
import java.util.*;

public class AppointmentStatusDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    public void confirm(int id) throws SQLException {
        Workflow w = workflow();
        w.roles("Receptionist");
        w.transaction(() -> {
            String block = Timing.confirm(new Timing.Appt(w.one("SELECT status,appointment_date,start_time,created_at FROM Appointment WHERE appointment_id=?", id)));
            if (block != null) throw new WorkflowException(409, block);
            String busy = new BookingWorkflow(w).recheck(id);
            if (busy != null) throw new WorkflowException(409, "Khung giờ của lịch không còn trống (" + busy + "). Hãy đổi lịch sang giờ khác hoặc hủy lịch.");
            if (w.update("UPDATE Appointment SET status='Confirmed',confirmed_at=SYSDATETIME() WHERE appointment_id=? AND status='Pending'", id) != 1)
                throw new WorkflowException(409, "Lịch không còn ở trạng thái chờ xác nhận (có thể đã tự hủy theo BR-09).");
            w.history(id, "Pending", "Confirmed", "Lễ tân xác nhận");
            return null;
        });
    }

    public void noShow(int id) throws SQLException {
        Workflow w = workflow();
        w.roles("Receptionist");
        w.transaction(() -> {
            Map<String, Object> a = w.one("SELECT status,appointment_date,start_time FROM Appointment WHERE appointment_id=?", id);
            String block = Timing.noShow(new Timing.Appt(a));
            if (block != null) throw new WorkflowException(409, block);
            w.update("UPDATE Appointment SET status='No-show' WHERE appointment_id=?", id);
            w.history(id, "Confirmed", "No-show", "Khách không đến");
            for (Map<String, Object> i : w.query("SELECT invoice_id FROM Invoice WHERE appointment_id=? AND status='Unpaid'", id))
                new BillingWorkflow(w).cancel(Workflow.id(i.get("invoiceId")), "Khách không đến (No-show)", null);
            return null;
        });
    }

}
