package bssms_catalog;

public class TreatmentPackage {
    private Integer validityDays;
    private String status;
    public Integer getValidityDays(){return validityDays;}
    public void setValidityDays(Integer value){validityDays=value;}
    public String getStatus(){return status;}
    public void setStatus(String value){status=value;}
    private int treatmentPackageId;
    private java.util.List<Integer> serviceIds;
    private java.util.List<java.util.Map<String, Object>> services;
    private int customerCount;
    private String packageName;
    private String description;
    private double price;
    private int numberOfSessions;

    public TreatmentPackage() {}

    public TreatmentPackage(int treatmentPackageId, String packageName, String description, double price, int numberOfSessions) {
        this.treatmentPackageId = treatmentPackageId;
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

    public java.util.List<Integer> getServiceIds() { return serviceIds; }
    public void setServiceIds(java.util.List<Integer> serviceIds) { this.serviceIds = serviceIds; }
    public java.util.List<java.util.Map<String, Object>> getServices() { return services; }
    public void setServices(java.util.List<java.util.Map<String, Object>> services) { this.services = services; }
    public int getCustomerCount() { return customerCount; }
    public void setCustomerCount(int customerCount) { this.customerCount = customerCount; }

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
