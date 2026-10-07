package bssms_security;

import java.security.MessageDigest;

/**
 * 
 * @author Nguyen Tien Dat - CE200858
 */
public class PasswordUtil {
    
    public static String hashMD5(String pass) {
        if (pass == null) {
            return null;
        }
        String hash = "";
        try {
            MessageDigest md = MessageDigest.getInstance("md5");
            byte[] bytes = md.digest(pass.getBytes());
            for (byte b : bytes) {
                hash += String.format("%02x", b);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return hash;
    }
}