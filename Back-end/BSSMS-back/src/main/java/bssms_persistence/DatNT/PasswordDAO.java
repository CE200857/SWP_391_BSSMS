package bssms_persistence.DatNT;

import bssms_persistence.DBContext;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class PasswordDAO extends DBContext {

    public boolean changePassword(int accountId, String oldPasswordHashed, String newPasswordHashed) {
        String checkSql = "SELECT account_id FROM Account WHERE account_id = ? AND password = ?";
        String updateSql = "UPDATE Account SET password = ? WHERE account_id = ?";
        
        try {
            if (conn != null) {
                PreparedStatement psCheck = conn.prepareStatement(checkSql);
                psCheck.setInt(1, accountId);
                psCheck.setString(2, oldPasswordHashed);
                ResultSet rs = psCheck.executeQuery();
                
                if (rs.next()) {
                    PreparedStatement psUpdate = conn.prepareStatement(updateSql);
                    psUpdate.setString(1, newPasswordHashed);
                    psUpdate.setInt(2, accountId);
                    
                    int rowsAffected = psUpdate.executeUpdate();
                    return rowsAffected > 0;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }
}