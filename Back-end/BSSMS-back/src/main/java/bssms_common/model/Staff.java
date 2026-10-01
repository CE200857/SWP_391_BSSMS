/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_common.model;
import java.util.Date;
/**
 *
 * @author admin
 */
public class Staff {
    private int staffId;
    private int accountId; // Khóa ngoại liên kết với bảng Account
    private String fullName;
    private String phone;
    private String position; // Vị trí: Technician, Receptionist...
    private double salary;
    private Date hireDate; // Ngày vào làm

    public Staff() {
    }

    public Staff(int staffId, int accountId, String fullName, String phone, String gender, String position, double salary, Date hireDate) {
        this.staffId = staffId;
        this.accountId = accountId;
        this.fullName = fullName;
        this.phone = phone;
        this.position = position;
        this.salary = salary;
        this.hireDate = hireDate;
    }

    public int getStaffId() {
        return staffId;
    }

    public void setStaffId(int staffId) {
        this.staffId = staffId;
    }

    public int getAccountId() {
        return accountId;
    }

    public void setAccountId(int accountId) {
        this.accountId = accountId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public double getSalary() {
        return salary;
    }

    public void setSalary(double salary) {
        this.salary = salary;
    }

    public Date getHireDate() {
        return hireDate;
    }

    public void setHireDate(Date hireDate) {
        this.hireDate = hireDate;
    }
}
