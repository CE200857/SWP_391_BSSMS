package bssms_security;

import java.io.IOException;
import java.util.Map;
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
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

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

        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) session.getAttribute("user");
        String role = (String) user.get("role");
        String path = req.getRequestURI();

        if (path.contains("/api/staff")) {
            if (!"Manager".equals(role)) {
                sendForbiddenError(res);
                return;
            }
        }

        if (path.contains("/api/customers")) {
            if ("Customer".equals(role)) {
                sendForbiddenError(res);
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private void sendForbiddenError(HttpServletResponse res) throws IOException {
        res.setStatus(HttpServletResponse.SC_FORBIDDEN);
        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");
        res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.getWriter().write("{\"message\": \"Bạn không có quyền truy cập vào tài nguyên này!\"}");
    }
}