package bssms_booking;

/** Typed data exchanged by DAO and controller; nullable fields represent absent SQL values. */
public class TimeSlot implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private String startTime;
    private String endTime;
    private Boolean available;
    private java.util.List<bssms_account.Staff> availableTechnicians;
    private Integer availableTechnicianCount;
    private Integer freeBeds;
    private Long freeRooms;

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public Boolean getAvailable() { return available; }
    public void setAvailable(Boolean available) { this.available = available; }

    public java.util.List<bssms_account.Staff> getAvailableTechnicians() { return availableTechnicians; }
    public void setAvailableTechnicians(java.util.List<bssms_account.Staff> availableTechnicians) { this.availableTechnicians = availableTechnicians; }

    public Integer getAvailableTechnicianCount() { return availableTechnicianCount; }
    public void setAvailableTechnicianCount(Integer availableTechnicianCount) { this.availableTechnicianCount = availableTechnicianCount; }

    public Integer getFreeBeds() { return freeBeds; }
    public void setFreeBeds(Integer freeBeds) { this.freeBeds = freeBeds; }

    public Long getFreeRooms() { return freeRooms; }
    public void setFreeRooms(Long freeRooms) { this.freeRooms = freeRooms; }
}
