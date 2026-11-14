package bssms_security;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;
import java.io.IOException;
import java.util.Set;

@WebFilter(filterName = "CorsFilter", urlPatterns = {"/*"})
public class CorsFilter implements Filter {

    private static final String DONE = CorsFilter.class.getName() + ".DONE";

    private static final Set<String> ALLOWED_ORIGINS = Set.of(
            "http://localhost:5173",
            "https://bssms-front.vercel.app"
    );

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        if (request.getAttribute(DONE) != null) {
            chain.doFilter(request, response);
            return;
        }
        request.setAttribute(DONE, Boolean.TRUE);

        String origin = request.getHeader("Origin");
        if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
        }
        response.addHeader("Vary", "Origin");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Requested-With, ngrok-skip-browser-warning");
        response.setHeader("Access-Control-Max-Age", "600");

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        chain.doFilter(request, new HttpServletResponseWrapper(response) {
            private boolean blocked(String name) {
                return name != null && name.regionMatches(true, 0, "Access-Control-", 0, 15);
            }
            @Override public void setHeader(String name, String value) {
                if (!blocked(name)) super.setHeader(name, value);
            }
            @Override public void addHeader(String name, String value) {
                if (!blocked(name)) super.addHeader(name, value);
            }
        });
    }
}
