package bssms_controller.DatTT;

import bssms_account.Account;
import bssms_persistence.DatTT.BookingManagementDAO;
import java.time.LocalDate;
import bssms_booking.*;
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
    private void bind(Account user) {
        if (user == null || user.getAccountId() == null || user.getAccountId() <= 0)
            throw new ControllerException(403, "Please log in again.");
        dao.setActorAccountId(user.getAccountId());
    }
    private int customerId(Account user) throws Exception {
        bind(user);
        Validation.role(user, "Customer");
        int customerId = dao.getCustomerIdByAccountId(user.getAccountId());
        if (customerId <= 0) throw new IllegalArgumentException("Customer profile not found. Please update your profile.");
        return customerId;
    }
    public SlotAvailability checkSlots(int serviceId, String date, Integer technicianId) throws Exception {
        Validation.id(serviceId, "serviceId");
        Validation.optionalId(technicianId, "technicianId");
        return dao.checkSlotAvailability(serviceId, date(date), technicianId);
    }
    public List<ActivePackage> myPackages(Account user) throws Exception {
        return dao.getActivePackagesByCustomer(customerId(user));
    }
    public Appointment createOnline(Account user, BookingRequest value) throws Exception {
        bind(user);
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
    public Object coordination(Account user, Integer appointmentId) throws Exception {
        bind(user);
        Validation.role(user, "Receptionist", "Manager");
        if (appointmentId == null) return dao.getAllAppointmentsForCoordination();
        Validation.id(appointmentId, "appointmentId");
        return dao.getCoordinationResources(appointmentId);
    }
    public Map<String, String> checkIn(Account user, BookingRequest value) throws Exception {
        bind(user);
        Validation.role(user, "Receptionist", "Manager", "Technician");
        Validation.body(value);
        int id = requiredId(value.appointmentId, "appointmentId");
        Validation.status(value.status, "Pending", "Confirmed", "Checked-in",
                "In-progress", "Completed", "Cancelled", "No-show");
        Validation.found(dao.updateCheckInAndStatus(id, value.status, value.notes));
        return Collections.singletonMap("message", "Appointment status updated successfully.");
    }
    public Map<String, String> coordinate(Account user, BookingRequest value) throws Exception {
        bind(user);
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
