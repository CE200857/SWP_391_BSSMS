package bssms_booking;

/** Typed data exchanged by DAO and controller; nullable fields represent absent SQL values. */
public class CoordinationResources implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private Appointment appointment;
    private java.util.List<bssms_account.Staff> assignedStaff;
    private java.util.List<AssignedEquipment> assignedEquipments;
    private java.util.List<bssms_account.Staff> technicians;
    private java.util.List<RoomWithBeds> roomsWithBeds;
    private java.util.List<bssms_catalog.Equipment> equipments;

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    public java.util.List<bssms_account.Staff> getAssignedStaff() { return assignedStaff; }
    public void setAssignedStaff(java.util.List<bssms_account.Staff> assignedStaff) { this.assignedStaff = assignedStaff; }

    public java.util.List<AssignedEquipment> getAssignedEquipments() { return assignedEquipments; }
    public void setAssignedEquipments(java.util.List<AssignedEquipment> assignedEquipments) { this.assignedEquipments = assignedEquipments; }

    public java.util.List<bssms_account.Staff> getTechnicians() { return technicians; }
    public void setTechnicians(java.util.List<bssms_account.Staff> technicians) { this.technicians = technicians; }

    public java.util.List<RoomWithBeds> getRoomsWithBeds() { return roomsWithBeds; }
    public void setRoomsWithBeds(java.util.List<RoomWithBeds> roomsWithBeds) { this.roomsWithBeds = roomsWithBeds; }

    public java.util.List<bssms_catalog.Equipment> getEquipments() { return equipments; }
    public void setEquipments(java.util.List<bssms_catalog.Equipment> equipments) { this.equipments = equipments; }
}
