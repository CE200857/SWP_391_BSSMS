package bssms_booking;

/** Typed data exchanged by DAO and controller; nullable fields represent absent SQL values. */
public class ActivePackage implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private Integer customerPackageId;
    private Integer treatmentPackageId;
    private Integer remainingSessions;
    private java.sql.Date expiryDate;
    private String packageName;
    private Integer serviceId;
    private String serviceName;
    private Integer duration;

    public Integer getCustomerPackageId() { return customerPackageId; }
    public void setCustomerPackageId(Integer customerPackageId) { this.customerPackageId = customerPackageId; }

    public Integer getTreatmentPackageId() { return treatmentPackageId; }
    public void setTreatmentPackageId(Integer treatmentPackageId) { this.treatmentPackageId = treatmentPackageId; }

    public Integer getRemainingSessions() { return remainingSessions; }
    public void setRemainingSessions(Integer remainingSessions) { this.remainingSessions = remainingSessions; }

    public java.sql.Date getExpiryDate() { return expiryDate; }
    public void setExpiryDate(java.sql.Date expiryDate) { this.expiryDate = expiryDate; }

    public String getPackageName() { return packageName; }
    public void setPackageName(String packageName) { this.packageName = packageName; }

    public Integer getServiceId() { return serviceId; }
    public void setServiceId(Integer serviceId) { this.serviceId = serviceId; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
}
