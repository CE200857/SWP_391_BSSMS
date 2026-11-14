package bssms_controller.DatTT;
import bssms_account.Account;
import bssms_catalog.Bed;
import bssms_persistence.DatTT.BedDAO;
import bssms_persistence.DatTT.RoomDAO;
import java.sql.SQLException;
import java.util.*;

public class BedController {
    private final BedDAO dao;
    public BedController(BedDAO dao) { this.dao = dao; }
    public List<Bed> getAllBeds(Integer roomId) throws SQLException { return dao.getAllBeds(roomId); }
    public void create(Account user, Bed value) throws SQLException {
        Validation.role(user, "Manager");
        validate(value, 0);
        if ("Maintenance".equals(dao.roomStatus(value.getRoomId()))) value.setStatus("Maintenance");
        if (!dao.addBed(value)) throw new SQLException("Insert affected no rows");
    }
    public Map<String, Object> update(Account user, Bed value) throws SQLException {
        Validation.role(user, "Manager");
        Validation.body(value);
        Validation.id(value.getBedId(), "id");
        validate(value, value.getBedId());
        if ("Maintenance".equals(value.getStatus()) && "InUse".equals(dao.useState(value.getBedId())))
            throw new IllegalArgumentException("Giường đang được sử dụng, không thể chuyển sang Bảo trì.");
        if ("Active".equals(value.getStatus()) && "Maintenance".equals(dao.roomStatus(value.getRoomId())))
            throw new IllegalArgumentException("Phòng đang bảo trì, không thể kích hoạt giường.");
        Validation.found(dao.updateBed(value));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Đã cập nhật giường.");
        List<Map<String, Object>> affected = List.of();
        if ("Maintenance".equals(value.getStatus())) try (RoomDAO rooms = new RoomDAO()) { affected = rooms.affectedByBed(value.getBedId()); }
        result.put("affectedAppointments", affected);
        return result;
    }
    public void delete(Account user, int id) throws SQLException {
        Validation.role(user, "Manager");
        Validation.id(id, "id");
        if (dao.everUsed(id))
            throw new IllegalArgumentException("Giường đã có lịch sử sử dụng, không thể xóa. Hãy chuyển giường sang Bảo trì.");
        Validation.found(dao.deleteBed(id));
    }
    private void validate(Bed value, int id) throws SQLException {
        Validation.body(value);
        Validation.id(value.getRoomId(), "roomId");
        if (dao.roomStatus(value.getRoomId()) == null) throw new IllegalArgumentException("Phòng không tồn tại.");
        value.setBedNumber(Validation.text(value.getBedNumber(), "bedNumber"));
        if (value.getBedNumber().length() > 20) throw new IllegalArgumentException("Số giường tối đa 20 ký tự.");
        if (dao.numberExists(value.getRoomId(), value.getBedNumber(), id)) throw new IllegalArgumentException("Số giường đã tồn tại trong phòng.");
        if (value.getStatus() == null) value.setStatus("Active");
        Validation.status(value.getStatus(), "Active", "Maintenance");
    }
}
