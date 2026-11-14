package bssms_controller.DatTT;

import bssms_account.Account;
import bssms_persistence.DatTT.BookingManagementDAO;
import bssms_persistence.common.BookingWorkflow;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

public class BookingManagementController {
    private final BookingManagementDAO dao;
    public BookingManagementController(BookingManagementDAO dao) { this.dao = dao; }

    private String date(String value) {
        return LocalDate.parse(Validation.text(value, "date")).toString();
    }
    private void bind(Account user) {
        if (user == null || user.getAccountId() == null || user.getAccountId() <= 0)
            throw new ControllerException(401, "Vui lòng đăng nhập lại.");
        dao.setActorAccountId(user.getAccountId());
    }
    static List<Integer> serviceIds(String list, String single) {
        List<Integer> ids = new ArrayList<>();
        String source = list != null && !list.isBlank() ? list : single;
        if (source == null || source.isBlank()) throw new IllegalArgumentException("Vui lòng chọn dịch vụ.");
        for (String part : source.split(",")) {
            int id = Integer.parseInt(part.trim());
            Validation.id(id, "serviceId");
            ids.add(id);
        }
        if (ids.size() > 4) throw new IllegalArgumentException("Một lịch hẹn tối đa 4 dịch vụ (BR-02).");
        return ids;
    }
    static List<BookingWorkflow.LineInput> lines(BookingRequest value) {
        List<BookingWorkflow.LineInput> result = new ArrayList<>();
        if (value.services != null) for (BookingRequest.Line l : value.services) {
            if (l == null || l.serviceId == null) throw new IllegalArgumentException("Thiếu dịch vụ.");
            Validation.optionalId(l.customerPackageId, "customerPackageId");
            result.add(new BookingWorkflow.LineInput(l.serviceId, l.customerPackageId));
        } else if (value.serviceId != null) result.add(new BookingWorkflow.LineInput(value.serviceId, value.customerPackageId));
        if (result.isEmpty() || result.size() > 4) throw new IllegalArgumentException("Một lịch hẹn gồm từ 1 đến 4 dịch vụ (BR-02).");
        return result;
    }
    public static Map<Integer, Integer>[] assignments(BookingRequest value) {
        @SuppressWarnings("unchecked") Map<Integer, Integer>[] maps = new Map[]{new HashMap<>(), new HashMap<>()};
        if (value.assignments != null) for (BookingRequest.Assignment a : value.assignments) {
            if (a == null || a.appointmentServiceId == null) continue;
            if (a.technicianId != null) maps[0].put(a.appointmentServiceId, a.technicianId);
            if (a.bedId != null) maps[1].put(a.appointmentServiceId, a.bedId);
        }
        return maps;
    }

    public Map<String, Object> checkSlots(Account user, String serviceIds, String serviceId, String date, Integer technicianId, Integer appointmentId) throws Exception {
        bind(user);
        Validation.optionalId(technicianId, "technicianId");
        return dao.slots(serviceIds(serviceIds, serviceId), date(date), technicianId, appointmentId);
    }
    public Map<String, Object> createOnline(Account user, BookingRequest value) throws Exception {
        bind(user);
        Validation.role(user, "Customer");
        Validation.body(value);
        String time = LocalTime.parse(Validation.text(value.startTime, "startTime")).toString();
        Validation.optionalId(value.technicianId, "technicianId");
        int id = dao.createOnline(lines(value), date(value.appointmentDate), time, value.technicianId, value.paymentChoice, value.notes);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("appointmentId", id);
        result.put("status", "Pending");
        Map<String, Object> invoice = dao.openInvoice(id);
        result.put("invoiceId", invoice == null ? null : invoice.get("invoiceId"));
        result.put("totalAmount", invoice == null ? 0 : invoice.get("totalAmount"));
        result.put("message", "Đặt lịch thành công. Lịch đang chờ lễ tân xác nhận.");
        return result;
    }
    public Object checkInPlan(Account user, int appointmentId) throws Exception {
        bind(user);
        return dao.checkInPlan(appointmentId);
    }
    public Map<String, String> checkIn(Account user, BookingRequest value) throws Exception {
        bind(user);
        Validation.body(value);
        if (value.appointmentId == null) throw new IllegalArgumentException("appointmentId is required.");
        Map<Integer, Integer>[] maps = assignments(value);
        dao.checkIn(value.appointmentId, maps[0], maps[1]);
        return Collections.singletonMap("message", "Đã check-in và phân công kỹ thuật viên, giường.");
    }
}
