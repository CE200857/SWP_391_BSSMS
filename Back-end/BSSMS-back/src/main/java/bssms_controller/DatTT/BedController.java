package bssms_controller.DatTT;
import bssms_catalog.Bed;
import bssms_persistence.DatTT.BedDAO;
import java.sql.SQLException;
import java.util.*;

public class BedController {
    private final BedDAO dao;
    public BedController(BedDAO dao) { this.dao = dao; }
    public List<Bed> getAllBeds() throws SQLException { return dao.getAllBeds(); }
    public void create(Map<String, Object> user, Bed value) throws SQLException {
        Validation.role(user, "Manager");
        validate(value);
        if (!dao.addBed(value)) throw new SQLException("Insert affected no rows");
    }
    public void update(Map<String, Object> user, Bed value) throws SQLException {
        Validation.role(user, "Manager");
        validate(value);
        Validation.id(value.getBedId(), "id");
        Validation.found(dao.updateBed(value));
    }
    public void delete(Map<String, Object> user, int id) throws SQLException {
        Validation.role(user, "Manager");
        Validation.id(id, "id");
        Validation.found(dao.deleteBed(id));
    }
    private void validate(Bed value) {
        Validation.body(value);
        Validation.id(value.getRoomId(), "roomId");
        value.setBedNumber(Validation.text(value.getBedNumber(), "bedNumber"));
        if (value.getStatus() == null) value.setStatus("Available");
        Validation.status(value.getStatus(), "Available", "Occupied", "In Use", "Maintenance");
    }
}
