package bssms_persistence.KhanhLTQ;

import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import java.sql.SQLException;
import java.util.*;

public class CoordinationDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    private BookingWorkflow booking() { return new BookingWorkflow(workflow()); }

    public Map<String, Object> board(String date) throws SQLException {
        workflow().roles("Receptionist", "Manager");
        return booking().board(date);
    }

    public List<Map<String, Object>> affected() throws SQLException {
        workflow().roles("Receptionist", "Manager");
        return booking().affected();
    }
    public Map<String, Object> replacementOptions(int appointment) throws SQLException {
        workflow().roles("Receptionist", "Manager");
        return booking().replacementOptions(appointment);
    }
    public void reassign(int appointment, Map<Integer, Integer> technicians, Map<Integer, Integer> beds) throws SQLException {
        workflow().roles("Receptionist");
        booking().reassign(appointment, technicians, beds);
    }
}
