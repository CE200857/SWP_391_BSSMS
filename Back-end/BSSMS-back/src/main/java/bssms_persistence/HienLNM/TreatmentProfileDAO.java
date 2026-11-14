package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import java.sql.SQLException;
import java.util.*;

public class TreatmentProfileDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    private Workflow staffAccess(int customerId) throws SQLException {
        Workflow w = workflow();
        w.roles("Receptionist", "Technician", "Manager");
        w.customerAccess(customerId);
        return w;
    }

    public Map<String, Object> getTreatmentSummary(int customerId) throws SQLException {
        Workflow w = staffAccess(customerId);
        Map<String, Object> r = new LinkedHashMap<>(w.one("SELECT c.customer_id,c.full_name,c.date_of_birth,c.gender,c.phone,c.email,c.skin_condition,c.allergies,c.notes,c.lifetime_spending,t.tier_name,"
                + "(SELECT COUNT(*) FROM Appointment WHERE customer_id=c.customer_id) AS total_appointments,"
                + "(SELECT COUNT(*) FROM Appointment WHERE customer_id=c.customer_id AND status='Completed') AS completed_appointments,"
                + "(SELECT COUNT(*) FROM Appointment WHERE customer_id=c.customer_id AND status IN ('Pending','Confirmed')) AS upcoming_appointments,"
                + "(SELECT COUNT(*) FROM CustomerPackage WHERE customer_id=c.customer_id AND status='Active') AS active_packages,"
                + "(SELECT COALESCE(SUM(remaining_sessions),0) FROM CustomerPackage WHERE customer_id=c.customer_id AND status='Active') AS total_remaining_sessions "
                + "FROM Customer c JOIN MembershipTier t ON t.membership_tier_id=c.membership_tier_id WHERE c.customer_id=?", customerId));
        r.put("packages", w.query("SELECT cp.customer_package_id,tp.package_name,cp.total_sessions,cp.remaining_sessions,cp.expiry_date,cp.status FROM CustomerPackage cp JOIN TreatmentPackage tp ON tp.treatment_package_id=cp.treatment_package_id WHERE cp.customer_id=? ORDER BY cp.purchase_date DESC", customerId));
        r.put("recentResults", getTreatmentHistory(customerId).stream().limit(5).collect(java.util.stream.Collectors.toList()));
        return r;
    }

    public List<Map<String, Object>> getTreatmentHistory(int customerId) throws SQLException {
        Workflow w = staffAccess(customerId);
        return w.query("SELECT l.appointment_service_id,a.appointment_id,a.appointment_date,l.start_time,s.service_name,st.full_name AS technician_name,l.result_notes,l.skin_reaction,l.done_at,"
                + "(SELECT COUNT(*) FROM TreatmentPhoto p WHERE p.appointment_service_id=l.appointment_service_id) AS photo_count "
                + "FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id JOIN Service s ON s.service_id=l.service_id LEFT JOIN Staff st ON st.staff_id=l.technician_id "
                + "WHERE a.customer_id=? AND l.status='Done' ORDER BY l.done_at DESC", customerId);
    }

    public List<Map<String, Object>> getTreatmentProfilesByCustomerId(int customerId) throws SQLException {
        Workflow w = workflow();
        w.roles("Receptionist", "Technician", "Manager");
        return w.query("SELECT c.customer_id,c.full_name AS customer_name,c.phone,c.skin_condition,c.allergies,"
                + "(SELECT MAX(a.appointment_date) FROM Appointment a WHERE a.customer_id=c.customer_id AND a.status='Completed') AS last_visit "
                + "FROM " + SchemaSql.CUSTOMERS + " c WHERE (?=0 OR c.customer_id=?) AND EXISTS(SELECT 1 FROM " + SchemaSql.ACCOUNTS + " ac WHERE ac.account_id=? AND (ac.role IN ('Receptionist','Manager') OR "
                + "(ac.role='Technician' AND EXISTS(SELECT 1 FROM Appointment a JOIN AppointmentService l ON l.appointment_id=a.appointment_id WHERE a.customer_id=c.customer_id AND l.technician_id=ac.staff_id)))) ORDER BY c.full_name",
                customerId, customerId, w.actor);
    }

    public boolean updateHealthProfile(int customerId, String skinCondition, String allergies, String notes) throws SQLException {
        Workflow w = workflow();
        w.roles("Receptionist", "Manager");
        for (String v : new String[]{skinCondition, allergies, notes})
            if (v != null && v.length() > 1000) throw new IllegalArgumentException("Mỗi mục tối đa 1000 ký tự.");
        return w.update("UPDATE Customer SET skin_condition=?,allergies=?,notes=? WHERE customer_id=? AND status<>'Pending'",
                blank(skinCondition), blank(allergies), blank(notes), customerId) == 1;
    }
    private static String blank(String v) { return v == null || v.isBlank() ? null : v.trim(); }
}
