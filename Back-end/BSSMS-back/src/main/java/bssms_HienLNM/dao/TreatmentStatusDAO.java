package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author HienLNM
 */
public class TreatmentStatusDAO extends DBContext {

    
    public List<Map<String, Object>> getTreatmentStatusList(Integer customerId, String status,
                                                            String fromDate, String toDate) {
        List<Map<String, Object>> list = new ArrayList<>();
        if (conn == null) {
            System.out.println("Database connection is null in TreatmentStatusDAO.getTreatmentStatusList()");
            return list;
        }

        StringBuilder sql = new StringBuilder(
                "SELECT a.appointment_id, a.customer_id, c.full_name AS customer_name, "
              + "a.service_id, s.service_name, "
              + "a.customer_package_id, tp.package_name, "
              + "a.room_id, r.room_name, a.bed_id, b.bed_number, "
              + "a.appointment_date, a.start_time, a.end_time, a.status, a.notes "
              + "FROM Appointment a "
              + "JOIN Customer c ON a.customer_id = c.customer_id "
              + "LEFT JOIN Service s ON a.service_id = s.service_id "
              + "LEFT JOIN CustomerPackage cp ON a.customer_package_id = cp.customer_package_id "
              + "LEFT JOIN TreatmentPackage tp ON cp.treatment_package_id = tp.treatment_package_id "
              + "LEFT JOIN Room r ON a.room_id = r.room_id "
              + "LEFT JOIN Bed b ON a.bed_id = b.bed_id "
              + "WHERE 1=1 ");

        List<Object> params = new ArrayList<>();
        if (customerId != null) {
            sql.append("AND a.customer_id = ? ");
            params.add(customerId);
        }
        if (status != null && !status.isEmpty()) {
            sql.append("AND a.status = ? ");
            params.add(status);
        }
        if (fromDate != null && !fromDate.isEmpty()) {
            sql.append("AND a.appointment_date >= ? ");
            params.add(java.sql.Date.valueOf(fromDate));
        }
        if (toDate != null && !toDate.isEmpty()) {
            sql.append("AND a.appointment_date <= ? ");
            params.add(java.sql.Date.valueOf(toDate));
        }
        sql.append("ORDER BY a.appointment_date DESC, a.start_time DESC");

        try {
            PreparedStatement ps = conn.prepareStatement(sql.toString());
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> map = new HashMap<>();
                map.put("appointmentId", rs.getInt("appointment_id"));
                map.put("customerId", rs.getInt("customer_id"));
                map.put("customerName", rs.getString("customer_name"));
                map.put("serviceId", rs.getObject("service_id"));
                map.put("serviceName", rs.getString("service_name"));
                map.put("customerPackageId", rs.getObject("customer_package_id"));
                map.put("packageName", rs.getString("package_name"));
                map.put("roomId", rs.getObject("room_id"));
                map.put("roomName", rs.getString("room_name"));
                map.put("bedId", rs.getObject("bed_id"));
                map.put("bedNumber", rs.getString("bed_number"));
                map.put("appointmentDate", rs.getDate("appointment_date"));
                map.put("startTime", rs.getTime("start_time"));
                map.put("endTime", rs.getTime("end_time"));
                map.put("status", rs.getString("status"));
                map.put("notes", rs.getString("notes"));
                list.add(map);
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Lấy chi tiết 1 buổi điều trị theo appointmentId.
     */
    public Map<String, Object> getTreatmentStatusById(int appointmentId) {
        if (conn == null) {
            System.out.println("Database connection is null in TreatmentStatusDAO.getTreatmentStatusById()");
            return null;
        }

        String sql = "SELECT a.appointment_id, a.customer_id, c.full_name AS customer_name, "
                   + "a.service_id, s.service_name, "
                   + "a.customer_package_id, tp.package_name, "
                   + "a.room_id, r.room_name, a.bed_id, b.bed_number, "
                   + "a.appointment_date, a.start_time, a.end_time, a.status, a.notes "
                   + "FROM Appointment a "
                   + "JOIN Customer c ON a.customer_id = c.customer_id "
                   + "LEFT JOIN Service s ON a.service_id = s.service_id "
                   + "LEFT JOIN CustomerPackage cp ON a.customer_package_id = cp.customer_package_id "
                   + "LEFT JOIN TreatmentPackage tp ON cp.treatment_package_id = tp.treatment_package_id "
                   + "LEFT JOIN Room r ON a.room_id = r.room_id "
                   + "LEFT JOIN Bed b ON a.bed_id = b.bed_id "
                   + "WHERE a.appointment_id = ?";

        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setInt(1, appointmentId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                Map<String, Object> map = new HashMap<>();
                map.put("appointmentId", rs.getInt("appointment_id"));
                map.put("customerId", rs.getInt("customer_id"));
                map.put("customerName", rs.getString("customer_name"));
                map.put("serviceId", rs.getObject("service_id"));
                map.put("serviceName", rs.getString("service_name"));
                map.put("customerPackageId", rs.getObject("customer_package_id"));
                map.put("packageName", rs.getString("package_name"));
                map.put("roomId", rs.getObject("room_id"));
                map.put("roomName", rs.getString("room_name"));
                map.put("bedId", rs.getObject("bed_id"));
                map.put("bedNumber", rs.getString("bed_number"));
                map.put("appointmentDate", rs.getDate("appointment_date"));
                map.put("startTime", rs.getTime("start_time"));
                map.put("endTime", rs.getTime("end_time"));
                map.put("status", rs.getString("status"));
                map.put("notes", rs.getString("notes"));
                rs.close();
                ps.close();
                return map;
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
