package bssms_auth;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import bssms_persistence.DatNT.RegisterDAO;
import bssms_security.PasswordUtil;
import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(name = "RegisterServlet", urlPatterns = {"/api/register"})
public class RegisterServlet extends HttpServlet {

    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173"); 
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
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
            String username = jsonObject.get("username").getAsString().trim();
            String email = jsonObject.get("email").getAsString();
            String rawPassword = jsonObject.get("password").getAsString();
            
            if (username.length() < 3 || username.contains(" ")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Tên đăng nhập phải có ít nhất 3 ký tự và không chứa khoảng trắng!\"}");
                out.flush();
                return;
            }
            
            if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Email không đúng định dạng!\"}");
                out.flush();
                return;
            }
            
            if (rawPassword.length() < 6) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Mật khẩu phải có ít nhất 6 ký tự!\"}");
                out.flush();
                return;
            }

            RegisterDAO dao = new RegisterDAO();
            
            if (dao.checkEmailExist(email)) {
                response.setStatus(HttpServletResponse.SC_CONFLICT);
                out.print("{\"message\": \"Email này đã được sử dụng. Vui lòng chọn email khác!\"}");
                out.flush();
                return;
            }

            String hashedPassword = PasswordUtil.hashMD5(rawPassword);

            boolean isCreated = dao.createAccount(username, hashedPassword, email);
            
            if (isCreated) {
                bssms_persistence.DatNT.LoginDAO loginDao = new bssms_persistence.DatNT.LoginDAO();
                java.util.Map<String, Object> user = loginDao.authenticateUser(email, hashedPassword);
                if (user != null) {
                    jakarta.servlet.http.HttpSession session = request.getSession(true);
                    session.setAttribute("user", user);
                }

                response.setStatus(HttpServletResponse.SC_CREATED);
                out.print("{\"message\": \"Đăng ký thành công!\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_CONFLICT);
                out.print("{\"message\": \"Tên đăng nhập này đã tồn tại. Vui lòng chọn tên khác!\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
        }
        out.flush();
    }
}