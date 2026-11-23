package bssms_persistence.common;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

public final class Timing {
    private Timing() {}

    public static final int LATE_MINUTES = 15;
    public static final int CONFIRM_BEFORE_HOURS = 1;
    public static final int CONFIRM_WITHIN_HOURS = 24;
    public static final int CHECKIN_EARLY_MINUTES = 60;
    public static final int START_EARLY_MINUTES = 15;
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter HM = DateTimeFormatter.ofPattern("HH:mm");

    public static LocalDateTime now() { return LocalDateTime.now(BookingWorkflow.ZONE); }

    public static LocalDate date(Object value) { return LocalDate.parse(String.valueOf(value).substring(0, 10)); }
    public static LocalTime time(Object value) { return BookingWorkflow.time(value); }
    public static LocalDateTime at(Object date, Object time) { return LocalDateTime.of(date(date), time(time)); }
    static LocalDateTime createdAt(Object value) {
        if (value == null) return null;
        String text = String.valueOf(value).replace(' ', 'T');
        return LocalDateTime.parse(text.length() > 19 ? text.substring(0, 19) : text);
    }

    public static final class Appt {
        public final String status; public final LocalDateTime start, created;
        public Appt(Map<String, Object> a) {
            status = String.valueOf(a.get("status"));
            start = at(a.get("appointmentDate"), a.get("startTime"));
            created = createdAt(a.get("createdAt"));
        }
    }

    public static String confirm(Appt a) {
        if (!"Pending".equals(a.status)) return "The appointment is no longer pending (it may have been auto-cancelled).";
        LocalDateTime now = now();
        if (!now.isBefore(a.start.minusHours(CONFIRM_BEFORE_HOURS)))
            return "Confirmation deadline passed: online bookings must be confirmed at least 1 hour before the appointment. Reschedule or cancel the appointment.";
        if (a.created != null && !now.isBefore(a.created.plusHours(CONFIRM_WITHIN_HOURS)))
            return "Confirmation deadline passed: the appointment has been pending for more than 24 hours since booking. Contact the customer to rebook.";
        return null;
    }

    public static String checkIn(Appt a) {
        if (!"Confirmed".equals(a.status)) return "Only confirmed appointments can be checked in.";
        LocalDateTime now = now();
        LocalDate today = now.toLocalDate();
        if (a.start.toLocalDate().isAfter(today)) return "Not the appointment date yet (" + a.start.format(DAY) + "). Check-in is only allowed on the appointment date.";
        if (a.start.toLocalDate().isBefore(today)) return "The appointment on " + a.start.format(DAY) + " has passed. Please mark it as No-show or reschedule.";
        if (now.isBefore(a.start.minusMinutes(CHECKIN_EARLY_MINUTES)))
            return "Too early to check in: check-in opens at " + a.start.minusMinutes(CHECKIN_EARLY_MINUTES).format(HM) + " (60 minutes before the appointment at " + a.start.format(HM) + ").";
        if (now.isAfter(a.start.plusMinutes(LATE_MINUTES)))
            return "The customer is more than 15 minutes late for the appointment at " + a.start.format(HM) + ". Please reschedule or mark the appointment as No-show.";
        return null;
    }

    public static String noShow(Appt a) {
        if (!"Confirmed".equals(a.status)) return "Only confirmed appointments that have not checked in can be marked as No-show.";
        LocalDateTime limit = a.start.plusMinutes(LATE_MINUTES);
        if (!now().isAfter(limit)) return "Too early to mark as No-show: the customer may arrive until " + limit.format(HM) + " on " + limit.format(DAY) + ".";
        return null;
    }

    public static String staffCancel(Appt a) {
        if (!"Pending".equals(a.status) && !"Confirmed".equals(a.status)) return "The appointment has checked in or ended, so it cannot be cancelled.";
        if ("Confirmed".equals(a.status) && now().isAfter(a.start.plusMinutes(LATE_MINUTES)))
            return "The appointment is more than 15 minutes late: mark it as No-show instead of cancelling.";
        return null;
    }

    public static String collect(String appointmentStatus) {
        switch (appointmentStatus) {
            case "Checked-in": case "In-progress": case "Completed": return null;
            case "Pending": case "Confirmed": return "Payment is not due yet: the customer has not checked in. Take payment after check-in or after the service is done.";
            default: return "The appointment was cancelled or the customer did not show up, so no payment is taken.";
        }
    }

    public static String payOnline(Appt a) {
        switch (a.status) {
            case "Checked-in": case "In-progress": case "Completed": return null;
            case "Pending": case "Confirmed":
                return now().isBefore(a.start) ? null : "The appointment time has passed, so it cannot be prepaid. Please pay at the counter.";
            default: return "The appointment was cancelled or the customer did not show up, so it cannot be paid.";
        }
    }

    public static String startLine(String appointmentStatus, Object date, Object lineStart, boolean partStart) {
        if (!"Checked-in".equals(appointmentStatus) && !"In-progress".equals(appointmentStatus)) return "The customer has not checked in.";
        LocalDateTime start = at(date, lineStart), now = now();
        if (!start.toLocalDate().equals(now.toLocalDate())) return "Services can only be started on the appointment date (" + start.format(DAY) + ").";
        if (partStart && now.isBefore(start.minusMinutes(START_EARLY_MINUTES)))
            return "Too early to start: the service starts at " + start.format(HM) + "; you can start from " + start.minusMinutes(START_EARLY_MINUTES).format(HM) + ".";
        return null;
    }

    public static String note(Appt a) {
        LocalDateTime now = now();
        if ("Pending".equals(a.status)) {
            if (confirm(a) != null) return "Confirmation deadline passed";
            return "Confirm before " + a.start.minusHours(CONFIRM_BEFORE_HOURS).format(HM) + (a.start.toLocalDate().equals(now.toLocalDate()) ? "" : " " + a.start.minusHours(CONFIRM_BEFORE_HOURS).format(DAY));
        }
        if ("Confirmed".equals(a.status)) {
            if (now.isAfter(a.start.plusMinutes(LATE_MINUTES))) return "More than 15 minutes late";
            if (!now.isBefore(a.start)) return "Appointment time reached";
            if (a.start.toLocalDate().isAfter(now.toLocalDate())) return "Not the appointment date yet";
            if (now.isBefore(a.start.minusMinutes(CHECKIN_EARLY_MINUTES))) return "Check-in from " + a.start.minusMinutes(CHECKIN_EARLY_MINUTES).format(HM);
        }
        return null;
    }

    public static Map<String, Object> flags(Map<String, Object> row) {
        Appt a = new Appt(row);
        Map<String, Object> f = new LinkedHashMap<>();
        f.put("canConfirm", confirm(a) == null);
        f.put("canCheckIn", checkIn(a) == null);
        f.put("canNoShow", noShow(a) == null);
        f.put("canCancel", staffCancel(a) == null);
        f.put("timingNote", note(a));
        return f;
    }
}
