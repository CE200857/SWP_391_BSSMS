// src/services/commissionService.js

// URL trỏ đến Backend Java Servlet của bạn (đúng với URL báo lỗi trên Console)
const API_BASE_URL = "/api";

/**
 * Gọi API lấy báo cáo hoa hồng cho Manager (UC77)
 * @param {string} startDate - Ngày bắt đầu (YYYY-MM-DD)
 * @param {string} endDate - Ngày kết thúc (YYYY-MM-DD)
 */
export const getCommissionReport = async (startDate, endDate) => {
    try {
        const response = await fetch(`${API_BASE_URL}/manager/commission/report?startDate=${startDate}&endDate=${endDate}`, {
            method: 'GET',
            credentials: 'include', // Quan trọng: Bắt buộc để gửi Cookie/Session JSESSIONID qua API
            headers: {
                'Content-Type': 'application/json',
                
                // NẾU dự án của bạn dùng JWT Token lưu ở localStorage thì mở comment dòng dưới đây:
                // 'Authorization': `Bearer ${localStorage.getItem('token')}` 
            }
        });

        // Xử lý nếu backend trả về lỗi 401 (Chưa đăng nhập / Hết hạn session)
        if (response.status === 401) {
            console.error("Lỗi 401: Unauthorized. Session có thể đã hết hạn.");
            throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Lỗi khi lấy báo cáo hoa hồng:", error);
        throw error; // Ném lỗi ra để Component (CommissionReport.jsx) bắt và hiển thị
    }
};

/**
 * Gọi API lấy danh sách hoa hồng cá nhân cho Technician
 */
export const getTechnicianCommissions = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/technician/commission`, {
            method: 'GET',
            credentials: 'include', // Quan trọng: Bắt buộc để gửi Cookie/Session JSESSIONID qua API
            headers: {
                'Content-Type': 'application/json',
                
                // NẾU dự án của bạn dùng JWT Token lưu ở localStorage thì mở comment dòng dưới đây:
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        // Xử lý nếu backend trả về lỗi 401
        if (response.status === 401) {
            console.error("Lỗi 401: Unauthorized. Session có thể đã hết hạn.");
            throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Lỗi khi lấy danh sách hoa hồng cá nhân:", error);
        throw error;
    }
};