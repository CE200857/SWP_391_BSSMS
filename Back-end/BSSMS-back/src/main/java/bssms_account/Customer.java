/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_account;
import java.util.Date;
/**
 *
 * @author admin
 */
public class Customer {
    private int customerId;
    private int accountId; 
    private String fullName;
    private String phone;
    private String gender;
    private Date dob; 
    private String address;
    private int membershipTierId; 

    public Customer() {
    }

    public Customer(int customerId, int accountId, String fullName, String phone, String gender, Date dob, String address, int membershipTierId) {
        this.customerId = customerId;
        this.accountId = accountId;
        this.fullName = fullName;
        this.phone = phone;
        this.gender = gender;
        this.dob = dob;
        this.address = address;
        this.membershipTierId = membershipTierId;
    }

    public int getCustomerId() {
        return customerId;
    }

    public void setCustomerId(int customerId) {
        this.customerId = customerId;
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

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public Date getDob() {
        return dob;
    }

    public void setDob(Date dob) {
        this.dob = dob;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public int getMembershipTierId() {
        return membershipTierId;
    }

    public void setMembershipTierId(int membershipTierId) {
        this.membershipTierId = membershipTierId;
    }

    
}
