package bssms_booking;

/** Typed data exchanged by DAO and controller; nullable fields represent absent SQL values. */
public class SlotAvailability implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private Integer serviceId;
    private String serviceName;
    private Integer duration;
    private String appointmentDate;
    private java.util.List<bssms_account.Staff> technicians;
    private java.util.List<TimeSlot> slots;

    public Integer getServiceId() { return serviceId; }
    public void setServiceId(Integer serviceId) { this.serviceId = serviceId; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }

    public String getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(String appointmentDate) { this.appointmentDate = appointmentDate; }

    public java.util.List<bssms_account.Staff> getTechnicians() { return technicians; }
    public void setTechnicians(java.util.List<bssms_account.Staff> technicians) { this.technicians = technicians; }

    public java.util.List<TimeSlot> getSlots() { return slots; }
    public void setSlots(java.util.List<TimeSlot> slots) { this.slots = slots; }
}
