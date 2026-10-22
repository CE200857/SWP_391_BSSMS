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

        @SuppressWarnings("unchecked")
        Map<String, Object> user
                = (Map<String, Object>) session.getAttribute("user");

        String role = (String) user.get("role");
        String path = req.getRequestURI();

        // Restricts walk-in appointment creation to Receptionist and Manager.
        if (path.contains("/api/appointments")
                && "POST".equalsIgnoreCase(req.getMethod())) {

            if (!"Receptionist".equals(role)
                    && !"Manager".equals(role)) {
                sendForbiddenError(res);
                return;
            }
        }

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

        /**
         * Restricts invoice setup and creation to Receptionist. Other invoice
         * operations require their own role rules.
         */
        if (path.contains("/api/invoices")) {
            boolean isReceptionist = "Receptionist".equals(role);
            boolean isManager = "Manager".equals(role);

            boolean isInvoiceSetupRequest
                    = "GET".equalsIgnoreCase(req.getMethod())
                    && (path.endsWith("/eligible-appointments")
                    || path.endsWith("/products"));

            boolean isCreateInvoiceRequest
                    = "POST".equalsIgnoreCase(req.getMethod())
                    && (path.endsWith("/api/invoices")
                    || path.endsWith("/api/invoices/"));

            boolean isRefundRequest
                    = "POST".equalsIgnoreCase(req.getMethod())
                    && path.matches(".*/api/invoices/\\d+/refund/?$");

            boolean isCancelRequest
                    = "POST".equalsIgnoreCase(req.getMethod())
                    && path.matches(".*/api/invoices/\\d+/cancel/?$");

            if ((isInvoiceSetupRequest || isCreateInvoiceRequest)
                    && !isReceptionist) {
                sendForbiddenError(res);
                return;
            }

            if ((isRefundRequest || isCancelRequest) && !isManager) {
                sendForbiddenError(res);
                return;
            }
        }

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
