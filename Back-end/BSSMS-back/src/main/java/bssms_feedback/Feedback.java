package bssms_feedback;
import java.util.Date;
public class Feedback {
    private int feedbackId;
    private int customerId;
    private int appointmentId;
    private int serviceId;
    private int appointmentServiceId;
    private int rating;
    private String comment;
    private Date createdAt;

    public Feedback() {}

    public int getAppointmentServiceId() { return appointmentServiceId; }
    public void setAppointmentServiceId(int appointmentServiceId) { this.appointmentServiceId = appointmentServiceId; }

    public Feedback(int feedbackId, int customerId, int appointmentId, int serviceId, int rating, String comment, Date createdAt) {
        this(feedbackId, customerId, appointmentId, rating, comment, createdAt);
        this.serviceId = serviceId;
    }

    public int getServiceId() { return serviceId; }

    public void setServiceId(int serviceId) { this.serviceId = serviceId; }

    public Feedback(int feedbackId, int customerId, int appointmentId, int rating, String comment, Date createdAt) {
        this.feedbackId = feedbackId;
        this.customerId = customerId;
        this.appointmentId = appointmentId;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    public int getFeedbackId() {
        return feedbackId;
    }

    public void setFeedbackId(int feedbackId) {
        this.feedbackId = feedbackId;
    }

    public int getCustomerId() {
        return customerId;
    }

    public void setCustomerId(int customerId) {
        this.customerId = customerId;
    }

    public int getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(int appointmentId) {
        this.appointmentId = appointmentId;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
    
}
