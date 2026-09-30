/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_common.model;

/**
 *
 * @author admin
 */
public class TreatmentPackage {
    private int treatmentPackageId;
    private int serviceId;
    private String packageName;
    private String description;
    private double price;
    private int numberOfSessions;

    public TreatmentPackage() {}

    public TreatmentPackage(int treatmentPackageId, int serviceId, String packageName, String description, double price, int numberOfSessions) {
        this.treatmentPackageId = treatmentPackageId;
        this.serviceId = serviceId;
        this.packageName = packageName;
        this.description = description;
        this.price = price;
        this.numberOfSessions = numberOfSessions;
    }

    public int getTreatmentPackageId() {
        return treatmentPackageId;
    }

    public void setTreatmentPackageId(int treatmentPackageId) {
        this.treatmentPackageId = treatmentPackageId;
    }

    public int getServiceId() {
        return serviceId;
    }

    public void setServiceId(int serviceId) {
        this.serviceId = serviceId;
    }

    public String getPackageName() {
        return packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public int getNumberOfSessions() {
        return numberOfSessions;
    }

    public void setNumberOfSessions(int numberOfSessions) {
        this.numberOfSessions = numberOfSessions;
    }
    
}
