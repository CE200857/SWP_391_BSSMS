/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_catalog;

/**
 *
 * @author admin
 */
public class Bed {
    private int bedId;
    private int roomId;
    private String bedNumber;
    private String status;

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
