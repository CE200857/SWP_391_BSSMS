package bssms_catalog;

public class Room {
    private int roomId;
    private String roomName;
    private String roomType;
    private String status = "Active";
    private int bedCount;
    private int activeBedCount;
    public int getBedCount() { return bedCount; }
    public void setBedCount(int v) { bedCount = v; }
    public int getActiveBedCount() { return activeBedCount; }
    public void setActiveBedCount(int v) { activeBedCount = v; }

    public Room() {}

    public Room(int roomId, String roomName, String roomType, String status) {
        this.roomId = roomId;
        this.roomName = roomName;
        this.roomType = roomType;
        this.status = status;
    }

    public int getRoomId() {
        return roomId;
    }

    public void setRoomId(int roomId) {
        this.roomId = roomId;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public String getRoomType() {
        return roomType;
    }

    public void setRoomType(String roomType) {
        this.roomType = roomType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
    
}
