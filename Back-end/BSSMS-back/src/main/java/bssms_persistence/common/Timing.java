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
        if (!"Pending".equals(a.status)) return "Lịch không còn ở trạng thái chờ xác nhận (có thể đã tự hủy theo BR-09).";
        LocalDateTime now = now();
        if (!now.isBefore(a.start.minusHours(CONFIRM_BEFORE_HOURS)))
            return "Đã quá hạn xác nhận: lịch online phải được xác nhận trước giờ hẹn ít nhất 1 tiếng (BR-09). Hãy đổi sang giờ khác hoặc hủy lịch.";
        if (a.created != null && !now.isBefore(a.created.plusHours(CONFIRM_WITHIN_HOURS)))
            return "Đã quá hạn xác nhận: lịch chờ quá 24 giờ kể từ lúc đặt (BR-09). Hãy liên hệ khách để đặt lại.";
        return null;
    }

    public static String checkIn(Appt a) {
        if (!"Confirmed".equals(a.status)) return "Chỉ check-in lịch đã xác nhận.";
        LocalDateTime now = now();
        LocalDate today = now.toLocalDate();
        if (a.start.toLocalDate().isAfter(today)) return "Chưa đến ngày hẹn (" + a.start.format(DAY) + "). Chỉ check-in vào đúng ngày hẹn.";
        if (a.start.toLocalDate().isBefore(today)) return "Lịch hẹn ngày " + a.start.format(DAY) + " đã qua. Hãy đánh dấu Không đến hoặc đổi lịch.";
        if (now.isBefore(a.start.minusMinutes(CHECKIN_EARLY_MINUTES)))
            return "Chưa đến giờ check-in: chỉ check-in từ " + a.start.minusMinutes(CHECKIN_EARLY_MINUTES).format(HM) + " (60 phút trước giờ hẹn " + a.start.format(HM) + ").";
        if (now.isAfter(a.start.plusMinutes(LATE_MINUTES)))
            return "Khách đã trễ quá 15 phút so với giờ hẹn " + a.start.format(HM) + " (BR-10). Hãy đổi lịch sang giờ khác hoặc đánh dấu Không đến.";
        return null;
    }

    public static String noShow(Appt a) {
        if (!"Confirmed".equals(a.status)) return "Chỉ đánh dấu Không đến cho lịch đã xác nhận chưa check-in.";
        LocalDateTime limit = a.start.plusMinutes(LATE_MINUTES);
        if (!now().isAfter(limit)) return "Chưa đến lúc đánh dấu Không đến: khách được trễ tới " + limit.format(HM) + " ngày " + limit.format(DAY) + " (BR-10).";
        return null;
    }

    public static String staffCancel(Appt a) {
        if (!"Pending".equals(a.status) && !"Confirmed".equals(a.status)) return "Lịch đã check-in hoặc đã kết thúc nên không thể hủy.";
        if ("Confirmed".equals(a.status) && now().isAfter(a.start.plusMinutes(LATE_MINUTES)))
            return "Lịch đã quá giờ hẹn hơn 15 phút: hãy đánh dấu Không đến (No-show) thay vì hủy (BR-10, BR-19).";
        return null;
    }

    public static String collect(String appointmentStatus) {
        switch (appointmentStatus) {
            case "Checked-in": case "In-progress": case "Completed": return null;
            case "Pending": case "Confirmed": return "Chưa đến lúc thu tiền: khách chưa check-in. Thu tiền khi khách đã đến hoặc sau khi làm xong dịch vụ.";
            default: return "Lịch hẹn đã hủy hoặc khách không đến nên không thu tiền.";
        }
    }

    public static String payOnline(Appt a) {
        switch (a.status) {
            case "Checked-in": case "In-progress": case "Completed": return null;
            case "Pending": case "Confirmed":
                return now().isBefore(a.start) ? null : "Đã qua giờ hẹn nên không thể thanh toán trước. Vui lòng thanh toán tại quầy.";
            default: return "Lịch hẹn đã hủy hoặc khách không đến nên không thể thanh toán.";
        }
    }

    public static String startLine(String appointmentStatus, Object date, Object lineStart, boolean partStart) {
        if (!"Checked-in".equals(appointmentStatus) && !"In-progress".equals(appointmentStatus)) return "Khách chưa check-in.";
        LocalDateTime start = at(date, lineStart), now = now();
        if (!start.toLocalDate().equals(now.toLocalDate())) return "Chỉ bắt đầu dịch vụ trong ngày hẹn (" + start.format(DAY) + ").";
        if (partStart && now.isBefore(start.minusMinutes(START_EARLY_MINUTES)))
            return "Chưa đến giờ làm: dịch vụ bắt đầu lúc " + start.format(HM) + ", có thể bắt đầu từ " + start.minusMinutes(START_EARLY_MINUTES).format(HM) + ".";
        return null;
    }

    public static String note(Appt a) {
        LocalDateTime now = now();
        if ("Pending".equals(a.status)) {
            if (confirm(a) != null) return "Quá hạn xác nhận";
            return "Xác nhận trước " + a.start.minusHours(CONFIRM_BEFORE_HOURS).format(HM) + (a.start.toLocalDate().equals(now.toLocalDate()) ? "" : " " + a.start.minusHours(CONFIRM_BEFORE_HOURS).format(DAY));
        }
        if ("Confirmed".equals(a.status)) {
            if (now.isAfter(a.start.plusMinutes(LATE_MINUTES))) return "Trễ quá 15 phút";
            if (!now.isBefore(a.start)) return "Đã đến giờ hẹn";
            if (a.start.toLocalDate().isAfter(now.toLocalDate())) return "Chưa đến ngày hẹn";
            if (now.isBefore(a.start.minusMinutes(CHECKIN_EARLY_MINUTES))) return "Check-in từ " + a.start.minusMinutes(CHECKIN_EARLY_MINUTES).format(HM);
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
