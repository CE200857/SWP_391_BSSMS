/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_common.constant;

/**
 *
 * @author admin
 */
public class AppConstants {
    // ==========================================
    // 1. CẤU HÌNH HỆ THỐNG CƠ BẢN
    // ==========================================
    public static final String APP_NAME = "Beauty Salon Management System";
    public static final int MAX_LOGIN_ATTEMPTS = 5; // Khóa tài khoản nếu đăng nhập sai 5 lần
    public static final String DEFAULT_CURRENCY = "VND"; // Tiền tệ mặc định
    public static final double TAX_RATE = 0.1; // Thuế VAT 10%
    
    // ==========================================
    // 2. CẤU HÌNH PHÂN TRANG (PAGINATION)
    // ==========================================
    public static final int RECORDS_PER_PAGE = 10; // Số dòng tối đa hiển thị trên 1 trang (bảng Customer, Staff...)
    
    // ==========================================
    // 3. QUẢN LÝ PHÂN QUYỀN (ROLE ID)
    // ==========================================
    // (Giả sử trong DB bảng Role của bạn quy định ID 1 là Admin, 2 là Manager...)
    public static final int ROLE_ADMIN = 1;
    public static final int ROLE_MANAGER = 2;
    public static final int ROLE_RECEPTIONIST = 3;
    public static final int ROLE_TECHNICIAN = 4;
    public static final int ROLE_CUSTOMER = 5;

    // ==========================================
    // 4. QUY ĐỊNH VỀ THỜI GIAN ĐẶT LỊCH (BOOKING)
    // ==========================================
    public static final int MIN_HOURS_BEFORE_BOOKING = 2; // Khách phải đặt trước ít nhất 2 tiếng
    
    // ==========================================
    // 5. CẤU HÌNH BÊN THỨ 3 (Sẽ dùng cho Iteration 3)
    // ==========================================
    public static final String VNPAY_SECRET_KEY = "CHUA_CO_KEY"; // Dùng để làm chức năng thanh toán VNPay
}
