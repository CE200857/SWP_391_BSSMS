package bssms_controller.auth;

import bssms_account.Account;
import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import bssms_persistence.DatNT.RegisterDAO;
import bssms_security.PasswordUtil;

import java.io.IOException;
import java.io.PrintWriter;

public class LoginController extends ControllerSupport {

    private final Gson gson = new Gson();

    public void post(ActionRequest request, ActionResult response)
            throws IOException {
        bind(request);

        PrintWriter out = response.writer();
        String uri = request.uri();

        if (uri.endsWith("/logout")) {
            SessionState session = request.session(false);
            if (session != null) {
                session.invalidate();
            }
            response.status(200);
            out.print("{\"message\": \"Đăng xuất thành công\"}");
            out.flush();
            return;
        }

        try {
            JsonObject jsonObject = gson.fromJson(request.bodyReader(), JsonObject.class);

            String identifier = jsonObject.get("email").getAsString().trim();
            String rawPassword = jsonObject.get("password").getAsString();

            boolean isValidEmail = identifier.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
            boolean isValidPhone = identifier.matches("^0\\d{9}$");

            if (!isValidEmail && !isValidPhone) {
                response.status(400);
                out.print("{\"message\": \"Vui lòng nhập đúng định dạng Email hoặc Số điện thoại!\"}");
                out.flush();
                return;
            }

            String hashedPassword = PasswordUtil.hashMD5(rawPassword);

            RegisterDAO dao = use(new RegisterDAO());
            Account user = dao.authenticateUser(identifier, hashedPassword);

            if (user != null) {
                if ("Inactive".equals(user.getStatus())) {
                    response.status(403);
                    out.print("{\"message\": \"Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt.\"}");
                } else {
                    SessionState session = request.session(true);
                    session.set("user", user);

                    response.status(200);
                    out.print(gson.toJson(user));
                }
            } else {
                response.status(401);
                out.print("{\"message\": \"Email hoặc mật khẩu không chính xác!\"}");
            }
            out.flush();
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            response.status(400);
            out.print("{\"message\": \"Dữ liệu đầu vào không hợp lệ!\"}");
        }
    }
}