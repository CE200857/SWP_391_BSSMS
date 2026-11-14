package bssms_api.KhanhLTQ;

import bssms_api.common.BaseApiServlet;
import bssms_persistence.KhanhLTQ.StaffLeaveDAO;
import bssms_persistence.common.WorkflowException;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebServlet(name = "StaffLeaveServlet", urlPatterns = {"/api/operations/leaves", "/api/operations/leave-appointments", "/api/operations/tour-report"})
public class StaffLeaveServlet extends BaseApiServlet {
    private StaffLeaveDAO dao(HttpServletRequest request) {
        if (user(request) == null) throw new WorkflowException(401, "Vui lòng đăng nhập.");
        StaffLeaveDAO dao = new StaffLeaveDAO();
        dao.setActorAccountId(user(request).getAccountId());
        return dao;
    }
    private static String kind(HttpServletRequest request) { return request.getServletPath().substring("/api/operations/".length()); }

    @Override protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        handle(req, res, 200, () -> { try (StaffLeaveDAO dao = dao(req)) { return dao.read(kind(req), req.getParameter("date")); } });
    }
    @Override protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        handle(req, res, 200, () -> {
            if (!"leaves".equals(kind(req))) return unsupported();
            try (StaffLeaveDAO dao = dao(req)) { return dao.write(body(req, JsonObject.class)); }
        });
    }
}
