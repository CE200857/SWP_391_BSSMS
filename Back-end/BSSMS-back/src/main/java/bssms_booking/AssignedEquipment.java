package bssms_booking;

/** Typed data exchanged by DAO and controller; nullable fields represent absent SQL values. */
public class AssignedEquipment implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private Integer equipmentId;
    private String equipmentName;
    private Integer quantity;

    public Integer getEquipmentId() { return equipmentId; }
    public void setEquipmentId(Integer equipmentId) { this.equipmentId = equipmentId; }

    public String getEquipmentName() { return equipmentName; }
    public void setEquipmentName(String equipmentName) { this.equipmentName = equipmentName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
