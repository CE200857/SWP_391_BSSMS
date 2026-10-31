package bssms_controller.DatTT;
import bssms_catalog.TreatmentPackage;
import bssms_persistence.DatTT.TreatmentPackageDAO;
import java.sql.SQLException;
import java.util.*;

public class TreatmentPackageController {
    private final TreatmentPackageDAO dao;
    public TreatmentPackageController(TreatmentPackageDAO dao) { this.dao = dao; }
    public List<TreatmentPackage> getAllTreatmentPackages() throws SQLException { return dao.getAllTreatmentPackages(); }
    public void create(TreatmentPackage value) throws SQLException {
        
        validate(value);
        if (!dao.createTreatmentPackage(value)) throw new SQLException("Insert affected no rows");
    }
    public void update(TreatmentPackage value) throws SQLException {
        
        validate(value);
        Validation.id(value.getTreatmentPackageId(), "id");
        Validation.found(dao.updateTreatmentPackage(value));
    }
    public void delete(int id) throws SQLException {
        
        Validation.id(id, "id");
        Validation.found(dao.deleteTreatmentPackage(id));
    }
    private void validate(TreatmentPackage value) {
        Validation.body(value);
        Validation.id(value.getServiceId(), "serviceId");
        value.setPackageName(Validation.text(value.getPackageName(), "packageName"));
        Validation.price(value.getPrice());
        Validation.id(value.getNumberOfSessions(), "numberOfSessions");
    }
}
