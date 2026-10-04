/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_catalog;

/**
 *
 * @author admin
 */
public class StaffService {
    private int staffId;
    private int serviceId;

    public StaffService() {}

    public StaffService(int staffId, int serviceId) {
        this.staffId = staffId;
        this.serviceId = serviceId;
    }

    public int getStaffId() {
        return staffId;
    }

    public void setStaffId(int staffId) {
        this.staffId = staffId;
    }

    public int getServiceId() {
        return serviceId;
    }

    public void setServiceId(int serviceId) {
        this.serviceId = serviceId;
    }
    
}
