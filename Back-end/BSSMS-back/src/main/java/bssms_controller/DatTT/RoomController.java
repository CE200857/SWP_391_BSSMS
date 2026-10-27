package bssms_controller.DatTT;
import bssms_account.Account;
import bssms_catalog.Room;
import bssms_persistence.DatTT.RoomDAO;
import java.sql.SQLException;
import java.util.*;

public class RoomController {
    private final RoomDAO dao;
    public RoomController(RoomDAO dao) { this.dao = dao; }
    public List<Room> getAllRooms() throws SQLException { return dao.getAllRooms(); }
    public void create(Account user, Room value) throws SQLException {
        Validation.role(user, "Manager");
        validate(value);
        if (!dao.addRoom(value)) throw new SQLException("Insert affected no rows");
    }
    public void update(Account user, Room value) throws SQLException {
        Validation.role(user, "Manager");
        validate(value);
        Validation.id(value.getRoomId(), "id");
        Validation.found(dao.updateRoom(value));
    }
    public void delete(Account user, int id) throws SQLException {
        Validation.role(user, "Manager");
        Validation.id(id, "id");
        Validation.found(dao.deleteRoom(id));
    }
    private void validate(Room value) {
        Validation.body(value);
        value.setRoomName(Validation.text(value.getRoomName(), "roomName"));
        value.setRoomType(Validation.text(value.getRoomType(), "roomType"));
        if (value.getStatus() == null) value.setStatus("Active");
        Validation.status(value.getStatus(), "Active", "Maintenance");
    }
}
