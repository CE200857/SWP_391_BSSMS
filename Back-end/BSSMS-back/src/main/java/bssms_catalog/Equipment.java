/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_catalog;

/**
 *
 * @author admin
 */
public class Equipment {
    private int equipmentId;
    private String equipmentName;
    private String description;
    private String status;

    public Equipment() {}

    public Equipment(int equipmentId, String equipmentName, String description, String status) {
        this.equipmentId = equipmentId;
        this.equipmentName = equipmentName;
        this.description = description;
        this.status = status;
    }

    public int getEquipmentId() {
        return equipmentId;
    }

    public void setEquipmentId(int equipmentId) {
        this.equipmentId = equipmentId;
    }

    public String getEquipmentName() {
        return equipmentName;
    }

    public void setEquipmentName(String equipmentName) {
        this.equipmentName = equipmentName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
    
}
