package bssms_persistence.HienLNM;

import bssms_catalog.Service;
import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

/**
 * @author HienLNM
 */
public class ServiceStatusDAO extends DBContext {

    public List<Service> getAllServices() {
        List<Service> list = new ArrayList<>();
        if (conn == null) {
            System.out.println("Database connection is null in ServiceStatusDAO.getAllServices()");
            return list;
        }
        String sql = "SELECT service_id, service_name, description, price, duration, status FROM Service";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Service s = new Service();
                s.setServiceId(rs.getInt("service_id"));
                s.setServiceName(rs.getString("service_name"));
                s.setDescription(rs.getString("description"));
                s.setPrice(rs.getDouble("price"));
                s.setDuration(rs.getInt("duration"));
                s.setStatus(rs.getString("status"));
                list.add(s);
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Cập nhật trạng thái Service.
     * @param serviceId
     * @param status trạng thái mới: 'Active' hoặc 'Inactive'
     * @return true nếu cập nhật thành công
     */
    public boolean updateServiceStatus(int serviceId, String status) throws Exception {
        if (conn == null) {
            throw new Exception("Database connection is null in ServiceStatusDAO.updateServiceStatus()");
        }
        if (status == null
                || (!status.equalsIgnoreCase("Active") && !status.equalsIgnoreCase("Inactive"))) {
            throw new Exception("Trang thai service khong hop le. Chi chap nhan 'Active' hoac 'Inactive'");
        }

        String sql = "UPDATE Service SET status = ? WHERE service_id = ?";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setString(1, status);
            ps.setInt(2, serviceId);
            int rows = ps.executeUpdate();
            ps.close();
            return rows > 0;
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }
}
