package bssms_persistence.DatTT;

import bssms_catalog.Service;
import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

public class ServiceDAO extends DBContext {

    public List<Service> getAllServices() {
        List<Service> list = new ArrayList<>();
        if (conn == null) {
            System.out.println("Database connection is null in ServiceDAO.getAllServices()");
            return list;
        }
        String sql = "SELECT * FROM Service";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                int serviceId = rs.getInt("service_id");
                String serviceName = rs.getString("service_name");
                double price = rs.getDouble("price");
                String description = rs.getString("description");
                int duration = rs.getInt("duration");
                String status = rs.getString("status");
                list.add(new Service(serviceId, serviceName, description, price, duration, status));
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public Service getServiceById(int id) {
        if (conn == null) {
            System.out.println("Database connection is null in ServiceDAO.getServiceById()");
            return null;
        }
        String sql = "SELECT * FROM Service WHERE service_id = ?";
        try {
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                String serviceName = rs.getString("service_name");
                String description = rs.getString("description");
                double price = rs.getDouble("price");
                int duration = rs.getInt("duration");
                String status = rs.getString("status");
                Service s = new Service(id, serviceName, description, price, duration, status);
                rs.close();
                ps.close();
                return s;
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public int addService(Service s) throws Exception {
        if (conn == null) {
            throw new Exception("Database connection is null in ServiceDAO.addService()");
        }
        
        String sql = "INSERT INTO Service (service_name, description, price, duration, status) VALUES (?, ?, ?, ?, ?)";
        PreparedStatement ps = conn.prepareStatement(sql);
        
        ps.setString(1, s.getServiceName());
        ps.setString(2, s.getDescription());
        ps.setDouble(3, s.getPrice());
        ps.setInt(4, s.getDuration());
        ps.setString(5, s.getStatus());
        
        int rows = ps.executeUpdate();
        ps.close();
        return rows;
    }

    public int updateService(Service s) throws Exception {
        if (conn == null) {
            throw new Exception("Database connection is null in ServiceDAO.updateService()");
        }
      
        String sql = "UPDATE Service SET service_name = ?, description = ?, price = ?, duration = ?, status = ? WHERE service_id = ?";
        
        PreparedStatement ps = conn.prepareStatement(sql);

        ps.setString(1, s.getServiceName());
        ps.setString(2, s.getDescription());
        ps.setDouble(3, s.getPrice());
        ps.setInt(4, s.getDuration());
        ps.setString(5, s.getStatus());
        ps.setInt(6, s.getServiceId()); 
        
        int rows = ps.executeUpdate();
        ps.close();
        return rows;
    }

    public int deleteService(int id) throws Exception {
        if (conn == null) {
            throw new Exception("Database connection is null in ServiceDAO.deleteService()");
        }
        String sql = "DELETE FROM Service WHERE service_id = ?";
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setInt(1, id);
        int rows = ps.executeUpdate();
        ps.close();
        return rows;
    }
}
