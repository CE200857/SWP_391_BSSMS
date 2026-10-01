package bssms_common.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;

public class SecurityUtil {
    
    /**
     * Hàm băm (mã hóa) mật khẩu bằng thuật toán SHA-256
     * @param password Mật khẩu gốc người dùng nhập
     * @return Chuỗi mật khẩu đã được mã hóa
     */
    public static String hashPassword(String password) {
        if (password == null) return null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            
            // Chuyển mảng byte thành chuỗi Hex (hệ cơ số 16) để lưu vào Database
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (int i = 0; i < encodedhash.length; i++) {
                String hex = Integer.toHexString(0xff & encodedhash[i]);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Lỗi thuật toán băm mật khẩu: " + e.getMessage());
        }
    }

    /**
     * Hàm kiểm tra mật khẩu người dùng nhập vào lúc Login có khớp với DB không
     * @param plainPassword Mật khẩu người dùng vừa gõ trên web
     * @param hashedPassword Mật khẩu đã mã hóa lấy từ Database lên
     * @return true nếu khớp, false nếu sai mật khẩu
     */
    public static boolean checkPassword(String plainPassword, String hashedPassword) {
        if (plainPassword == null || hashedPassword == null) return false;
        
        // Băm mật khẩu người dùng vừa nhập và so sánh với chuỗi băm trong DB
        String hashedInput = hashPassword(plainPassword);
        return hashedInput.equals(hashedPassword);
    }
    
    // ==========================================
    // HÀM MAIN ĐỂ BẠN CHẠY TEST THỬ NGAY LẬP TỨC
    // ==========================================
    public static void main(String[] args) {
        String myPassword = "123";
        String hashed = hashPassword(myPassword);
        
        System.out.println("Mật khẩu gốc: " + myPassword);
        System.out.println("Mật khẩu sau khi mã hóa lưu vào DB: " + hashed);
        System.out.println("Test đăng nhập đúng pass: " + checkPassword("123", hashed)); // Sẽ in ra true
        System.out.println("Test đăng nhập sai pass: " + checkPassword("1234", hashed)); // Sẽ in ra false
    }
}