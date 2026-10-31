package bssms_controller.DatTT;
import java.util.List;

/** Transport-neutral data read from the JSON body; null means a field was absent. */
public class BookingRequest {
    public Integer serviceId;
    public Integer customerPackageId;
    public String appointmentDate;
    public String startTime;
    public Integer technicianId;
    public String notes;
    public Integer appointmentId;
    public String status;
    public Integer roomId;
    public Integer bedId;
    public List<Integer> equipmentIds;
}
