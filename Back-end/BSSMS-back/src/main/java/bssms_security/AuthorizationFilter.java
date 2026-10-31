package bssms_security;

import bssms_account.Account;
import bssms_common.SessionUsers;
import java.io.IOException;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

// Enforces role-based access for protected API endpoints.
@WebFilter(filterName = "AuthorizationFilter", urlPatterns = {"/api/*"})
public class AuthorizationFilter implements Filter {

    @Override
    public void doFilter(
            ServletRequest request,
            ServletResponse response,
            FilterChain chain
    ) throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        HttpSession session = req.getSession(false);

        if (session == null || session.getAttribute("user") == null) {
            chain.doFilter(request, response);
            return;
        }

        Account user = SessionUsers.from(session.getAttribute("user"));

        if (user == null) {
            session.invalidate();
            // Public/authentication endpoints must still work after a schema upgrade.
            String uri=req.getRequestURI();
            if(uri.endsWith("/api/login") || uri.endsWith("/api/logout") || uri.endsWith("/api/register") || uri.contains("/api/forgot-password")
                    || uri.contains("/api/booking/slots") || ("GET".equals(req.getMethod()) && (uri.endsWith("/api/service") || uri.matches(".*/api/feedback(?:/[0-9]+)?")))) {
                chain.doFilter(request,response); return;
            }
            res.setStatus(401); res.setContentType("application/json"); res.setCharacterEncoding("UTF-8");
            res.getWriter().write("{\"message\":\"Vui lòng đăng nhập lại sau khi cập nhật hệ thống.\"}"); return;
        }
        String role = user.getRole();
        String path = req.getRequestURI();

        String relative=path.substring(req.getContextPath().length());
        boolean read="GET".equals(req.getMethod());
        boolean manager="Manager".equals(role), reception="Receptionist".equals(role), tech="Technician".equals(role), customer="Customer".equals(role);
        boolean allowed=true;
        if(relative.startsWith("/api/staff") || relative.startsWith("/api/manager/") || relative.startsWith("/api/dashboard-reports") || relative.startsWith("/api/birthday-promotions") || relative.startsWith("/api/purchase-orders")) allowed=manager;
        else if(relative.startsWith("/api/customers")) allowed=manager||reception||(read&&tech);
        else if(relative.startsWith("/api/technician/")) allowed=tech;
        else if(relative.startsWith("/api/room-bed-status")) allowed=manager||tech||(read&&reception);
        else if(relative.startsWith("/api/rooms") || relative.startsWith("/api/beds") || relative.startsWith("/api/equipment") || relative.startsWith("/api/room-bed-status")) allowed=manager||(read&&reception);
        else if(relative.startsWith("/api/products") || relative.startsWith("/api/suppliers")) allowed=manager||(read&&reception);
        else if(relative.startsWith("/api/service-status") || relative.equals("/api/service") || relative.startsWith("/api/treatment-packages")) allowed=read||manager;
        else if(relative.startsWith("/api/vouchers")) allowed=manager||(read&&reception);
        else if(relative.startsWith("/api/customer-packages")) allowed=read ? manager||reception||customer||tech : reception;
        else if(relative.startsWith("/api/appointments/") && !read && tech) allowed=false;
        else if(relative.startsWith("/api/appointments") && "POST".equals(req.getMethod())) allowed=reception;
        else if(relative.startsWith("/api/treatment-outcomes") && !read) allowed=tech;
        else if(relative.startsWith("/api/treatment-profiles") && !read) allowed=manager||reception||tech;
        else if(relative.startsWith("/api/invoices")) {
            if(read) allowed=manager||reception||customer;
            else if(relative.contains("/refund") || relative.endsWith("/cancel")) allowed=manager;
            else allowed=reception;
        }
        if(!allowed){sendForbiddenError(res);return;}

        chain.doFilter(request, response);
    }

    private void sendForbiddenError(HttpServletResponse res)
            throws IOException {

        res.setStatus(HttpServletResponse.SC_FORBIDDEN);
        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");
        res.setHeader(
                "Access-Control-Allow-Origin",
                "http://localhost:5173"
        );
        res.setHeader("Access-Control-Allow-Credentials", "true");

        res.getWriter().write(
                "{\"message\": \"Bạn không có quyền truy cập vào tài nguyên này!\"}"
        );
    }
}
