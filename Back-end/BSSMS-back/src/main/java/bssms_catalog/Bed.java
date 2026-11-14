package bssms_catalog;

public class Bed {
    private int bedId;
    private int roomId;
    private String bedNumber;
    private String status;
    private String useState;
    private String roomName;
    private String roomType;
    public String getUseState() { return useState; }
    public void setUseState(String v) { useState = v; }
    public String getRoomName() { return roomName; }
    public void setRoomName(String v) { roomName = v; }
    public String getRoomType() { return roomType; }
    public void setRoomType(String v) { roomType = v; }

    public Bed() {}

    public Bed(int bedId, int roomId, String bedNumber, String status) {
        this.bedId = bedId;
        this.roomId = roomId;
        this.bedNumber = bedNumber;
        this.status = status;
    }

    public int getBedId() {
        return bedId;
    }

    public void setBedId(int bedId) {
        this.bedId = bedId;
    }

    public int getRoomId() {
        return roomId;
    }

    public void setRoomId(int roomId) {
        this.roomId = roomId;
    }

    public String getBedNumber() {
        return bedNumber;
    }

    public void setBedNumber(String bedNumber) {
        this.bedNumber = bedNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
    
}
