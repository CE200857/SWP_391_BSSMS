package bssms_auth;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import bssms_persistence.DatNT.LoginDAO;
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
        
        try {
            JsonObject jsonObject = gson.fromJson(request.getReader(), JsonObject.class);
            String email = jsonObject.get("email").getAsString();
            String password = jsonObject.get("password").getAsString();

            LoginDAO dao = new LoginDAO();
            Map<String, Object> user = dao.authenticateUser(email, password);
            
            PrintWriter out = response.getWriter();
            if (user != null) {
                if ("Inactive".equals(user.get("status"))) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    out.print("{\"message\": \"Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt.\"}");
                } else {
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