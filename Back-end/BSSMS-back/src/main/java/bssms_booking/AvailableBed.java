package bssms_booking;

/** Typed data exchanged by DAO and controller; nullable fields represent absent SQL values. */
public class AvailableBed implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private Integer bedId;
    private Integer roomId;
    private String bedNumber;
    private String status;

    public Integer getBedId() { return bedId; }
    public void setBedId(Integer bedId) { this.bedId = bedId; }

    public Integer getRoomId() { return roomId; }
    public void setRoomId(Integer roomId) { this.roomId = roomId; }

    public String getBedNumber() { return bedNumber; }
    public void setBedNumber(String bedNumber) { this.bedNumber = bedNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
