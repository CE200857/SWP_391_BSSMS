package bssms_persistence.common;
import java.sql.*;
import bssms_account.Staff;
import bssms_booking.*;
import java.time.*;
import java.util.*;
public final class BookingWorkflow {
    private final Workflow w;
    public BookingWorkflow(Connection conn,int actor) {w=new Workflow(conn,actor);}
    private static final String LIVE="('Pending','Confirmed','Checked-in','In-progress')";
    public List<Staff> technicians(int service,Integer staff) throws SQLException {
        return w.query(ModelRows::staff, "SELECT s.staff_id,s.full_name FROM " + bssms_persistence.common.SchemaSql.STAFF + " s JOIN " + bssms_persistence.common.SchemaSql.ACCOUNTS + " ac ON ac.account_id=s.account_id JOIN StaffService ss ON ss.staff_id=s.staff_id WHERE ss.service_id=? AND s.status='Active' AND ac.status='Active' AND s.position='Technician' AND ac.role='Technician' AND (? IS NULL OR s.staff_id=?) ORDER BY s.staff_id",service,staff,staff);
    }
    public List<Staff> freeTechnicians(int service,String date,String start,String end,Integer staff,Integer exclude) throws SQLException {
        List<Staff> free=new ArrayList<>();
        for(Staff t:technicians(service,staff)) {
            int id=t.getStaffId();
            if(!w.query(rs -> rs.getInt("staff_id"), "SELECT staff_id FROM StaffShift WHERE staff_id=? AND shift_date=? AND start_time<=CAST(? AS time) AND end_time>=CAST(? AS time) AND NOT EXISTS(SELECT 1 FROM StaffLeave WHERE staff_id=? AND CAST(? AS date) BETWEEN start_date AND end_date) AND NOT EXISTS(SELECT 1 FROM Appointment a JOIN AppointmentStaff ast ON ast.appointment_id=a.appointment_id WHERE ast.staff_id=? AND a.appointment_date=? AND a.status IN "+LIVE+" AND a.appointment_id<>? AND a.start_time<CAST(? AS time) AND a.end_time>CAST(? AS time))",id,date,start,end,id,date,id,date,exclude==null?-1:exclude,end,start).isEmpty()) free.add(t);
        }
        return free;
    }
    public List<AvailableBed> beds(int service,String date,String start,String end,Integer exclude) throws SQLException {
        return w.query(ModelRows::availableBed, "SELECT b.bed_id,b.room_id,b.bed_number FROM Bed b JOIN Room r ON r.room_id=b.room_id JOIN Service s ON s.service_id=? WHERE b.status='Active' AND r.status='Active' AND (s.required_room_type IS NULL OR r.room_type=s.required_room_type) AND NOT EXISTS(SELECT 1 FROM Appointment a WHERE a.bed_id=b.bed_id AND a.appointment_date=? AND a.status IN "+LIVE+" AND a.appointment_id<>? AND a.start_time<CAST(? AS time) AND a.end_time>CAST(? AS time)) AND NOT EXISTS(SELECT 1 FROM ServiceEquipment se JOIN Equipment e ON e.equipment_id=se.equipment_id WHERE se.service_id=s.service_id AND (e.status<>'Active' OR (e.room_id IS NOT NULL AND e.room_id<>r.room_id))) AND NOT EXISTS(SELECT 1 FROM Appointment a JOIN AppointmentEquipment ae ON ae.appointment_id=a.appointment_id JOIN ServiceEquipment se ON se.equipment_id=ae.equipment_id WHERE se.service_id=s.service_id AND a.appointment_date=? AND a.status IN "+LIVE+" AND a.appointment_id<>? AND a.start_time<CAST(? AS time) AND a.end_time>CAST(? AS time)) ORDER BY b.bed_id",service,date,exclude==null?-1:exclude,end,start,date,exclude==null?-1:exclude,end,start);
    }
    public SlotAvailability slots(int service,String date,Integer staff) throws SQLException {
        LocalDate.parse(date);
        SlotAvailability s=w.one(ModelRows::slotAvailability, "SELECT service_name,duration FROM Service WHERE service_id=? AND status='Active'",service);
        int duration=s.getDuration();
        if(duration<=0||duration>720) throw new IllegalArgumentException("Invalid duration");
        List<TimeSlot> slots=new ArrayList<>();
        for(int minute=510;minute+duration<=1230;minute+=30) {
            String start=LocalTime.of(minute/60,minute%60).toString();
            String end=LocalTime.of((minute+duration)/60,(minute+duration)%60).toString();
            List<Staff> tech=freeTechnicians(service,date,start,end,staff,null);
            List<AvailableBed> beds=beds(service,date,start,end,null);
            boolean future=LocalDateTime.of(LocalDate.parse(date),LocalTime.parse(start)).isAfter(LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")));
            TimeSlot slot=new TimeSlot();
            slot.setStartTime(start);slot.setEndTime(end);slot.setAvailable(future&&!tech.isEmpty()&&!beds.isEmpty());
            slot.setAvailableTechnicians(tech);slot.setAvailableTechnicianCount(tech.size());slot.setFreeBeds(beds.size());
            slot.setFreeRooms(beds.stream().map(b->b.getRoomId()).distinct().count());slots.add(slot);
        }
        s.setServiceId(service);s.setAppointmentDate(date);s.setTechnicians(technicians(service,null));s.setSlots(slots);return s;
    }
    public Appointment save(int customer,int service,Integer pkg,String date,String start,Integer staff,Integer bed,Integer appointment,String notes) throws SQLException {
        int duration=w.one(rs -> rs.getInt("duration"), "SELECT duration FROM Service WHERE service_id=? AND status='Active'",service);
        LocalTime time=LocalTime.parse(start);
        if(time.isBefore(LocalTime.of(8,30))||time.toSecondOfDay()+duration*60>73800) throw new IllegalArgumentException("Appointment must fit 08:30-20:30.");
        String end=time.plusMinutes(duration).toString();
        List<Staff> techs=freeTechnicians(service,date,start,end,staff,appointment);
        List<AvailableBed> freeBeds=beds(service,date,start,end,appointment);
        if(techs.isEmpty()||freeBeds.isEmpty()) throw new WorkflowException(409,"No qualified technician, bed or equipment is available for this time.");
        int selectedStaff=techs.get(0).getStaffId();
        int selectedBed=bed==null?freeBeds.get(0).getBedId():bed;
        return w.transaction(()->{
            List<Integer> result=w.call(rs -> rs.getInt("appointment_id"), "usp_SaveAppointment",w.actor,customer,service,java.sql.Date.valueOf(date),Time.valueOf(time),selectedStaff,selectedBed,pkg,appointment);
            if (result.isEmpty()) throw new SQLException("Appointment procedure returned no identifier.");
            int id=result.get(0);
            if(notes!=null) w.update("UPDATE Appointment SET notes=? WHERE appointment_id=?",notes,id);
            Appointment row=w.one(ModelRows::appointment, "SELECT appointment_id,customer_id,service_id,customer_package_id,room_id,bed_id,appointment_date,start_time,end_time,status,notes FROM Appointment WHERE appointment_id=?",id);
            row.setTechnicianId(selectedStaff);row.setTechnicianName(techs.get(0).getFullName());return row;
        });
    }
}
