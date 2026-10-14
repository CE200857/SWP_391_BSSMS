package bssms_auth;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import bssms_persistence.DatNT.RegisterDAO;

import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(name = "ForgotPasswordServlet", urlPatterns = {"/api/forgot-password/check-email"})
public class ForgotPasswordServlet extends HttpServlet {

    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173"); 
        resp.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
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
            String email = jsonObject.get("email").getAsString().trim();
            
            if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Email không đúng định dạng!\"}");
                out.flush();
                return;
            }

            RegisterDAO dao = new RegisterDAO();
            String duplicateField = dao.checkDuplicate(null, email, null, null);
            boolean isExist = (duplicateField != null);
            
            if (isExist) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\": \"Email hợp lệ.\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"message\": \"Email này không tồn tại trong hệ thống!\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
        }
        out.flush();
    }
}