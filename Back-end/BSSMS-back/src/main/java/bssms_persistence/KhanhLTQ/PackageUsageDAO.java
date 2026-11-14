package bssms_persistence.KhanhLTQ;

import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import java.sql.SQLException;
import java.util.*;

public class PackageUsageDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    public List<Map<String, Object>> getCustomerPackagesByCustomerId(int customerId) throws SQLException {
        Workflow w = workflow();
        if ("Customer".equals(w.role())) customerId = w.customerId();
        if (customerId > 0) w.customerAccess(customerId); else w.roles("Manager", "Receptionist");
        List<Map<String, Object>> rows = w.query("SELECT cp.customer_package_id,cp.customer_id,c.full_name AS customer_name,cp.treatment_package_id,tp.package_name,cp.total_sessions,cp.remaining_sessions,"
                + "cp.total_sessions-cp.remaining_sessions AS used_sessions,cp.purchase_date,cp.expiry_date,cp.purchase_price,cp.status,cp.sold_invoice_id,st.full_name AS sold_by "
                + "FROM CustomerPackage cp JOIN Customer c ON c.customer_id=cp.customer_id JOIN TreatmentPackage tp ON tp.treatment_package_id=cp.treatment_package_id LEFT JOIN Staff st ON st.staff_id=cp.sold_by_staff_id "
                + "WHERE (?=0 OR cp.customer_id=?) ORDER BY CASE cp.status WHEN 'Active' THEN 0 ELSE 1 END,cp.purchase_date DESC", customerId, customerId);
        for (Map<String, Object> r : rows)
            r.put("usage", w.query("SELECT l.appointment_service_id,a.appointment_id,a.appointment_date,l.start_time,s.service_name,l.status,st.full_name AS technician_name FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id JOIN Service s ON s.service_id=l.service_id LEFT JOIN Staff st ON st.staff_id=l.technician_id WHERE l.customer_package_id=? AND a.status NOT IN ('Cancelled','No-show') ORDER BY a.appointment_date,l.start_time", r.get("customerPackageId")));
        return rows;
    }

    public List<Map<String, Object>> activePackages(Integer customerId) throws SQLException {
        Workflow w = workflow();
        int customer = customerId == null ? w.customerId() : customerId;
        w.customerAccess(customer);
        List<Map<String, Object>> packages = w.query("SELECT cp.customer_package_id,cp.treatment_package_id,tp.package_name,cp.total_sessions,cp.remaining_sessions,cp.expiry_date,"
                + "cp.remaining_sessions-(SELECT COUNT(*) FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id WHERE l.customer_package_id=cp.customer_package_id AND l.status<>'Done' AND " + SchemaSql.BUSY_APPOINTMENT + ") AS available_sessions "
                + "FROM CustomerPackage cp JOIN TreatmentPackage tp ON tp.treatment_package_id=cp.treatment_package_id "
                + "WHERE cp.customer_id=? AND cp.status='Active' AND cp.remaining_sessions>0 AND cp.expiry_date>=CAST(SYSDATETIME() AS date) ORDER BY cp.expiry_date", customer);
        for (Map<String, Object> p : packages)
            p.put("services", w.query("SELECT s.service_id,s.service_name,s.duration,s.price FROM TreatmentPackageService ps JOIN Service s ON s.service_id=ps.service_id WHERE ps.treatment_package_id=? AND s.status='Active'", p.get("treatmentPackageId")));
        return packages;
    }

}
