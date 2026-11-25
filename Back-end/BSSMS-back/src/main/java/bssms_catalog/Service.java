package bssms_catalog;

import java.util.List;

public class Service {
    private int serviceId;
    private String serviceName;
    private String description;
    private String category;
    private String requiredRoomType;
    private double price;
    private int duration;
    private Double tourCount;
    private String status;

    private List<Integer> technicianIds;
    private String imageUrl;

    public Service() {
    }

    public Service(int serviceId, String serviceName, String description,
                   double price, int duration, String status) {
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.description = description;
        this.price = price;
        this.duration = duration;
        this.status = status;
    }

    public int getServiceId() {
        return serviceId;
    }

    public void setServiceId(int serviceId) {
        this.serviceId = serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getRequiredRoomType() {
        return requiredRoomType;
    }

    public void setRequiredRoomType(String requiredRoomType) {
        this.requiredRoomType = requiredRoomType;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public int getDuration() {
        return duration;
    }

    public void setDuration(int duration) {
        this.duration = duration;
    }

    public Double getTourCount() {
        return tourCount;
    }

    public void setTourCount(Double tourCount) {
        this.tourCount = tourCount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<Integer> getTechnicianIds() {
        return technicianIds;
    }

    public void setTechnicianIds(List<Integer> technicianIds) {
        this.technicianIds = technicianIds;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
