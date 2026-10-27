package bssms_booking;

/** Typed data exchanged by DAO and controller; nullable fields represent absent SQL values. */
public class RoomWithBeds implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private Integer roomId;
    private String roomName;
    private String roomType;
    private String status;
    private java.util.List<AvailableBed> beds;

    public Integer getRoomId() { return roomId; }
    public void setRoomId(Integer roomId) { this.roomId = roomId; }

    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public String getRoomType() { return roomType; }
    public void setRoomType(String roomType) { this.roomType = roomType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public java.util.List<AvailableBed> getBeds() { return beds; }
    public void setBeds(java.util.List<AvailableBed> beds) { this.beds = beds; }
}
