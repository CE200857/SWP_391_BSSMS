package bssms_controller.DatTT;

import bssms_persistence.DatTT.BookingManagementDAO;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

/** Validates requests and session identity before delegating transactional SQL to DAO. */
public class BookingManagementController {
    private final BookingManagementDAO dao;
    public BookingManagementController(BookingManagementDAO dao) { this.dao = dao; }

    private int requiredId(Integer value, String field) {
        if (value == null) throw new IllegalArgumentException(field + " is required.");
        Validation.id(value, field);
        return value;
    }
    private String date(String value) {
        return LocalDate.parse(Validation.text(value, "date")).toString();
    }
    private int customerId(Map<String, Object> user) throws Exception {
        Validation.role(user, "Customer");
        Object value = user.get("accountId");
        if (!(value instanceof Number)) value = user.get("account_id");
        if (!(value instanceof Number) || ((Number) value).intValue() <= 0) {
            throw new ControllerException(403, "Invalid login session.");
        }
        int customerId = dao.getCustomerIdByAccountId(((Number) value).intValue());
        if (customerId <= 0) throw new IllegalArgumentException("Customer profile not found. Please update your profile.");
        return customerId;
    }
    public Map<String, Object> checkSlots(int serviceId, String date, Integer technicianId) throws Exception {
        Validation.id(serviceId, "serviceId");
        Validation.optionalId(technicianId, "technicianId");
        return dao.checkSlotAvailability(serviceId, date(date), technicianId);
    }
    public List<Map<String, Object>> myPackages(Map<String, Object> user) throws Exception {
        return dao.getActivePackagesByCustomer(customerId(user));
    }
    public Map<String, Object> createOnline(Map<String, Object> user, BookingRequest value) throws Exception {
        Validation.role(user, "Customer");
        Validation.body(value);
        int serviceId = requiredId(value.serviceId, "serviceId");
        String date = date(value.appointmentDate);
        String time = LocalTime.parse(Validation.text(value.startTime, "startTime")).toString();
        Validation.optionalId(value.customerPackageId, "customerPackageId");
        Validation.optionalId(value.technicianId, "technicianId");
        // Never trust customerId supplied by the browser.
        return dao.createOnlineAppointment(customerId(user), serviceId, value.customerPackageId,
                date, time, value.technicianId, value.notes);
    }
    public Object coordination(Map<String, Object> user, Integer appointmentId) throws Exception {
        Validation.role(user, "Receptionist", "Manager");
        if (appointmentId == null) return dao.getAllAppointmentsForCoordination();
        Validation.id(appointmentId, "appointmentId");
        return dao.getCoordinationResources(appointmentId);
    }
    public Map<String, String> checkIn(Map<String, Object> user, BookingRequest value) throws Exception {
        Validation.role(user, "Receptionist", "Manager");
        Validation.body(value);
        int id = requiredId(value.appointmentId, "appointmentId");
        Validation.status(value.status, "Scheduled", "Booked", "Confirmed", "Checked-in",
                "In Progress", "Completed", "Cancelled", "No Show");
        Validation.found(dao.updateCheckInAndStatus(id, value.status, value.notes));
        return Collections.singletonMap("message", "Appointment status updated successfully.");
    }
    public Map<String, String> coordinate(Map<String, Object> user, BookingRequest value) throws Exception {
        Validation.role(user, "Receptionist", "Manager");
        Validation.body(value);
        int id = requiredId(value.appointmentId, "appointmentId");
        Validation.optionalId(value.technicianId, "technicianId");
        Validation.optionalId(value.roomId, "roomId");
        Validation.optionalId(value.bedId, "bedId");
        if (value.bedId != null && value.roomId == null) {
            throw new IllegalArgumentException("roomId is required when selecting a bed.");
        }
        List<Integer> equipmentIds = value.equipmentIds == null ? Collections.emptyList() : value.equipmentIds;
        Set<Integer> unique = new HashSet<>();
        for (Integer equipmentId : equipmentIds) {
            requiredId(equipmentId, "equipmentId");
            if (!unique.add(equipmentId)) throw new IllegalArgumentException("Duplicate equipmentId.");
        }
        Validation.found(dao.coordinateAppointment(id, value.technicianId, value.roomId, value.bedId, equipmentIds));
        return Collections.singletonMap("message", "Appointment coordinated successfully.");
    }
}
