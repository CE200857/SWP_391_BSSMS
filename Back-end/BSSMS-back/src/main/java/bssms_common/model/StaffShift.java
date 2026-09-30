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
public class StaffShift {
    private int staffShiftId;
    private int staffId;
    private Date shiftDate;
    private Time startTime;
    private Time endTime;

    public StaffShift() {}

    public StaffShift(int staffShiftId, int staffId, Date shiftDate, Time startTime, Time endTime) {
        this.staffShiftId = staffShiftId;
        this.staffId = staffId;
        this.shiftDate = shiftDate;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public int getStaffShiftId() {
        return staffShiftId;
    }

    public void setStaffShiftId(int staffShiftId) {
        this.staffShiftId = staffShiftId;
    }

    public int getStaffId() {
        return staffId;
    }

    public void setStaffId(int staffId) {
        this.staffId = staffId;
    }

    public Date getShiftDate() {
        return shiftDate;
    }

    public void setShiftDate(Date shiftDate) {
        this.shiftDate = shiftDate;
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
    
}
