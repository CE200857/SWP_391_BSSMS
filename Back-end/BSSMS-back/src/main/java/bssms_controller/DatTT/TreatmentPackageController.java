package bssms_controller.DatTT;
import bssms_catalog.TreatmentPackage;
import bssms_persistence.DatTT.TreatmentPackageDAO;
import java.sql.SQLException;
import java.util.*;

public class TreatmentPackageController {
    private final TreatmentPackageDAO dao;
    public TreatmentPackageController(TreatmentPackageDAO dao) { this.dao = dao; }
    public List<TreatmentPackage> getAllTreatmentPackages(boolean activeOnly) throws SQLException { return dao.getAllTreatmentPackages(activeOnly); }
    public void create(TreatmentPackage value) throws SQLException {
        validate(value, 0);
        if (!dao.createTreatmentPackage(value)) throw new SQLException("Insert affected no rows");
    }
    public void update(TreatmentPackage value) throws SQLException {
        Validation.body(value);
        Validation.id(value.getTreatmentPackageId(), "id");
        validate(value, value.getTreatmentPackageId());
        Validation.found(dao.updateTreatmentPackage(value));
    }
    public void delete(int id) throws SQLException {
        Validation.id(id, "id");
        Validation.found(dao.deleteTreatmentPackage(id));
    }
    private void validate(TreatmentPackage value, int id) throws SQLException {
        Validation.body(value);
        value.setPackageName(Validation.text(value.getPackageName(), "packageName"));
        if (value.getPackageName().length() > 150) throw new IllegalArgumentException("Package name can be at most 150 characters.");
        if (dao.nameExists(value.getPackageName(), id)) throw new IllegalArgumentException("The treatment package name already exists.");
        if (value.getServiceIds() == null || value.getServiceIds().isEmpty())
            throw new IllegalArgumentException("A treatment package must include at least one service.");
        for (Integer s : value.getServiceIds()) if (s == null || s <= 0) throw new IllegalArgumentException("Invalid service.");
        if (!dao.servicesActive(value.getServiceIds())) throw new IllegalArgumentException("Some services do not exist or are no longer active.");
        if (value.getPrice() <= 0) throw new IllegalArgumentException("The package price must be greater than 0.");
        if (value.getNumberOfSessions() < 1 || value.getNumberOfSessions() > 100) throw new IllegalArgumentException("Sessions must be between 1 and 100.");
        if (value.getValidityDays() != null && (value.getValidityDays() < 1 || value.getValidityDays() > 1095))
            throw new IllegalArgumentException("Validity must be between 1 and 1095 days.");
        if (value.getStatus() != null) Validation.status(value.getStatus(), "Active", "Inactive");
    }
}
