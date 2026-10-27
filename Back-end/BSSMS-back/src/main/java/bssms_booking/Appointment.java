package bssms_booking;

/** Typed data exchanged by DAO and controller; nullable fields represent absent SQL values. */
public class Appointment implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private Integer appointmentId;
    private Integer customerId;
    private Integer serviceId;
    private Integer customerPackageId;
    private Integer roomId;
    private Integer bedId;
    private String appointmentDate;
    private String startTime;
    private String endTime;
    private String status;
    private String notes;
    private String createdAt;
    private String updatedAt;
    private String completedAt;
    private String cancellationReason;
    private Integer createdBy;
    private String phoneOverride;
    private String resultNotes;
    private String customerName;
    private String customerPhone;
    private String phone;
    private String serviceName;
    private java.math.BigDecimal servicePrice;
    private String staffName;
    private Integer staffId;
    private String roomName;
    private String bedNumber;
    private Integer duration;
    private Integer technicianId;
    private String technicianName;

    public Integer getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Integer appointmentId) { this.appointmentId = appointmentId; }

    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }

    public Integer getServiceId() { return serviceId; }
    public void setServiceId(Integer serviceId) { this.serviceId = serviceId; }

    public Integer getCustomerPackageId() { return customerPackageId; }
    public void setCustomerPackageId(Integer customerPackageId) { this.customerPackageId = customerPackageId; }

    public Integer getRoomId() { return roomId; }
    public void setRoomId(Integer roomId) { this.roomId = roomId; }

    public Integer getBedId() { return bedId; }
    public void setBedId(Integer bedId) { this.bedId = bedId; }

    public String getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(String appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public Integer getCreatedBy() { return createdBy; }
    public void setCreatedBy(Integer createdBy) { this.createdBy = createdBy; }

    public String getPhoneOverride() { return phoneOverride; }
    public void setPhoneOverride(String phoneOverride) { this.phoneOverride = phoneOverride; }

    public String getResultNotes() { return resultNotes; }
    public void setResultNotes(String resultNotes) { this.resultNotes = resultNotes; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public java.math.BigDecimal getServicePrice() { return servicePrice; }
    public void setServicePrice(java.math.BigDecimal servicePrice) { this.servicePrice = servicePrice; }

    public String getStaffName() { return staffName; }
    public void setStaffName(String staffName) { this.staffName = staffName; }

    public Integer getStaffId() { return staffId; }
    public void setStaffId(Integer staffId) { this.staffId = staffId; }

    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public String getBedNumber() { return bedNumber; }
    public void setBedNumber(String bedNumber) { this.bedNumber = bedNumber; }

    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }

    public Integer getTechnicianId() { return technicianId; }
    public void setTechnicianId(Integer technicianId) { this.technicianId = technicianId; }

    public String getTechnicianName() { return technicianName; }
    public void setTechnicianName(String technicianName) { this.technicianName = technicianName; }
    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String value) { completedAt = value; }
    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String value) { cancellationReason = value; }
}
