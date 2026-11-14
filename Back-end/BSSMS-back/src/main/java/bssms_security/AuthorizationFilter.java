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
            String uri=req.getRequestURI();
            if(uri.endsWith("/api/login") || uri.endsWith("/api/logout") || uri.endsWith("/api/register") || uri.contains("/api/forgot-password")
                    || ("GET".equals(req.getMethod()) && (uri.endsWith("/api/service") || uri.endsWith("/api/treatment-packages") || uri.matches(".*/api/service-image/[0-9]+") || uri.matches(".*/api/feedback(?:/[0-9]+|/service-ratings)?")))) {
                chain.doFilter(request,response); return;
            }
            res.setStatus(401); res.setContentType("application/json"); res.setCharacterEncoding("UTF-8");
            res.getWriter().write("{\"message\":\"Vui lòng đăng nhập lại sau khi cập nhật hệ thống.\"}"); return;
        }
        String role = user.getRole();
        String path = req.getRequestURI();
        if (path.endsWith("/api/payments/vnpay/ipn") || path.endsWith("/api/payments/vnpay/return")) { chain.doFilter(request,response); return; }

        String relative=path.substring(req.getContextPath().length());
        boolean read="GET".equals(req.getMethod());
        boolean manager="Manager".equals(role), reception="Receptionist".equals(role), tech="Technician".equals(role), customer="Customer".equals(role);
        boolean allowed=true;
        String method=req.getMethod();
        if(relative.equals("/api/booking/slots") || relative.equals("/api/booking/my-packages")) allowed=customer||reception||manager;
        else if(relative.equals("/api/booking/online")) allowed=customer;
        else if(relative.startsWith("/api/booking/")) allowed=reception||manager;
        else if(relative.startsWith("/api/appointments")) {
            if(read) allowed=true;
            else if("POST".equals(method)) allowed=reception;
            else if(relative.endsWith("/cancel")) allowed=reception||manager||customer;
            else if(relative.endsWith("/reschedule")) allowed=reception||customer;
            else allowed=reception;
        }
        else if(relative.startsWith("/api/treatment-status")) allowed=read||tech;
        else if(relative.startsWith("/api/treatment-outcomes")) allowed=read ? !customer : tech;
        else if(relative.startsWith("/api/treatment-photos")) allowed=read||tech;
        else if(relative.startsWith("/api/treatment-profiles")) allowed=read||manager||reception||tech;
        else if(relative.startsWith("/api/invoices")) {
            if(read) allowed=manager||reception||customer;
            else if(relative.contains("/refund")) allowed=manager;
            else if(relative.endsWith("/cancel")) allowed=manager;
            else allowed=reception;
        }
        else if(relative.equals("/api/payments/vnpay/create")) allowed=customer;
        else if(relative.equals("/api/package-purchases")) allowed=customer&&!read;
        else if(relative.startsWith("/api/customer-packages")) allowed=read ? true : reception;
        else if(relative.startsWith("/api/vouchers")) allowed=manager||(read&&reception);
        else if(relative.startsWith("/api/operations/")) {
            String kind=relative.substring("/api/operations/".length());
            if(kind.startsWith("my-schedule")) allowed=tech||reception;
            else if(kind.startsWith("leaves")) allowed=tech||reception||manager;
            else if(kind.startsWith("leave-appointments")) allowed=manager;
            else if(kind.startsWith("tour-report")) allowed=manager;
            else allowed=manager||(read&&reception);
        }
        else if(relative.startsWith("/api/staff")) allowed=manager||(read&&reception);
        else if(relative.startsWith("/api/dashboard-reports")) allowed=manager;
        else if(relative.startsWith("/api/customers")) allowed=manager||reception||(read&&tech);
        else if(relative.startsWith("/api/membership-tiers")) allowed=read ? !tech : manager;
        else if(relative.startsWith("/api/service-history")) allowed=read;
        else if(relative.equals("/api/service") || relative.startsWith("/api/treatment-packages")) allowed=read||manager;
        else if(relative.startsWith("/api/service-image")) allowed=read||manager;
        else if(relative.startsWith("/api/room-bed-status")) allowed=read ? !customer : reception||manager;
        else if(relative.startsWith("/api/rooms") || relative.startsWith("/api/beds")) allowed=manager||(read&&reception);
        else if(relative.startsWith("/api/feedback/moderation") || relative.matches("/api/feedback/[0-9]+/moderate")) allowed=manager;
        else if(relative.startsWith("/api/feedback") && !read) allowed=customer;
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
