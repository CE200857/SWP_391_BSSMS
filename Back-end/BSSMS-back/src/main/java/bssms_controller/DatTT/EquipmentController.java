package bssms_controller.DatTT;
import bssms_account.Account;
import bssms_catalog.Equipment;
import bssms_persistence.DatTT.EquipmentDAO;
import java.sql.SQLException;
import java.util.*;

public class EquipmentController {
    private final EquipmentDAO dao;
    public EquipmentController(EquipmentDAO dao) { this.dao = dao; }
    public List<Equipment> getAllEquipments() throws SQLException { return dao.getAllEquipments(); }
    public void create(Account user, Equipment value) throws SQLException {
        Validation.role(user, "Manager");
        validate(value);
        if (!dao.addEquipment(value)) throw new SQLException("Insert affected no rows");
    }
    public void update(Account user, Equipment value) throws SQLException {
        Validation.role(user, "Manager");
        validate(value);
        Validation.id(value.getEquipmentId(), "id");
        Validation.found(dao.updateEquipment(value));
    }
    public void delete(Account user, int id) throws SQLException {
        Validation.role(user, "Manager");
        Validation.id(id, "id");
        Validation.found(dao.deleteEquipment(id));
    }
    private void validate(Equipment value) {
        Validation.body(value);
        value.setEquipmentName(Validation.text(value.getEquipmentName(), "equipmentName"));
        if (value.getStatus() == null) value.setStatus("Active");
        Validation.status(value.getStatus(), "Active", "Maintenance");
    }
}
