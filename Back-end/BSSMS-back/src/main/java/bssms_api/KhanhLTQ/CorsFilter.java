/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_api.KhanhLTQ;


import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebFilter("/*") // Áp dụng Filter này cho TẤT CẢ các đường dẫn API
public class CorsFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {}

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {
            
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        // Cho phép Frontend ở cổng 5173 gọi API
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        
        // Các phương thức được phép
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        
        // Các Header được phép gửi lên (quan trọng nếu bạn dùng Token/Authorization)
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        
        // Cho phép gửi kèm Cookie/Session
        response.setHeader("Access-Control-Allow-Credentials", "true");

        // Xử lý request "preflight" (OPTIONS) của trình duyệt
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        // Cho phép request đi tiếp tới Servlet
        filterChain.doFilter(servletRequest, servletResponse);
    }

    @Override
    public void destroy() {}
}