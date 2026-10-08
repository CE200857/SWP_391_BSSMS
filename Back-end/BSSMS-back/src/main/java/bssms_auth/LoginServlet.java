package bssms_auth;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import bssms_persistence.DatNT.LoginDAO;
import bssms_security.PasswordUtil;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 
 * @author Nguyen Tien Dat - CE200858
 */

@WebServlet(name = "LoginServlet", urlPatterns = {"/api/login"})
public class LoginServlet extends HttpServlet {

    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173"); 
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        // THÊM DÒNG NÀY ĐỂ CHO PHÉP LƯU SESSION (COOKIE)
        resp.setHeader("Access-Control-Allow-Credentials", "true");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        PrintWriter out = response.getWriter();
        
        try {
            JsonObject jsonObject = gson.fromJson(request.getReader(), JsonObject.class);
            
            String identifier = jsonObject.get("email").getAsString().trim(); 
            String rawPassword = jsonObject.get("password").getAsString();

            boolean isValidEmail = identifier.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
            boolean isValidPhone = identifier.matches("^0\\d{9}$");

            if (!isValidEmail && !isValidPhone) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Vui lòng nhập đúng định dạng Email hoặc Số điện thoại!\"}");
                out.flush();
                return;
            }

            String hashedPassword = PasswordUtil.hashMD5(rawPassword);

            LoginDAO dao = new LoginDAO();
            Map<String, Object> user = dao.authenticateUser(identifier, hashedPassword);
            
            if (user != null) {
                if ("Inactive".equals(user.get("status"))) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    out.print("{\"message\": \"Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt.\"}");
                } else {
                    jakarta.servlet.http.HttpSession session = request.getSession(true);
                    session.setAttribute("user", user);
                    
                    response.setStatus(HttpServletResponse.SC_OK);
                    out.print(gson.toJson(user));
                }
            } else {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                out.print("{\"message\": \"Email hoặc mật khẩu không chính xác!\"}");
            }
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
        }
    }
}