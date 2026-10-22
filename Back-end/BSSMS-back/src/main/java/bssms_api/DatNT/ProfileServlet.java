package bssms_api.DatNT;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import bssms_persistence.DatNT.ProfileDAO;
import bssms_persistence.DatNT.RegisterDAO;
import bssms_security.EmailUtil;
import bssms_security.PasswordUtil;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet(name = "ProfileServlet", urlPatterns = {
    "/api/profile",
    "/api/update-profile",
    "/api/change-password"
})
public class ProfileServlet extends HttpServlet {

    private Gson gson = new Gson();

    private void setAccessControlHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setHeader("Access-Control-Allow-Credentials", "true");
    }

    private String formatFullName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "";
        }
        String[] words = name.trim().split("\\s+");
        StringBuilder formatted = new StringBuilder();
        for (String word : words) {
            if (word.length() > 0) {
                formatted.append(Character.toUpperCase(word.charAt(0)))
                        .append(word.substring(1).toLowerCase())
                        .append(" ");
            }
        }
        return formatted.toString().trim();
    }

    private int extractAccountId(Map<String, Object> user) {
        if (user.containsKey("account_id")) {
            return ((Number) user.get("account_id")).intValue();
        } else if (user.containsKey("accountId")) {
            return ((Number) user.get("accountId")).intValue();
        }
        return -1;
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setAccessControlHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            int accountId = Integer.parseInt(request.getParameter("accountId"));
            String role = request.getParameter("role");

            ProfileDAO dao = new ProfileDAO();
            Map<String, Object> profile = dao.getProfileByAccountId(accountId, role);

            PrintWriter out = response.getWriter();
            if (profile != null && !profile.isEmpty()) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.print(gson.toJson(profile));
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print("{\"message\": \"Không tìm thấy hồ sơ!\"}");
            }
            out.flush();
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setAccessControlHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();
        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("user") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"message\": \"Phiên làm việc không hợp lệ! Vui lòng đăng nhập lại.\"}");
            out.flush();
            return;
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> user = (Map<String, Object>) session.getAttribute("user");
            int accountId = extractAccountId(user);
            String role = (String) user.get("role");
            String uri = request.getRequestURI();

            JsonObject jsonObject = gson.fromJson(request.getReader(), JsonObject.class);

            if (uri.endsWith("/change-password")) {
                String oldPassword = jsonObject.get("oldPassword").getAsString();
                String newPassword = jsonObject.get("newPassword").getAsString();

                if (newPassword == null || newPassword.length() < 6) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"message\": \"Mật khẩu mới phải có ít nhất 6 ký tự!\"}");
                    out.flush();
                    return;
                }
                if (oldPassword.equals(newPassword)) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"message\": \"Mật khẩu mới không được trùng với mật khẩu hiện tại!\"}");
                    out.flush();
                    return;
                }

                RegisterDAO authDao = new RegisterDAO();
                boolean isChanged = authDao.changePassword(
                        accountId,
                        PasswordUtil.hashMD5(oldPassword),
                        PasswordUtil.hashMD5(newPassword)
                );

                if (isChanged) {
                    response.setStatus(HttpServletResponse.SC_OK);
                    out.print("{\"message\": \"Đổi mật khẩu thành công!\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"message\": \"Mật khẩu hiện tại không chính xác!\"}");
                }
                out.flush();
                return;
            }

            ProfileDAO dao = new ProfileDAO();
            RegisterDAO authDao = new RegisterDAO();
            String action = jsonObject.has("action") ? jsonObject.get("action").getAsString() : "";

            if (uri.endsWith("/update-profile") && "send-email-code".equals(action)) {
                if (!"Customer".equals(role)) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    out.print("{\"message\": \"Chỉ khách hàng mới được phép đổi email tại đây!\"}");
                    out.flush();
                    return;
                }

                String newEmail = jsonObject.has("email") ? jsonObject.get("email").getAsString().trim() : "";
                if (!newEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"message\": \"Email mới không đúng định dạng!\"}");
                    out.flush();
                    return;
                }

                String duplicateField = dao.checkDuplicate(null, newEmail, null, accountId);
                if (duplicateField != null) {
                    response.setStatus(HttpServletResponse.SC_CONFLICT);
                    out.print("{\"message\": \"" + duplicateField + " này đã được tài khoản khác sử dụng!\"}");
                    out.flush();
                    return;
                }

                String otp = EmailUtil.generateOTP();
                if (!authDao.saveVerificationCode(newEmail, otp)) {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"message\": \"Không thể tạo mã xác thực. Vui lòng thử lại!\"}");
                    out.flush();
                    return;
                }

                EmailUtil.sendOTP(newEmail, otp, "[BSSMS] Mã xác thực thay đổi Email");
                response.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"message\": \"Mã xác thực đã được gửi tới Email mới của bạn!\"}");
                out.flush();
                return;
            }

            String fullName = jsonObject.get("fullName").getAsString().trim();
            String phone = jsonObject.get("phone").getAsString().trim();

            if (fullName.split("\\s+").length < 2) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Họ và tên bắt buộc phải có từ 2 từ trở lên!\"}");
                out.flush();
                return;
            }
            if (!phone.matches("^0[1-9]\\d{8}$")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"message\": \"Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0, số thứ hai khác 0)!\"}");
                out.flush();
                return;
            }

            String standardizedName = formatFullName(fullName);

            if (uri.endsWith("/update-profile")) {
                String username = jsonObject.has("username") ? jsonObject.get("username").getAsString().trim() : "";
                if (username.length() < 3 || username.contains(" ")) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"message\": \"Tên đăng nhập phải có ít nhất 3 ký tự và không chứa khoảng trắng!\"}");
                    out.flush();
                    return;
                }

                Map<String, Object> currentProfile = dao.getProfileByAccountId(accountId, role);
                String currentEmail = currentProfile.get("email") != null ? currentProfile.get("email").toString().trim() : "";
                String newEmail = jsonObject.has("email") ? jsonObject.get("email").getAsString().trim() : currentEmail;

                boolean isEmailChanged = "Customer".equals(role) && !newEmail.equalsIgnoreCase(currentEmail);

                if (isEmailChanged) {
                    if (!newEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        out.print("{\"message\": \"Email mới không đúng định dạng!\"}");
                        out.flush();
                        return;
                    }
                }

                String duplicateField = dao.checkDuplicate(
                        username,
                        "Customer".equals(role) ? newEmail : null,
                        phone,
                        accountId
                );
                if (duplicateField != null) {
                    response.setStatus(HttpServletResponse.SC_CONFLICT);
                    out.print("{\"message\": \"" + duplicateField + " này đã được người khác sử dụng!\"}");
                    out.flush();
                    return;
                }

                if (isEmailChanged) {
                    String verificationCode = jsonObject.has("verificationCode")
                            ? jsonObject.get("verificationCode").getAsString().trim()
                            : "";
                    if (verificationCode.isEmpty() || !authDao.verifyCode(newEmail, verificationCode)) {
                        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        out.print("{\"message\": \"Mã xác thực Email không chính xác hoặc đã hết hạn!\"}");
                        out.flush();
                        return;
                    }
                }

                boolean isUpdated;
                if ("Customer".equals(role)) {
                    String dob = jsonObject.get("dob").getAsString();
                    String gender = jsonObject.get("gender").getAsString();
                    String address = jsonObject.get("address").getAsString();
                    isUpdated = dao.updateCustomerProfile(accountId, standardizedName, dob, gender, phone, address, username, newEmail);
                } else {
                    isUpdated = dao.updateStaffProfile(accountId, standardizedName, phone, username);
                }

                if (isUpdated) {
                    if (isEmailChanged) {
                        authDao.deleteVerificationCode(newEmail);
                        user.put("email", newEmail);
                    }
                    user.put("fullName", standardizedName);
                    user.put("username", username);
                    session.setAttribute("user", user);
                    response.setStatus(HttpServletResponse.SC_OK);
                    out.print(gson.toJson(user));
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"message\": \"Không thể lưu thông tin. Vui lòng thử lại!\"}");
                }
                out.flush();
                return;
            }

            String dob = jsonObject.get("dob").getAsString();
            String gender = jsonObject.get("gender").getAsString();
            String address = jsonObject.get("address").getAsString();

            String duplicateField = dao.checkDuplicate(null, null, phone, accountId);
            if (duplicateField != null) {
                response.setStatus(HttpServletResponse.SC_CONFLICT);
                out.print("{\"message\": \"" + duplicateField + " này đã được sử dụng bởi tài khoản khác!\"}");
                out.flush();
                return;
            }

            boolean isCreated = dao.createCustomerProfile(accountId, standardizedName, dob, gender, phone, address);
            if (isCreated) {
                user.put("role", "Customer");
                user.put("fullName", standardizedName);
                session.setAttribute("user", user);
                response.setStatus(HttpServletResponse.SC_OK);
                out.print(gson.toJson(user));
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"message\": \"Không thể lưu thông tin. Vui lòng thử lại!\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
            e.printStackTrace();
        }
        out.flush();
    }
}
