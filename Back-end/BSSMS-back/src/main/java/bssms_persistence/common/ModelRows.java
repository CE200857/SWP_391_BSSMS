package bssms_persistence.common;
import java.sql.*;
import bssms_account.*;
import bssms_booking.*;

public final class ModelRows {
    private ModelRows() {}
    private static String text(Object value) { return value == null ? null : value.toString(); }
    public static Staff staff(ResultSet rs) throws SQLException {
        Staff value = new Staff();
        ResultSetMetaData md = rs.getMetaData();
        for (int i=1; i<=md.getColumnCount(); i++) {
            switch (md.getColumnLabel(i).toLowerCase(java.util.Locale.ROOT)) {
                case "staff_id": value.setStaffId((Integer) rs.getObject(i, Integer.class)); break;
                case "account_id": value.setAccountId((Integer) rs.getObject(i, Integer.class)); break;
                case "username": value.setUsername(rs.getString(i)); break;
                case "full_name": value.setFullName(rs.getString(i)); break;
                case "phone": value.setPhone(rs.getString(i)); break;
                case "email": value.setEmail(rs.getString(i)); break;
                case "position": value.setPosition(rs.getString(i)); break;
                case "role": value.setRole(rs.getString(i)); break;
                case "salary": value.setSalary(rs.getBigDecimal(i)); break;
                case "hire_date": value.setHireDate(rs.getString(i)); break;
                case "status": value.setStatus(rs.getString(i)); break;
                case "has_skill": value.setHasSkill((Boolean) rs.getObject(i, Boolean.class)); break;
                case "is_free": value.setIsFree((Boolean) rs.getObject(i, Boolean.class)); break;
                case "is_suggested": value.setIsSuggested((Boolean) rs.getObject(i, Boolean.class)); break;
                default: break;
            }
        }
        return value;
    }
    public static Appointment appointment(ResultSet rs) throws SQLException {
        Appointment value = new Appointment();
        ResultSetMetaData md = rs.getMetaData();
        for (int i=1; i<=md.getColumnCount(); i++) {
            switch (md.getColumnLabel(i).toLowerCase(java.util.Locale.ROOT)) {
                case "appointment_id": value.setAppointmentId((Integer) rs.getObject(i, Integer.class)); break;
                case "customer_id": value.setCustomerId((Integer) rs.getObject(i, Integer.class)); break;
                case "service_id": value.setServiceId((Integer) rs.getObject(i, Integer.class)); break;
                case "customer_package_id": value.setCustomerPackageId((Integer) rs.getObject(i, Integer.class)); break;
                case "room_id": value.setRoomId((Integer) rs.getObject(i, Integer.class)); break;
                case "bed_id": value.setBedId((Integer) rs.getObject(i, Integer.class)); break;
                case "appointment_date": value.setAppointmentDate(text(rs.getObject(i))); break;
                case "start_time": value.setStartTime(text(rs.getObject(i))); break;
                case "end_time": value.setEndTime(text(rs.getObject(i))); break;
                case "status": value.setStatus(rs.getString(i)); break;
                case "notes": value.setNotes(rs.getString(i)); break;
                case "created_at": value.setCreatedAt(text(rs.getObject(i))); break;
                case "completed_at": value.setCompletedAt(text(rs.getObject(i))); break;
                case "cancellation_reason": value.setCancellationReason(rs.getString(i)); break;
                case "updated_at": value.setUpdatedAt(text(rs.getObject(i))); break;
                case "created_by_staff_id": {
                    Integer id=rs.getObject(i,Integer.class);
                    if(id!=null) value.setCreatedBy(bssms_common.LoginIdentity.staff(id)); break;
                }
                case "created_by_customer_id": {
                    Integer id=rs.getObject(i,Integer.class);
                    if(id!=null) value.setCreatedBy(bssms_common.LoginIdentity.customer(id)); break;
                }
                case "created_by": value.setCreatedBy((Integer) rs.getObject(i, Integer.class)); break;
                case "phone_override": value.setPhoneOverride(rs.getString(i)); break;
                case "result_notes": value.setResultNotes(rs.getString(i)); break;
                case "customer_name": value.setCustomerName(rs.getString(i)); break;
                case "customer_phone": value.setCustomerPhone(rs.getString(i)); break;
                case "phone": value.setPhone(rs.getString(i)); break;
                case "service_name": value.setServiceName(rs.getString(i)); break;
                case "service_price": value.setServicePrice(rs.getBigDecimal(i)); break;
                case "staff_name": value.setStaffName(rs.getString(i)); break;
                case "staff_id": value.setStaffId((Integer) rs.getObject(i, Integer.class)); break;
                case "room_name": value.setRoomName(rs.getString(i)); break;
                case "bed_number": value.setBedNumber(rs.getString(i)); break;
                case "duration": value.setDuration((Integer) rs.getObject(i, Integer.class)); break;
                case "technician_id": value.setTechnicianId((Integer) rs.getObject(i, Integer.class)); break;
                case "technician_name": value.setTechnicianName(rs.getString(i)); break;
                default: break;
            }
        }
        return value;
    }
    public static SlotAvailability slotAvailability(ResultSet rs) throws SQLException {
        SlotAvailability value = new SlotAvailability();
        ResultSetMetaData md = rs.getMetaData();
        for (int i=1; i<=md.getColumnCount(); i++) {
            switch (md.getColumnLabel(i).toLowerCase(java.util.Locale.ROOT)) {
                case "service_id": value.setServiceId((Integer) rs.getObject(i, Integer.class)); break;
                case "service_name": value.setServiceName(rs.getString(i)); break;
                case "duration": value.setDuration((Integer) rs.getObject(i, Integer.class)); break;
                case "appointment_date": value.setAppointmentDate(text(rs.getObject(i))); break;
                default: break;
            }
        }
        return value;
    }
    public static AvailableBed availableBed(ResultSet rs) throws SQLException {
        AvailableBed value = new AvailableBed();
        ResultSetMetaData md = rs.getMetaData();
        for (int i=1; i<=md.getColumnCount(); i++) {
            switch (md.getColumnLabel(i).toLowerCase(java.util.Locale.ROOT)) {
                case "bed_id": value.setBedId((Integer) rs.getObject(i, Integer.class)); break;
                case "room_id": value.setRoomId((Integer) rs.getObject(i, Integer.class)); break;
                case "bed_number": value.setBedNumber(rs.getString(i)); break;
                case "status": value.setStatus(rs.getString(i)); break;
                default: break;
            }
        }
        return value;
    }
}
