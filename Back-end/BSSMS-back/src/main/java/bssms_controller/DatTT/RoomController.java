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
            throw new IllegalArgumentException("The room type cannot be changed while upcoming appointments use beds in this room.");
        if ("Maintenance".equals(value.getStatus()) && dao.hasBedInUse(value.getRoomId()))
            throw new IllegalArgumentException("A bed in this room is in use; please wait until the service is finished.");
        Validation.found(dao.updateRoom(value));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Room updated.");
        result.put("affectedAppointments", "Maintenance".equals(value.getStatus()) ? dao.affectedByRoom(value.getRoomId()) : List.of());
        return result;
    }
    public void delete(Account user, int id) throws SQLException {
        Validation.role(user, "Manager");
        Validation.id(id, "id");
        if (dao.everUsed(id))
            throw new IllegalArgumentException("A bed in this room is assigned to upcoming appointments. Reassign them before deleting.");
        Validation.found(dao.deleteRoom(id));
    }
    private void validate(Room value, int id) throws SQLException {
        Validation.body(value);
        value.setRoomName(Validation.text(value.getRoomName(), "roomName"));
        if (value.getRoomName().length() > 100) throw new IllegalArgumentException("Room name can be at most 100 characters.");
        if (dao.nameExists(value.getRoomName(), id)) throw new IllegalArgumentException("The room name already exists.");
        value.setRoomType(Validation.text(value.getRoomType(), "roomType"));
        if (!Arrays.asList(ROOM_TYPES).contains(value.getRoomType()))
            throw new IllegalArgumentException("Room type must be Facial, Massage, HairWash or Body.");
        if (value.getStatus() == null) value.setStatus("Active");
        Validation.status(value.getStatus(), "Active", "Maintenance");
    }
}
