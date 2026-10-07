package bssms_persistence.DatNT;

import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class PasswordDAO extends DBContext {

    public boolean changePassword(int accountId, String oldPasswordHashed, String newPasswordHashed) {
        // 1. Kiểm tra xem mật khẩu cũ có đúng không
        String checkSql = "SELECT account_id FROM Account WHERE account_id = ? AND password = ?";
        // 2. Lệnh cập nhật mật khẩu mới
        String updateSql = "UPDATE Account SET password = ? WHERE account_id = ?";
        
        try {
            if (conn != null) {
                // Kiểm tra mật khẩu cũ
                PreparedStatement psCheck = conn.prepareStatement(checkSql);
                psCheck.setInt(1, accountId);
                psCheck.setString(2, oldPasswordHashed);
                ResultSet rs = psCheck.executeQuery();
                
                // Nếu tìm thấy account với mật khẩu cũ hợp lệ
                if (rs.next()) {
                    // Tiến hành cập nhật mật khẩu mới
                    PreparedStatement psUpdate = conn.prepareStatement(updateSql);
                    psUpdate.setString(1, newPasswordHashed);
                    psUpdate.setInt(2, accountId);
                    
                    int rowsAffected = psUpdate.executeUpdate();
                    return rowsAffected > 0; // Trả về true nếu cập nhật thành công
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }
}