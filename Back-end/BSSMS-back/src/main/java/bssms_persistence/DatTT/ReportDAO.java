/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_persistence.DatTT;
import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.HashMap;
import java.util.Map;
/**
 *
 * @author Trần Thành Đạt - CE200857
 */
public class ReportDAO extends DBContext {

    public Map<String, Object> getDashboardMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        try {
            if (conn != null) {
                // 1. Tổng số khách hàng
                String sqlCustomers = "SELECT COUNT(*) AS total_customers FROM Customer";
                PreparedStatement ps1 = conn.prepareStatement(sqlCustomers);
                ResultSet rs1 = ps1.executeQuery();
                if (rs1.next()) metrics.put("totalCustomers", rs1.getInt("total_customers"));

                // 2. Tổng doanh thu từ các lịch hẹn đã hoàn thành (Ví dụ)
                String sqlRevenue = "SELECT SUM(s.price) AS total_revenue FROM Appointment a JOIN Service s ON a.service_id = s.service_id WHERE a.status = 'Completed'";
                PreparedStatement ps2 = conn.prepareStatement(sqlRevenue);
                ResultSet rs2 = ps2.executeQuery();
                if (rs2.next()) metrics.put("totalRevenue", rs2.getDouble("total_revenue"));

                // 3. Tổng lịch hẹn trong ngày hôm nay
                String sqlAppointments = "SELECT COUNT(*) AS today_appointments FROM Appointment WHERE CAST(appointment_date AS DATE) = CAST(GETDATE() AS DATE)";
                PreparedStatement ps3 = conn.prepareStatement(sqlAppointments);
                ResultSet rs3 = ps3.executeQuery();
                if (rs3.next()) metrics.put("todayAppointments", rs3.getInt("today_appointments"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return metrics;
    }
}
