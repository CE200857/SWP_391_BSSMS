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
        if (value.getPackageName().length() > 150) throw new IllegalArgumentException("Tên gói tối đa 150 ký tự.");
        if (dao.nameExists(value.getPackageName(), id)) throw new IllegalArgumentException("Tên gói liệu trình đã tồn tại.");
        if (value.getServiceIds() == null || value.getServiceIds().isEmpty())
            throw new IllegalArgumentException("Gói liệu trình phải gồm ít nhất một dịch vụ.");
        for (Integer s : value.getServiceIds()) if (s == null || s <= 0) throw new IllegalArgumentException("Dịch vụ không hợp lệ.");
        if (!dao.servicesActive(value.getServiceIds())) throw new IllegalArgumentException("Có dịch vụ không tồn tại hoặc đã ngừng hoạt động.");
        if (value.getPrice() <= 0) throw new IllegalArgumentException("Giá gói phải lớn hơn 0.");
        if (value.getNumberOfSessions() < 1 || value.getNumberOfSessions() > 100) throw new IllegalArgumentException("Số buổi phải từ 1 đến 100.");
        if (value.getValidityDays() != null && (value.getValidityDays() < 1 || value.getValidityDays() > 1095))
            throw new IllegalArgumentException("Hạn dùng phải từ 1 đến 1095 ngày.");
        if (value.getStatus() != null) Validation.status(value.getStatus(), "Active", "Inactive");
    }
}
