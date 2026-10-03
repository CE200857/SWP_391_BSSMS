package bssms_persistence.DatNT;

import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CustomerDAO extends DBContext {

    // Lấy danh sách kết hợp trả về dạng Map để đẩy thẳng ra JSON (UC-15)
    public List<Map<String, Object>> getAllCustomerDetails() {
        List<Map<String, Object>> list = new ArrayList<>();
        // Đã sửa c.phone thành a.phone
        String query = "SELECT c.customer_id, c.full_name, a.phone, a.email, a.status "
                     + "FROM Customer c "
                     + "JOIN Account a ON c.account_id = a.account_id";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("customerId", rs.getInt("customer_id"));
                    map.put("fullName", rs.getString("full_name"));
                    map.put("phone", rs.getString("phone")); // Vẫn lấy tên cột là "phone" từ kết quả
                    map.put("email", rs.getString("email"));
                    map.put("status", rs.getString("status"));
                    
                    list.add(map);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    // Xóa/Vô hiệu hóa khách hàng (UC-17) - Giữ nguyên
    public boolean deactivateCustomer(int customerId) {
        String query = "UPDATE Account SET status = 'Inactive' "
                     + "WHERE account_id = (SELECT account_id FROM Customer WHERE customer_id = ?)";
        try {
            if (conn != null) {
                PreparedStatement ps = conn.prepareStatement(query);
                ps.setInt(1, customerId);
                int rowsAffected = ps.executeUpdate();
                return rowsAffected > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }
}