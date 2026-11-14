package bssms_controller.KhanhLTQ;

import bssms_account.Account;
import bssms_controller.DatTT.BookingManagementController;
import bssms_controller.DatTT.BookingRequest;
import bssms_controller.DatTT.ControllerException;
import bssms_persistence.KhanhLTQ.CoordinationDAO;
import bssms_persistence.KhanhLTQ.PackageUsageDAO;
import bssms_persistence.common.BookingWorkflow;
import java.time.LocalDate;
import java.util.*;

public class CoordinationController {
    private static void bind(Account user, bssms_persistence.DBContext dao) {
        if (user == null || user.getAccountId() == null || user.getAccountId() <= 0)
            throw new ControllerException(401, "Vui lòng đăng nhập lại.");
        dao.setActorAccountId(user.getAccountId());
    }

    public Map<String, Object> board(Account user, CoordinationDAO dao, String date) throws Exception {
        bind(user, dao);
        String day = date == null || date.isBlank() ? LocalDate.now(BookingWorkflow.ZONE).toString() : LocalDate.parse(date.trim()).toString();
        return dao.board(day);
    }

    public Object affected(Account user, CoordinationDAO dao, Integer appointmentId) throws Exception {
        bind(user, dao);
        return appointmentId == null ? dao.affected() : dao.replacementOptions(appointmentId);
    }

    public Map<String, String> coordinate(Account user, CoordinationDAO dao, BookingRequest value) throws Exception {
        bind(user, dao);
        if (value == null) throw new IllegalArgumentException("Request body is required.");
        if (value.appointmentId == null || value.appointmentId <= 0) throw new IllegalArgumentException("appointmentId is required.");
        Map<Integer, Integer>[] maps = BookingManagementController.assignments(value);
        dao.reassign(value.appointmentId, maps[0], maps[1]);
        return Collections.singletonMap("message", "Đã cập nhật phân công cho lịch hẹn.");
    }

    public List<Map<String, Object>> myPackages(Account user, PackageUsageDAO dao, Integer customerId) throws Exception {
        bind(user, dao);
        if ("Customer".equals(user.getRole())) customerId = null;
        else if (!"Receptionist".equals(user.getRole()) && !"Manager".equals(user.getRole())) throw new ControllerException(403, "Role not permitted.");
        if (customerId != null && customerId <= 0) throw new IllegalArgumentException("customerId không hợp lệ.");
        return dao.activePackages(customerId);
    }
}
