package bssms_controller.DatTT;
import bssms_account.Account;
import bssms_catalog.Room;
import bssms_persistence.DatTT.RoomDAO;
import java.sql.SQLException;
import java.util.*;

public class RoomController {
    public static final String[] ROOM_TYPES = {"Facial", "Massage", "HairWash", "Body"};
    private final RoomDAO dao;
    public RoomController(RoomDAO dao) { this.dao = dao; }
    public List<Room> getAllRooms() throws SQLException { return dao.getAllRooms(); }
    public List<Map<String, Object>> affected(Account user, int roomId) throws SQLException {
        Validation.role(user, "Manager", "Receptionist");
        return dao.affectedByRoom(roomId);
    }
    public void create(Account user, Room value) throws SQLException {
        Validation.role(user, "Manager");
        validate(value, 0);
        if (!dao.addRoom(value)) throw new SQLException("Insert affected no rows");
    }
    public Map<String, Object> update(Account user, Room value) throws SQLException {
        Validation.role(user, "Manager");
        Validation.body(value);
        Validation.id(value.getRoomId(), "id");
        validate(value, value.getRoomId());
        if (dao.typeChangeBlocked(value))
            throw new IllegalArgumentException("Không thể đổi loại phòng khi còn lịch hẹn sắp tới dùng giường trong phòng.");
        if ("Maintenance".equals(value.getStatus()) && dao.hasBedInUse(value.getRoomId()))
            throw new IllegalArgumentException("Phòng đang có giường sử dụng, vui lòng chờ khách hoàn thành dịch vụ.");
        Validation.found(dao.updateRoom(value));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Đã cập nhật phòng.");
        result.put("affectedAppointments", "Maintenance".equals(value.getStatus()) ? dao.affectedByRoom(value.getRoomId()) : List.of());
        return result;
    }
    public void delete(Account user, int id) throws SQLException {
        Validation.role(user, "Manager");
        Validation.id(id, "id");
        if (dao.everUsed(id))
            throw new IllegalArgumentException("Phòng đã có lịch sử sử dụng, không thể xóa. Hãy chuyển phòng sang Bảo trì.");
        Validation.found(dao.deleteRoom(id));
    }
    private void validate(Room value, int id) throws SQLException {
        Validation.body(value);
        value.setRoomName(Validation.text(value.getRoomName(), "roomName"));
        if (value.getRoomName().length() > 100) throw new IllegalArgumentException("Tên phòng tối đa 100 ký tự.");
        if (dao.nameExists(value.getRoomName(), id)) throw new IllegalArgumentException("Tên phòng đã tồn tại.");
        value.setRoomType(Validation.text(value.getRoomType(), "roomType"));
        if (!Arrays.asList(ROOM_TYPES).contains(value.getRoomType()))
            throw new IllegalArgumentException("Loại phòng phải là Facial, Massage, HairWash hoặc Body.");
        if (value.getStatus() == null) value.setStatus("Active");
        Validation.status(value.getStatus(), "Active", "Maintenance");
    }
}
