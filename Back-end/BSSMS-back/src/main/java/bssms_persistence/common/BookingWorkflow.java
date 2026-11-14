package bssms_persistence.common;

import java.math.BigDecimal;
import java.sql.*;
import java.time.*;
import java.util.*;

public final class BookingWorkflow {
    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    public static final LocalTime OPEN = LocalTime.of(8, 30), CLOSE = LocalTime.of(18, 30);
    public static final int SLOT_MINUTES = 30, GAP_MINUTES = 15;
    private final Workflow w;

    public BookingWorkflow(Connection conn, int actor) { w = new Workflow(conn, actor); }
    public BookingWorkflow(Workflow workflow) { w = workflow; }
    public Workflow workflow() { return w; }

    public static final class Line {
        public Integer appointmentServiceId;
        public int serviceId, duration, lineNo, part;
        public Integer customerPackageId, technicianId, bedId;
        public boolean requested;
        public String serviceName, roomType, status = "Waiting";
        public BigDecimal tourCount = BigDecimal.ONE, price = BigDecimal.ZERO;
        public LocalTime start, end;
    }
    public static final class LineInput {
        public Integer serviceId, customerPackageId;
        public LineInput() {}
        public LineInput(Integer serviceId, Integer customerPackageId) { this.serviceId = serviceId; this.customerPackageId = customerPackageId; }
    }
    private static final class Busy {
        int appointmentId; Integer technicianId, bedId; String roomType; LocalTime start, end;
    }

    final class Day {
        final LocalDate date;
        final Map<Integer, LocalTime[]> shifts = new HashMap<>();
        final Map<Integer, String> names = new HashMap<>();
        final Set<Integer> leave = new HashSet<>();
        final Map<Integer, Set<Integer>> skills = new HashMap<>();
        final List<Busy> busy = new ArrayList<>();
        final Map<String, Integer> beds = new HashMap<>();
        Day(LocalDate date, Integer excludeAppointment) throws SQLException {
            this.date = date;
            int exclude = excludeAppointment == null ? -1 : excludeAppointment;
            for (Map<String, Object> r : w.query("SELECT sh.staff_id,sh.start_time,sh.end_time,s.full_name FROM StaffShift sh JOIN Staff s ON s.staff_id=sh.staff_id WHERE sh.shift_date=? AND s.role='Technician' AND s.status='Active'", java.sql.Date.valueOf(date))) {
                int id = Workflow.id(r.get("staffId"));
                shifts.put(id, new LocalTime[]{time(r.get("startTime")), time(r.get("endTime"))});
                names.put(id, String.valueOf(r.get("fullName")));
            }
            for (Map<String, Object> r : w.query("SELECT staff_id FROM StaffLeave WHERE status='Approved' AND ? BETWEEN start_date AND end_date", java.sql.Date.valueOf(date)))
                leave.add(Workflow.id(r.get("staffId")));
            for (Map<String, Object> r : w.query("SELECT staff_id,service_id FROM StaffService"))
                skills.computeIfAbsent(Workflow.id(r.get("staffId")), k -> new HashSet<>()).add(Workflow.id(r.get("serviceId")));
            for (Map<String, Object> r : w.query("SELECT l.appointment_id,l.technician_id,l.bed_id,s.required_room_type,l.start_time,l.end_time FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id JOIN Service s ON s.service_id=l.service_id WHERE a.appointment_date=? AND " + SchemaSql.BUSY_APPOINTMENT + " AND a.appointment_id<>?", java.sql.Date.valueOf(date), exclude)) {
                Busy b = new Busy();
                b.appointmentId = Workflow.id(r.get("appointmentId"));
                b.technicianId = r.get("technicianId") == null ? null : Workflow.id(r.get("technicianId"));
                b.bedId = r.get("bedId") == null ? null : Workflow.id(r.get("bedId"));
                b.roomType = String.valueOf(r.get("requiredRoomType"));
                b.start = time(r.get("startTime")); b.end = time(r.get("endTime"));
                busy.add(b);
            }
            for (Map<String, Object> r : w.query("SELECT r.room_type,COUNT(*) AS n FROM Bed b JOIN Room r ON r.room_id=b.room_id WHERE b.status='Active' AND r.status='Active' GROUP BY r.room_type"))
                beds.put(String.valueOf(r.get("roomType")), ((Number) r.get("n")).intValue());
        }
        boolean qualified(int staff, List<Line> lines) {
            Set<Integer> s = skills.getOrDefault(staff, Collections.emptySet());
            for (Line l : lines) if (!s.contains(l.serviceId)) return false;
            return true;
        }
        boolean free(int staff, LocalTime start, LocalTime end) {
            LocalTime[] shift = shifts.get(staff);
            if (shift == null || leave.contains(staff) || shift[0].isAfter(start) || shift[1].isBefore(end)) return false;
            for (Busy b : busy) if (b.technicianId != null && b.technicianId == staff && overlaps(b.start, b.end, start, end)) return false;
            return true;
        }
        List<Integer> candidates(List<Line> part) {
            LocalTime start = part.get(0).start, end = part.get(part.size() - 1).end;
            List<Integer> result = new ArrayList<>();
            for (Integer staff : new TreeSet<>(shifts.keySet())) if (qualified(staff, part) && free(staff, start, end)) result.add(staff);
            return result;
        }
        int unassigned(LocalTime start, LocalTime end) {
            Set<Integer> appointments = new HashSet<>();
            for (Busy b : busy) if (b.technicianId == null && overlaps(b.start, b.end, start, end)) appointments.add(b.appointmentId);
            return appointments.size();
        }
        int freeBeds(String roomType, LocalTime start, LocalTime end) {
            int used = 0;
            for (Busy b : busy) if (roomType.equals(b.roomType) && overlaps(b.start, b.end, start, end)) used++;
            return beds.getOrDefault(roomType, 0) - used;
        }
    }
    static boolean overlaps(LocalTime aStart, LocalTime aEnd, LocalTime bStart, LocalTime bEnd) {
        return aStart.isBefore(bEnd.plusMinutes(GAP_MINUTES)) && bStart.isBefore(aEnd.plusMinutes(GAP_MINUTES));
    }
    static LocalTime time(Object value) {
        String text = String.valueOf(value);
        return LocalTime.parse(text.length() > 8 ? text.substring(0, 8) : text);
    }

    public List<Line> plan(List<LineInput> inputs, LocalTime start) throws SQLException {
        if (inputs == null || inputs.isEmpty() || inputs.size() > 4) throw new IllegalArgumentException("Một lịch hẹn gồm từ 1 đến 4 dịch vụ.");
        List<Line> lines = new ArrayList<>();
        LocalTime cursor = start;
        int no = 1;
        for (LineInput in : inputs) {
            if (in == null || in.serviceId == null) throw new IllegalArgumentException("Thiếu dịch vụ.");
            Map<String, Object> s = w.query("SELECT service_id,service_name,duration,tour_count,required_room_type,price FROM Service WHERE service_id=? AND status='Active'", in.serviceId)
                    .stream().findFirst().orElseThrow(() -> new WorkflowException(404, "Dịch vụ không tồn tại hoặc đã ngừng kinh doanh."));
            Line l = new Line();
            l.serviceId = in.serviceId; l.customerPackageId = in.customerPackageId; l.lineNo = no++;
            l.serviceName = String.valueOf(s.get("serviceName")); l.duration = ((Number) s.get("duration")).intValue();
            l.tourCount = new BigDecimal(String.valueOf(s.get("tourCount"))); l.roomType = String.valueOf(s.get("requiredRoomType"));
            l.price = in.customerPackageId == null ? new BigDecimal(String.valueOf(s.get("price"))) : BigDecimal.ZERO;
            l.start = cursor; l.end = cursor.plusMinutes(l.duration); cursor = l.end;
            lines.add(l);
        }
        assignParts(lines);
        return lines;
    }
    public static void assignParts(List<Line> lines) {
        int split = lines.size();
        if (lines.size() >= 3) {
            BigDecimal total = BigDecimal.ZERO;
            for (Line l : lines) total = total.add(l.tourCount);
            BigDecimal best = null, left = BigDecimal.ZERO;
            for (int k = 1; k < lines.size(); k++) {
                left = left.add(lines.get(k - 1).tourCount);
                BigDecimal diff = left.subtract(total.subtract(left)).abs();
                if (best == null || diff.compareTo(best) < 0) { best = diff; split = k; }
            }
        }
        for (int i = 0; i < lines.size(); i++) lines.get(i).part = i < split ? 0 : 1;
    }
    static List<List<Line>> parts(List<Line> lines) {
        List<List<Line>> parts = new ArrayList<>();
        for (Line l : lines) {
            while (parts.size() <= l.part) parts.add(new ArrayList<>());
            parts.get(l.part).add(l);
        }
        return parts;
    }

    String reason(Day day, List<Line> lines, Integer requested, boolean customerRules, int[] technicianCount) {
        LocalDateTime start = LocalDateTime.of(day.date, lines.get(0).start);
        LocalDateTime now = LocalDateTime.now(ZONE);
        if (lines.get(lines.size() - 1).end.isAfter(CLOSE) || lines.get(0).start.isBefore(OPEN)) return "Ngoài giờ làm việc";
        if (!start.isAfter(now)) return "Đã qua giờ";
        if (customerRules && start.isBefore(now.plusHours(2))) return "Đã qua giờ";
        if (customerRules && day.date.isAfter(now.toLocalDate().plusDays(30))) return "Quá 30 ngày";
        int minimum = Integer.MAX_VALUE;
        for (List<Line> part : parts(lines)) {
            List<Integer> candidates = day.candidates(part);
            if (requested != null && part.get(0).part == 0) {
                if (!candidates.contains(requested)) return "KTV đã chọn bận";
                minimum = Math.min(minimum, 1);
                continue;
            }
            int spare = candidates.size() - day.unassigned(part.get(0).start, part.get(part.size() - 1).end);
            if (spare <= 0) return "Hết KTV";
            minimum = Math.min(minimum, spare);
        }
        for (Line l : lines) if (day.freeBeds(l.roomType, l.start, l.end) <= 0) return "Hết phòng/giường";
        if (technicianCount != null) technicianCount[0] = minimum == Integer.MAX_VALUE ? 0 : minimum;
        return null;
    }

    public Map<String, Object> slots(List<Integer> serviceIds, String date, Integer technician, Integer excludeAppointment, boolean customerRules) throws SQLException {
        LocalDate day = LocalDate.parse(date);
        List<LineInput> inputs = new ArrayList<>();
        for (Integer id : serviceIds) inputs.add(new LineInput(id, null));
        List<Line> template = plan(inputs, OPEN);
        int total = 0;
        for (Line l : template) total += l.duration;
        Day data = new Day(day, excludeAppointment);
        List<Map<String, Object>> slots = new ArrayList<>();
        for (LocalTime start = OPEN; !start.plusMinutes(total).isAfter(CLOSE); start = start.plusMinutes(SLOT_MINUTES)) {
            List<Line> lines = shift(template, start);
            int[] count = {0};
            String reason = reason(data, lines, technician, customerRules, count);
            Map<String, Object> slot = new LinkedHashMap<>();
            slot.put("startTime", start.toString());
            slot.put("endTime", lines.get(lines.size() - 1).end.toString());
            slot.put("available", reason == null);
            slot.put("reason", reason);
            slot.put("availableTechnicianCount", reason == null ? count[0] : 0);
            if (!customerRules && reason == null) {
                List<List<Map<String, Object>>> free = new ArrayList<>();
                int waiting = 0;
                for (List<Line> part : parts(lines)) {
                    waiting = Math.max(waiting, data.unassigned(part.get(0).start, part.get(part.size() - 1).end));
                    List<Map<String, Object>> names = new ArrayList<>();
                    for (Integer staff : data.candidates(part)) {
                        if (technician != null && part.get(0).part == 0 && !technician.equals(staff)) continue;
                        Map<String, Object> t = new LinkedHashMap<>();
                        t.put("staffId", staff); t.put("fullName", data.names.get(staff));
                        names.add(t);
                    }
                    free.add(names);
                }
                slot.put("freeTechnicians", free);
                slot.put("waitingAppointments", waiting);
            }
            slots.add(slot);
        }
        List<Map<String, Object>> services = new ArrayList<>();
        for (Line l : template) services.add(lineView(l));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("appointmentDate", day.toString());
        result.put("totalDuration", total);
        result.put("services", services);
        result.put("technicians", qualifiedTechnicians(template, data));
        result.put("slots", slots);
        return result;
    }
    private List<Map<String, Object>> qualifiedTechnicians(List<Line> lines, Day day) {
        List<Line> first = parts(lines).get(0);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Integer staff : new TreeSet<>(day.shifts.keySet())) {
            if (!day.qualified(staff, first) || day.leave.contains(staff)) continue;
            Map<String, Object> t = new LinkedHashMap<>();
            t.put("staffId", staff); t.put("fullName", day.names.get(staff));
            result.add(t);
        }
        return result;
    }
    static List<Line> shift(List<Line> template, LocalTime start) {
        List<Line> lines = new ArrayList<>();
        LocalTime cursor = start;
        for (Line t : template) {
            Line l = copy(t);
            l.start = cursor; l.end = cursor.plusMinutes(l.duration); cursor = l.end;
            lines.add(l);
        }
        return lines;
    }
    static Line copy(Line t) {
        Line l = new Line();
        l.appointmentServiceId = t.appointmentServiceId; l.serviceId = t.serviceId; l.duration = t.duration; l.lineNo = t.lineNo; l.part = t.part;
        l.customerPackageId = t.customerPackageId; l.technicianId = t.technicianId; l.bedId = t.bedId; l.requested = t.requested;
        l.serviceName = t.serviceName; l.roomType = t.roomType; l.status = t.status; l.tourCount = t.tourCount; l.price = t.price;
        l.start = t.start; l.end = t.end;
        return l;
    }
    public static Map<String, Object> lineView(Line l) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("appointmentServiceId", l.appointmentServiceId); m.put("lineNo", l.lineNo); m.put("serviceId", l.serviceId);
        m.put("serviceName", l.serviceName); m.put("duration", l.duration); m.put("tourCount", l.tourCount);
        m.put("requiredRoomType", l.roomType); m.put("unitPrice", l.price); m.put("customerPackageId", l.customerPackageId);
        m.put("startTime", l.start == null ? null : l.start.toString()); m.put("endTime", l.end == null ? null : l.end.toString());
        m.put("technicianId", l.technicianId); m.put("bedId", l.bedId); m.put("part", l.part + 1); m.put("status", l.status);
        return m;
    }

    void requirePackage(int customer, Line line, LocalDate date, Integer excludeAppointment, Map<Integer, Integer> usedInThisBooking) throws SQLException {
        int pkg = line.customerPackageId;
        List<Map<String, Object>> rows = w.query("SELECT cp.remaining_sessions,cp.expiry_date,cp.status,(SELECT COUNT(*) FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id WHERE l.customer_package_id=cp.customer_package_id AND l.status<>'Done' AND " + SchemaSql.BUSY_APPOINTMENT + " AND a.appointment_id<>?) AS reserved FROM CustomerPackage cp JOIN TreatmentPackageService ps ON ps.treatment_package_id=cp.treatment_package_id AND ps.service_id=? WHERE cp.customer_package_id=? AND cp.customer_id=?",
                excludeAppointment == null ? -1 : excludeAppointment, line.serviceId, pkg, customer);
        if (rows.isEmpty()) throw new IllegalArgumentException("Gói liệu trình không áp dụng cho dịch vụ " + line.serviceName + ".");
        Map<String, Object> r = rows.get(0);
        LocalDate expiry = LocalDate.parse(String.valueOf(r.get("expiryDate")).substring(0, 10));
        int remaining = ((Number) r.get("remainingSessions")).intValue() - ((Number) r.get("reserved")).intValue() - usedInThisBooking.getOrDefault(pkg, 0);
        if (!"Active".equals(r.get("status")) || expiry.isBefore(date) || remaining <= 0)
            throw new WorkflowException(409, "Gói liệu trình đã hết buổi hoặc hết hạn. Vui lòng chọn thanh toán dịch vụ.");
        usedInThisBooking.merge(pkg, 1, Integer::sum);
    }

    public int create(int customer, List<LineInput> inputs, String date, String start, Integer requested,
                      String paymentChoice, String notes, Integer createdByStaff) throws SQLException {
        return w.transaction(() -> {
            if (w.query("SELECT customer_id FROM Customer WHERE customer_id=? AND status='Active'", customer).isEmpty())
                throw new WorkflowException(404, "Khách hàng không tồn tại hoặc đã bị vô hiệu hóa.");
            boolean online = createdByStaff == null;
            LocalDate day = LocalDate.parse(date);
            List<Line> lines = plan(inputs, LocalTime.parse(start));
            validate(customer, lines, day, requested, online, null);
            String choice = "Online".equals(paymentChoice) ? "Online" : "Counter";
            String status = online ? "Pending" : "Confirmed";
            int id = w.insert("INSERT INTO Appointment(customer_id,appointment_date,start_time,end_time,status,payment_choice,notes,created_by_staff_id,created_at,confirmed_at) VALUES(?,?,?,?,?,?,?,?,SYSDATETIME(),?)",
                    customer, java.sql.Date.valueOf(day), Time.valueOf(lines.get(0).start), Time.valueOf(lines.get(lines.size() - 1).end),
                    status, choice, blank(notes), createdByStaff, online ? null : new Timestamp(System.currentTimeMillis()));
            insertLines(id, lines, requested);
            w.history(id, null, status, online ? "Khách đặt online" : "Lễ tân tạo lịch");
            new BillingWorkflow(w).syncAppointmentInvoice(id, createdByStaff);
            return id;
        });
    }
    private void insertLines(int appointment, List<Line> lines, Integer requested) throws SQLException {
        for (Line l : lines) {
            boolean req = requested != null && l.part == 0;
            w.update("INSERT INTO AppointmentService(appointment_id,service_id,line_no,start_time,end_time,technician_id,is_requested_technician,tour_count,bed_id,customer_package_id,unit_price,status) VALUES(?,?,?,?,?,?,?,?,NULL,?,?,'Waiting')",
                    appointment, l.serviceId, l.lineNo, Time.valueOf(l.start), Time.valueOf(l.end), req ? requested : null, req, l.tourCount, l.customerPackageId, l.price);
        }
    }
    private void validate(int customer, List<Line> lines, LocalDate day, Integer requested, boolean customerRules, Integer exclude) throws SQLException {
        Map<Integer, Integer> used = new HashMap<>();
        for (Line l : lines) if (l.customerPackageId != null) requirePackage(customer, l, day, exclude, used);
        if (!w.query("SELECT a.appointment_id FROM Appointment a WHERE a.customer_id=? AND a.appointment_date=? AND " + SchemaSql.BUSY_APPOINTMENT + " AND a.appointment_id<>? AND a.start_time<? AND a.end_time>?",
                customer, java.sql.Date.valueOf(day), exclude == null ? -1 : exclude, Time.valueOf(lines.get(lines.size() - 1).end), Time.valueOf(lines.get(0).start)).isEmpty())
            throw new WorkflowException(409, "Khách hàng đã có lịch hẹn khác trùng giờ.");
        String reason = reason(new Day(day, exclude), lines, requested, customerRules, null);
        if (reason != null) {
            if (customerRules && "Đã qua giờ".equals(reason)) throw new WorkflowException(409, "Lịch online phải đặt trước ít nhất 2 tiếng và không quá 30 ngày (BR-06).");
            throw new WorkflowException(409, "Khung giờ không còn trống: " + reason + ". Vui lòng chọn khung giờ khác.");
        }
    }

    public String recheck(int appointment) throws SQLException {
        LocalDate date = LocalDate.parse(String.valueOf(w.one("SELECT appointment_date FROM Appointment WHERE appointment_id=?", appointment).get("appointmentDate")).substring(0, 10));
        List<Line> lines = lines(appointment);
        if (lines.isEmpty()) return "Lịch không có dịch vụ";
        Integer requested = lines.stream().filter(l -> l.requested && l.part == 0 && l.technicianId != null).map(l -> l.technicianId).findFirst().orElse(null);
        return reason(new Day(date, appointment), lines, requested, false, null);
    }

    public void reschedule(int appointment, List<LineInput> inputs, String date, String start, boolean byCustomer, String reason) throws SQLException {
        w.transaction(() -> {
            Map<String, Object> a = w.one("SELECT customer_id,status,appointment_date,start_time FROM Appointment WHERE appointment_id=?", appointment);
            String status = String.valueOf(a.get("status"));
            if (!"Pending".equals(status) && !"Confirmed".equals(status)) throw new WorkflowException(409, "Chỉ đổi được lịch đang chờ xác nhận hoặc đã xác nhận.");
            LocalDateTime current = LocalDateTime.of(LocalDate.parse(String.valueOf(a.get("appointmentDate")).substring(0, 10)), time(a.get("startTime")));
            if (byCustomer && current.isBefore(LocalDateTime.now(ZONE).plusHours(2))) throw new WorkflowException(409, "Chỉ được đổi lịch trước giờ hẹn ít nhất 2 tiếng (BR-06).");
            List<LineInput> list = inputs;
            if (list == null || list.isEmpty()) {
                list = new ArrayList<>();
                for (Map<String, Object> r : w.query("SELECT service_id,customer_package_id FROM AppointmentService WHERE appointment_id=? ORDER BY line_no", appointment))
                    list.add(new LineInput(Workflow.id(r.get("serviceId")), r.get("customerPackageId") == null ? null : Workflow.id(r.get("customerPackageId"))));
            }
            Integer requested = w.query("SELECT TOP 1 technician_id FROM AppointmentService WHERE appointment_id=? AND is_requested_technician=1", appointment)
                    .stream().map(r -> (Integer) Workflow.id(r.get("technicianId"))).findFirst().orElse(null);
            int customer = Workflow.id(a.get("customerId"));
            LocalDate day = LocalDate.parse(date);
            List<Line> lines = plan(list, LocalTime.parse(start));
            validate(customer, lines, day, requested, byCustomer, appointment);
            w.update("DELETE FROM InvoiceService WHERE appointment_service_id IN (SELECT appointment_service_id FROM AppointmentService WHERE appointment_id=?)", appointment);
            w.update("DELETE FROM AppointmentService WHERE appointment_id=?", appointment);
            insertLines(appointment, lines, requested);
            String next = byCustomer ? "Pending" : status;
            w.update("UPDATE Appointment SET appointment_date=?,start_time=?,end_time=?,status=?,confirmed_at=CASE WHEN ?='Pending' THEN NULL ELSE confirmed_at END WHERE appointment_id=?",
                    java.sql.Date.valueOf(day), Time.valueOf(lines.get(0).start), Time.valueOf(lines.get(lines.size() - 1).end), next, next, appointment);
            w.history(appointment, status, next, blank(reason) == null ? "Đổi lịch" : reason);
            new BillingWorkflow(w).syncAppointmentInvoice(appointment, null);
            return null;
        });
    }

    public List<Line> lines(int appointment) throws SQLException {
        List<Line> lines = new ArrayList<>();
        for (Map<String, Object> r : w.query("SELECT l.*,s.service_name,s.duration,s.required_room_type FROM AppointmentService l JOIN Service s ON s.service_id=l.service_id WHERE l.appointment_id=? ORDER BY l.line_no", appointment)) {
            Line l = new Line();
            l.appointmentServiceId = Workflow.id(r.get("appointmentServiceId")); l.serviceId = Workflow.id(r.get("serviceId"));
            l.lineNo = Workflow.id(r.get("lineNo")); l.serviceName = String.valueOf(r.get("serviceName"));
            l.duration = ((Number) r.get("duration")).intValue(); l.roomType = String.valueOf(r.get("requiredRoomType"));
            l.tourCount = new BigDecimal(String.valueOf(r.get("tourCount"))); l.price = new BigDecimal(String.valueOf(r.get("unitPrice")));
            l.customerPackageId = r.get("customerPackageId") == null ? null : Workflow.id(r.get("customerPackageId"));
            l.technicianId = r.get("technicianId") == null ? null : Workflow.id(r.get("technicianId"));
            l.bedId = r.get("bedId") == null ? null : Workflow.id(r.get("bedId"));
            l.requested = Boolean.TRUE.equals(r.get("isRequestedTechnician"));
            l.status = String.valueOf(r.get("status"));
            l.start = time(r.get("startTime")); l.end = time(r.get("endTime"));
            lines.add(l);
        }
        assignParts(lines);
        return lines;
    }

    BigDecimal startOffset(int staff, LocalDate date) throws SQLException {
        java.sql.Date d = java.sql.Date.valueOf(date);
        Map<String, Object> s = w.one("SELECT (SELECT MIN(start_time) FROM StaffShift WHERE staff_id=? AND shift_date=?) AS mine,"
                + "(SELECT MIN(sh.start_time) FROM StaffShift sh JOIN Staff st ON st.staff_id=sh.staff_id WHERE st.role='Technician' AND sh.shift_date=?) AS earliest", staff, d, d);
        if (s.get("mine") == null || s.get("earliest") == null || !time(s.get("mine")).isAfter(time(s.get("earliest")))) return BigDecimal.ZERO;
        Object min = w.one("SELECT MIN(counted_tours) AS m FROM TechnicianDailyTour WHERE work_date=?", d).get("m");
        return min == null ? BigDecimal.ZERO : new BigDecimal(String.valueOf(min));
    }

    void ensureTour(int staff, LocalDate date) throws SQLException {
        if (!w.query("SELECT staff_id FROM TechnicianDailyTour WHERE staff_id=? AND work_date=?", staff, java.sql.Date.valueOf(date)).isEmpty()) return;
        BigDecimal offset = startOffset(staff, date);
        w.update("INSERT INTO TechnicianDailyTour(staff_id,work_date,start_offset_tours,counted_tours,actual_tours,requested_tours,last_assigned_at) VALUES(?,?,?,?,0,0,NULL)",
                staff, java.sql.Date.valueOf(date), offset, offset);
    }
    Integer rotate(List<Integer> candidates, LocalDate date, Set<Integer> exclude) throws SQLException {
        Integer best = null; BigDecimal bestTours = null; Timestamp bestTime = null;
        for (Integer staff : candidates) {
            if (exclude.contains(staff)) continue;
            ensureTour(staff, date);
            Map<String, Object> r = w.one("SELECT counted_tours,last_assigned_at FROM TechnicianDailyTour WHERE staff_id=? AND work_date=?", staff, java.sql.Date.valueOf(date));
            BigDecimal tours = new BigDecimal(String.valueOf(r.get("countedTours")));
            Timestamp at = r.get("lastAssignedAt") == null ? null : Timestamp.valueOf(String.valueOf(r.get("lastAssignedAt")).replace('T', ' '));
            boolean better = best == null || tours.compareTo(bestTours) < 0
                    || (tours.compareTo(bestTours) == 0 && (at == null ? bestTime != null : bestTime != null && at.before(bestTime)));
            if (better) { best = staff; bestTours = tours; bestTime = at; }
        }
        return best;
    }
    void addTours(int staff, LocalDate date, BigDecimal tours, boolean requested) throws SQLException {
        ensureTour(staff, date);
        if (requested) w.update("UPDATE TechnicianDailyTour SET requested_tours=requested_tours+? WHERE staff_id=? AND work_date=?", tours, staff, java.sql.Date.valueOf(date));
        else w.update("UPDATE TechnicianDailyTour SET counted_tours=counted_tours+?,last_assigned_at=SYSDATETIME() WHERE staff_id=? AND work_date=?", tours, staff, java.sql.Date.valueOf(date));
    }
    static BigDecimal tours(List<Line> part) {
        BigDecimal total = BigDecimal.ZERO;
        for (Line l : part) total = total.add(l.tourCount);
        return total;
    }

    List<Map<String, Object>> freeBeds(String roomType, LocalDate date, LocalTime start, LocalTime end, Integer excludeAppointment, Set<Integer> taken) throws SQLException {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> b : w.query("SELECT b.bed_id,b.bed_number,r.room_id,r.room_name FROM Bed b JOIN Room r ON r.room_id=b.room_id WHERE b.status='Active' AND r.status='Active' AND r.room_type=? ORDER BY r.room_name,b.bed_number", roomType)) {
            int bed = Workflow.id(b.get("bedId"));
            if (taken.contains(bed)) continue;
            boolean busy = false;
            for (Map<String, Object> u : w.query("SELECT l.start_time,l.end_time FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id WHERE l.bed_id=? AND a.appointment_date=? AND " + SchemaSql.BUSY_APPOINTMENT + " AND a.appointment_id<>? AND l.status<>'Done'",
                    bed, java.sql.Date.valueOf(date), excludeAppointment == null ? -1 : excludeAppointment))
                if (overlaps(time(u.get("startTime")), time(u.get("endTime")), start, end)) { busy = true; break; }
            if (!busy) result.add(b);
        }
        return result;
    }

    public Map<String, Object> checkInPlan(int appointment) throws SQLException {
        Map<String, Object> a = w.one("SELECT a.appointment_id,a.appointment_date,a.status,a.start_time,a.end_time,c.full_name AS customer_name,c.phone AS customer_phone FROM Appointment a JOIN Customer c ON c.customer_id=a.customer_id WHERE a.appointment_id=?", appointment);
        LocalDate date = LocalDate.parse(String.valueOf(a.get("appointmentDate")).substring(0, 10));
        List<Line> lines = lines(appointment);
        Day day = new Day(date, appointment);
        Set<Integer> used = new HashSet<>();
        Set<Integer> takenBeds = new HashSet<>();
        List<Map<String, Object>> views = new ArrayList<>();
        for (List<Line> part : parts(lines)) {
            List<Integer> candidates = day.candidates(part);
            Integer suggested = part.get(0).technicianId != null ? part.get(0).technicianId : rotateReadOnly(candidates, date, used);
            if (suggested != null) used.add(suggested);
            for (Line l : part) {
                Map<String, Object> v = lineView(l);
                v.put("suggestedTechnicianId", suggested);
                v.put("suggestedTechnicianName", suggested == null ? null : day.names.get(suggested));
                List<Map<String, Object>> options = new ArrayList<>();
                for (Integer c : candidates) { Map<String, Object> o = new LinkedHashMap<>(); o.put("staffId", c); o.put("fullName", day.names.get(c)); options.add(o); }
                if (l.technicianId != null && !candidates.contains(l.technicianId)) {
                    Map<String, Object> o = new LinkedHashMap<>(); o.put("staffId", l.technicianId); o.put("fullName", day.names.get(l.technicianId)); options.add(0, o);
                }
                v.put("technicianOptions", options);
                List<Map<String, Object>> beds = freeBeds(l.roomType, date, l.start, l.end, appointment, takenBeds);
                Integer bed = l.bedId != null ? l.bedId : beds.isEmpty() ? null : Workflow.id(beds.get(0).get("bedId"));
                if (bed != null) takenBeds.add(bed);
                v.put("suggestedBedId", bed);
                v.put("bedOptions", beds);
                views.add(v);
            }
        }
        Map<String, Object> result = new LinkedHashMap<>(a);
        result.put("lines", views);
        return result;
    }
    private Integer rotateReadOnly(List<Integer> candidates, LocalDate date, Set<Integer> exclude) throws SQLException {
        Integer best = null; BigDecimal bestTours = null; String bestTime = null;
        for (Integer staff : candidates) {
            if (exclude.contains(staff)) continue;
            List<Map<String, Object>> rows = w.query("SELECT counted_tours,last_assigned_at FROM TechnicianDailyTour WHERE staff_id=? AND work_date=?", staff, java.sql.Date.valueOf(date));
            BigDecimal tours = rows.isEmpty() ? startOffset(staff, date) : new BigDecimal(String.valueOf(rows.get(0).get("countedTours")));
            String at = rows.isEmpty() || rows.get(0).get("lastAssignedAt") == null ? null : String.valueOf(rows.get(0).get("lastAssignedAt"));
            boolean better = best == null || tours.compareTo(bestTours) < 0
                    || (tours.compareTo(bestTours) == 0 && (at == null ? bestTime != null : bestTime != null && at.compareTo(bestTime) < 0));
            if (better) { best = staff; bestTours = tours; bestTime = at; }
        }
        return best;
    }

    public void checkIn(int appointment, Map<Integer, Integer> technicianByLine, Map<Integer, Integer> bedByLine) throws SQLException {
        w.transaction(() -> {
            Map<String, Object> a = w.one("SELECT status,appointment_date,start_time FROM Appointment WHERE appointment_id=?", appointment);
            String block = Timing.checkIn(new Timing.Appt(a));
            if (block != null) throw new WorkflowException(409, block);
            LocalDate date = LocalDate.parse(String.valueOf(a.get("appointmentDate")).substring(0, 10));
            assign(appointment, date, technicianByLine, bedByLine, true);
            w.update("UPDATE Appointment SET status='Checked-in',checked_in_at=SYSDATETIME() WHERE appointment_id=?", appointment);
            w.history(appointment, "Confirmed", "Checked-in", "Check-in");
            return null;
        });
    }
    void assign(int appointment, LocalDate date, Map<Integer, Integer> technicianByLine, Map<Integer, Integer> bedByLine, boolean checkIn) throws SQLException {
        List<Line> lines = lines(appointment);
        Day day = new Day(date, appointment);
        Set<Integer> usedTechnicians = new HashSet<>();
        Set<Integer> takenBeds = new HashSet<>();
        for (List<Line> part : parts(lines)) {
            if (part.stream().allMatch(l -> "Done".equals(l.status))) continue;
            Integer current = part.get(0).technicianId;
            Integer chosen = null;
            for (Line l : part) {
                Integer v = technicianByLine == null ? null : technicianByLine.get(l.appointmentServiceId);
                if (v == null) continue;
                if (chosen != null && !chosen.equals(v)) throw new IllegalArgumentException("Mỗi phần dịch vụ chỉ do một kỹ thuật viên thực hiện (BR-11).");
                chosen = v;
            }
            List<Integer> candidates = day.candidates(part);
            if (chosen != null && !chosen.equals(current) && !candidates.contains(chosen))
                throw new WorkflowException(409, "Kỹ thuật viên đã chọn không đủ kỹ năng hoặc không rảnh trong khung giờ này.");
            if (chosen == null) chosen = current;
            if (chosen == null) {
                chosen = rotate(candidates, date, usedTechnicians);
                if (chosen == null) chosen = rotate(candidates, date, Collections.emptySet());
                if (chosen == null) throw new WorkflowException(409, "Không có kỹ thuật viên phù hợp đang rảnh cho " + part.get(0).serviceName + ".");
            }
            usedTechnicians.add(chosen);
            boolean requested = part.get(0).requested;
            if (!chosen.equals(current)) {
                if (!checkIn && current != null) addTours(current, date, tours(part).negate(), requested);
                addTours(chosen, date, tours(part), false);
                requested = false;
            } else if (checkIn) addTours(chosen, date, tours(part), requested);
            for (Line l : part) {
                if ("Done".equals(l.status)) continue;
                Integer override = bedByLine == null ? null : bedByLine.get(l.appointmentServiceId);
                Integer bed = override != null ? override : l.bedId;
                List<Map<String, Object>> free = freeBeds(l.roomType, date, l.start, l.end, appointment, takenBeds);
                final Integer wanted = bed;
                boolean ok = wanted != null && free.stream().anyMatch(b -> Workflow.id(b.get("bedId")) == wanted);
                if (!ok) {
                    if (override != null) throw new WorkflowException(409, "Giường đã chọn không trống hoặc không đúng loại phòng.");
                    if (!free.isEmpty()) bed = Workflow.id(free.get(0).get("bedId"));
                    else if (checkIn) throw new WorkflowException(409, "Hết giường loại " + l.roomType + " trống cho " + l.serviceName + ".");
                    else bed = null;
                }
                if (bed != null) takenBeds.add(bed);
                w.update("UPDATE AppointmentService SET technician_id=?,is_requested_technician=?,bed_id=? WHERE appointment_service_id=?", chosen, requested, bed, l.appointmentServiceId);
            }
        }
    }

    public void reassign(int appointment, Map<Integer, Integer> technicianByLine, Map<Integer, Integer> bedByLine) throws SQLException {
        w.transaction(() -> {
            Map<String, Object> a = w.one("SELECT status,appointment_date FROM Appointment WHERE appointment_id=?", appointment);
            String status = String.valueOf(a.get("status"));
            if (!Arrays.asList("Pending", "Confirmed", "Checked-in", "In-progress").contains(status)) throw new WorkflowException(409, "Lịch hẹn không còn hiệu lực.");
            LocalDate date = LocalDate.parse(String.valueOf(a.get("appointmentDate")).substring(0, 10));
            boolean started = !"Pending".equals(status) && !"Confirmed".equals(status);
            if (!started) {
                for (Line l : lines(appointment)) {
                    Integer t = technicianByLine == null ? null : technicianByLine.get(l.appointmentServiceId);
                    if (t == null && l.requested && !new Day(date, appointment).free(l.technicianId, l.start, l.end))
                        w.update("UPDATE AppointmentService SET technician_id=NULL,is_requested_technician=0 WHERE appointment_service_id=?", l.appointmentServiceId);
                }
                if (technicianByLine != null && !technicianByLine.isEmpty()) {
                    Day day = new Day(date, appointment);
                    for (List<Line> part : parts(lines(appointment))) {
                        Integer t = technicianByLine.get(part.get(0).appointmentServiceId);
                        if (t == null) continue;
                        if (!day.candidates(part).contains(t)) throw new WorkflowException(409, "Kỹ thuật viên thay thế không phù hợp hoặc đang bận.");
                        for (Line l : part) w.update("UPDATE AppointmentService SET technician_id=?,is_requested_technician=0 WHERE appointment_service_id=?", t, l.appointmentServiceId);
                    }
                }
            } else assign(appointment, date, technicianByLine, bedByLine, false);
            w.history(appointment, status, status, "Điều phối lại do nghỉ phép/bảo trì");
            return null;
        });
    }

    public List<Map<String, Object>> affected() throws SQLException {
        return w.query("SELECT a.appointment_id,a.appointment_date,a.start_time,a.status,c.full_name AS customer_name,c.phone AS customer_phone,l.appointment_service_id,l.line_no,s.service_name,l.start_time AS line_start,l.end_time AS line_end,st.full_name AS technician_name,b.bed_number,r.room_name,"
                + "CASE WHEN l.technician_id IS NOT NULL AND EXISTS(SELECT 1 FROM StaffLeave lv WHERE lv.staff_id=l.technician_id AND lv.status='Approved' AND a.appointment_date BETWEEN lv.start_date AND lv.end_date) THEN N'KTV nghỉ phép' "
                + "WHEN l.technician_id IS NOT NULL AND (st.status<>'Active' OR st.role<>'Technician' OR NOT EXISTS(SELECT 1 FROM StaffShift sh WHERE sh.staff_id=l.technician_id AND sh.shift_date=a.appointment_date AND sh.start_time<=l.start_time AND sh.end_time>=l.end_time)) THEN N'KTV không có ca' "
                + "WHEN l.bed_id IS NOT NULL AND (b.status<>'Active' OR r.status<>'Active') THEN N'Giường/phòng bảo trì' END AS reason "
                + "FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id JOIN Customer c ON c.customer_id=a.customer_id JOIN Service s ON s.service_id=l.service_id "
                + "LEFT JOIN Staff st ON st.staff_id=l.technician_id LEFT JOIN Bed b ON b.bed_id=l.bed_id LEFT JOIN Room r ON r.room_id=b.room_id "
                + "WHERE a.appointment_date>=CAST(SYSDATETIME() AS date) AND " + SchemaSql.BUSY_APPOINTMENT + " AND l.status<>'Done' AND ("
                + "(l.technician_id IS NOT NULL AND (EXISTS(SELECT 1 FROM StaffLeave lv WHERE lv.staff_id=l.technician_id AND lv.status='Approved' AND a.appointment_date BETWEEN lv.start_date AND lv.end_date) OR st.status<>'Active' OR st.role<>'Technician' OR NOT EXISTS(SELECT 1 FROM StaffShift sh WHERE sh.staff_id=l.technician_id AND sh.shift_date=a.appointment_date AND sh.start_time<=l.start_time AND sh.end_time>=l.end_time))) "
                + "OR (l.bed_id IS NOT NULL AND (b.status<>'Active' OR r.status<>'Active'))) ORDER BY a.appointment_date,a.start_time,l.line_no");
    }

    public Map<String, Object> replacementOptions(int appointment) throws SQLException {
        Map<String, Object> a = w.one("SELECT appointment_date FROM Appointment WHERE appointment_id=?", appointment);
        LocalDate date = LocalDate.parse(String.valueOf(a.get("appointmentDate")).substring(0, 10));
        Day day = new Day(date, appointment);
        List<Map<String, Object>> result = new ArrayList<>();
        Set<Integer> used = new HashSet<>();
        Set<Integer> takenBeds = new HashSet<>();
        for (List<Line> part : parts(lines(appointment))) {
            List<Integer> candidates = day.candidates(part);
            Integer suggested = rotateReadOnly(candidates, date, used);
            if (suggested != null) used.add(suggested);
            for (Line l : part) {
                Map<String, Object> v = lineView(l);
                v.put("suggestedTechnicianId", suggested);
                List<Map<String, Object>> options = new ArrayList<>();
                for (Integer c : candidates) { Map<String, Object> o = new LinkedHashMap<>(); o.put("staffId", c); o.put("fullName", day.names.get(c)); options.add(o); }
                v.put("technicianOptions", options);
                List<Map<String, Object>> beds = freeBeds(l.roomType, date, l.start, l.end, appointment, takenBeds);
                if (!beds.isEmpty()) takenBeds.add(Workflow.id(beds.get(0).get("bedId")));
                v.put("bedOptions", beds);
                result.add(v);
            }
        }
        return Collections.singletonMap("lines", result);
    }

    public List<Map<String, Object>> withoutReplacement(int staff, LocalDate from, LocalDate to) throws SQLException {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> r : w.query("SELECT DISTINCT a.appointment_id,a.appointment_date,a.start_time,c.full_name AS customer_name FROM Appointment a JOIN AppointmentService l ON l.appointment_id=a.appointment_id JOIN Customer c ON c.customer_id=a.customer_id WHERE l.technician_id=? AND l.status<>'Done' AND a.appointment_date BETWEEN ? AND ? AND " + SchemaSql.BUSY_APPOINTMENT,
                staff, java.sql.Date.valueOf(from), java.sql.Date.valueOf(to))) {
            int appointment = Workflow.id(r.get("appointmentId"));
            LocalDate date = LocalDate.parse(String.valueOf(r.get("appointmentDate")).substring(0, 10));
            Day day = new Day(date, appointment);
            day.leave.add(staff);
            for (List<Line> part : parts(lines(appointment))) {
                if (part.get(0).technicianId == null || part.get(0).technicianId != staff) continue;
                if (day.candidates(part).isEmpty()) {
                    Map<String, Object> row = new LinkedHashMap<>(r);
                    row.put("serviceName", part.get(0).serviceName);
                    result.add(row);
                }
            }
        }
        return result;
    }

    public Map<String, Object> board(String date) throws SQLException {
        LocalDate day = LocalDate.parse(date);
        java.sql.Date d = java.sql.Date.valueOf(day);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("date", day.toString());
        result.put("technicians", w.query("SELECT s.staff_id,s.full_name,sh.shift_type,sh.start_time AS shift_start,sh.end_time AS shift_end,"
                + "CASE WHEN EXISTS(SELECT 1 FROM StaffLeave lv WHERE lv.staff_id=s.staff_id AND lv.status='Approved' AND ? BETWEEN lv.start_date AND lv.end_date) THEN 1 ELSE 0 END AS on_leave,"
                + "t.counted_tours,t.actual_tours,t.requested_tours,t.last_assigned_at "
                + "FROM Staff s LEFT JOIN StaffShift sh ON sh.staff_id=s.staff_id AND sh.shift_date=? LEFT JOIN TechnicianDailyTour t ON t.staff_id=s.staff_id AND t.work_date=? "
                + "WHERE s.role='Technician' AND s.status='Active' ORDER BY COALESCE(t.counted_tours,0),t.last_assigned_at,s.staff_id", d, d, d));
        result.put("lines", w.query("SELECT a.appointment_id,a.status AS appointment_status,a.start_time AS appointment_start,c.full_name AS customer_name,l.appointment_service_id,l.line_no,l.technician_id,l.is_requested_technician,l.start_time,l.end_time,l.status,s.service_name,b.bed_number,r.room_name "
                + "FROM AppointmentService l JOIN Appointment a ON a.appointment_id=l.appointment_id JOIN Customer c ON c.customer_id=a.customer_id JOIN Service s ON s.service_id=l.service_id "
                + "LEFT JOIN Bed b ON b.bed_id=l.bed_id LEFT JOIN Room r ON r.room_id=b.room_id WHERE a.appointment_date=? AND a.status IN ('Pending','Confirmed','Checked-in','In-progress','Completed') ORDER BY l.start_time", d));
        List<Map<String, Object>> arrivals = w.query("SELECT a.appointment_id,a.appointment_date,a.created_at,a.start_time,a.end_time,a.status,c.full_name AS customer_name,c.phone AS customer_phone,"
                + "(SELECT STRING_AGG(s.service_name,N', ') WITHIN GROUP (ORDER BY l.line_no) FROM AppointmentService l JOIN Service s ON s.service_id=l.service_id WHERE l.appointment_id=a.appointment_id) AS service_names "
                + "FROM Appointment a JOIN Customer c ON c.customer_id=a.customer_id WHERE a.appointment_date=? AND a.status IN ('Pending','Confirmed','Checked-in','In-progress') ORDER BY a.start_time", d);
        for (Map<String, Object> r : arrivals) r.putAll(Timing.flags(r));
        result.put("arrivals", arrivals);
        Object gap = w.one("SELECT MAX(counted_tours)-MIN(counted_tours) AS gap FROM TechnicianDailyTour WHERE work_date=?", d).get("gap");
        result.put("tourGap", gap);
        return result;
    }

    static String blank(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
