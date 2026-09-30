/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_common.model;

/**
 *
 * @author admin
 */
public class AppointmentEquipment {
    private int appointmentId;
    private int equipmentId;
    private int quantity;

    public AppointmentEquipment() {}

    public AppointmentEquipment(int appointmentId, int equipmentId, int quantity) {
        this.appointmentId = appointmentId;
        this.equipmentId = equipmentId;
        this.quantity = quantity;
    }

    public int getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(int appointmentId) {
        this.appointmentId = appointmentId;
    }

    public int getEquipmentId() {
        return equipmentId;
    }

    public void setEquipmentId(int equipmentId) {
        this.equipmentId = equipmentId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
    
}
