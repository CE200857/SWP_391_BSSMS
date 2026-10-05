/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_booking;

/**
 *
 * @author admin
 */
public class AppointmentStaff {
    private int appointmentId;
    private int staffId;
    private String role;

    public AppointmentStaff() {}

    public AppointmentStaff(int appointmentId, int staffId, String role) {
        this.appointmentId = appointmentId;
        this.staffId = staffId;
        this.role = role;
    }

    public int getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(int appointmentId) {
        this.appointmentId = appointmentId;
    }

    public int getStaffId() {
        return staffId;
    }

    public void setStaffId(int staffId) {
        this.staffId = staffId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
    
}
