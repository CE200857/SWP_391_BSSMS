/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_common.model;
import java.util.Date;
import java.sql.Time;
/**
 *
 * @author admin
 */
public class Appointment {
    private int appointmentId;
    private int customerId;
    private int serviceId;
    private Integer customerPackageId; // Dùng Integer để cho phép null
    private Integer roomId;
    private Integer bedId;
    private Date appointmentDate;
    private Time startTime;
    private Time endTime;
    private String status;
    private String notes;

    public Appointment() {}

    public Appointment(int appointmentId, int customerId, int serviceId, Integer customerPackageId, Integer roomId, Integer bedId, Date appointmentDate, Time startTime, Time endTime, String status, String notes) {
        this.appointmentId = appointmentId;
        this.customerId = customerId;
        this.serviceId = serviceId;
        this.customerPackageId = customerPackageId;
        this.roomId = roomId;
        this.bedId = bedId;
        this.appointmentDate = appointmentDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.notes = notes;
    }

    public int getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(int appointmentId) {
        this.appointmentId = appointmentId;
    }

    public int getCustomerId() {
        return customerId;
    }

    public void setCustomerId(int customerId) {
        this.customerId = customerId;
    }

    public int getServiceId() {
        return serviceId;
    }

    public void setServiceId(int serviceId) {
        this.serviceId = serviceId;
    }

    public Integer getCustomerPackageId() {
        return customerPackageId;
    }

    public void setCustomerPackageId(Integer customerPackageId) {
        this.customerPackageId = customerPackageId;
    }

    public Integer getRoomId() {
        return roomId;
    }

    public void setRoomId(Integer roomId) {
        this.roomId = roomId;
    }

    public Integer getBedId() {
        return bedId;
    }

    public void setBedId(Integer bedId) {
        this.bedId = bedId;
    }

    public Date getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(Date appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public Time getStartTime() {
        return startTime;
    }

    public void setStartTime(Time startTime) {
        this.startTime = startTime;
    }

    public Time getEndTime() {
        return endTime;
    }

    public void setEndTime(Time endTime) {
        this.endTime = endTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
    
}
