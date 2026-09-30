/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_common.util;
import java.util.regex.Pattern;
/**
 *
 * @author admin
 */
public class ValidationUtil {
    // Regex (Biểu thức chính quy) để kiểm tra định dạng
    private static final String EMAIL_PATTERN = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";
    
    // Regex cho số điện thoại Việt Nam (Bắt đầu bằng 0 hoặc +84, theo sau là 9 số hợp lệ)
    private static final String PHONE_PATTERN = "^(0|\\+84)[3|5|7|8|9][0-9]{8}$";

    /**
     * Kiểm tra chuỗi có bị rỗng hoặc null hay không
     */
    public static boolean isNullOrEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }

    /**
     * Kiểm tra định dạng Email hợp lệ
     */
    public static boolean isValidEmail(String email) {
        if (isNullOrEmpty(email)) return false;
        return Pattern.compile(EMAIL_PATTERN).matcher(email).matches();
    }

    /**
     * Kiểm tra định dạng số điện thoại Việt Nam hợp lệ
     */
    public static boolean isValidPhoneNumber(String phone) {
        if (isNullOrEmpty(phone)) return false;
        return Pattern.compile(PHONE_PATTERN).matcher(phone).matches();
    }

    /**
     * Kiểm tra độ mạnh của mật khẩu (Ví dụ: Yêu cầu ít nhất 6 ký tự)
     */
    public static boolean isValidPassword(String password) {
        if (isNullOrEmpty(password)) return false;
        return password.length() >= 6;
    }

    // ==========================================
    // HÀM MAIN ĐỂ TEST THỬ HÀM HOẠT ĐỘNG
    // ==========================================
    public static void main(String[] args) {
        System.out.println("Test Email 'admin@gmail.com': " + isValidEmail("admin@gmail.com")); // true
        System.out.println("Test Email sai 'admin_gmail': " + isValidEmail("admin_gmail"));       // false
        
        System.out.println("Test Phone '0901234567': " + isValidPhoneNumber("0901234567"));     // true
        System.out.println("Test Phone sai '01234abcde': " + isValidPhoneNumber("01234abcde")); // false
        System.out.println("Test rỗng: " + isNullOrEmpty("   "));                               // true
    }
}
