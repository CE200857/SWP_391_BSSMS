package bssms_controller.DatTT;
import java.util.List;

public class BookingRequest {
    public static class Line {
        public Integer serviceId;
        public Integer customerPackageId;
    }
    public static class Assignment {
        public Integer appointmentServiceId;
        public Integer technicianId;
        public Integer bedId;
    }
    public List<Line> services;
    public Integer serviceId;
    public Integer customerPackageId;
    public String appointmentDate;
    public String startTime;
    public Integer technicianId;
    public String paymentChoice;
    public String notes;
    public Integer appointmentId;
    public List<Assignment> assignments;
}
