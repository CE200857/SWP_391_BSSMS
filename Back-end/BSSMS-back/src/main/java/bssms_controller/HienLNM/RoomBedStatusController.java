package bssms_controller.HienLNM;

import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;

import bssms_persistence.HienLNM.RoomBedStatusDAO;
import com.google.gson.Gson;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;
/**
 * @author HienLNM
 */

public class RoomBedStatusController extends ControllerSupport {

    private RoomBedStatusDAO dao = use(new RoomBedStatusDAO());
    private final Gson gson = new Gson();

    public void get(ActionRequest req, ActionResult resp) throws IOException {

        PrintWriter out = resp.writer();

        List<Map<String, Object>> list = dao.getAllRoomsWithBeds();
        out.print(gson.toJson(list));
        out.flush();
    }

    public void put(ActionRequest req, ActionResult resp) throws IOException {

        PrintWriter out = resp.writer();

        String pathInfo = req.pathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            resp.status(400);
            out.print("{\"message\":\"Thieu thong tin room hoac bed ID\"}");
            out.flush();
            return;
        }

        String[] parts = pathInfo.split("/");
        if (parts.length < 3) {
            resp.status(400);
            out.print("{\"message\":\"URL khong hop le. Dung cu phap: /api/room-bed-status/room/{id} hoac /api/room-bed-status/bed/{id}\"}");
            out.flush();
            return;
        }

        String type = parts[1];
        String idStr = parts[2];

        try {
            int id = Integer.parseInt(idStr);

            BufferedReader reader = req.bodyReader();
            Map<String, String> data = gson.fromJson(reader, Map.class);
            String newStatus = data.get("status");

            if (newStatus == null || newStatus.trim().isEmpty()) {
                resp.status(400);
                out.print("{\"message\":\"Trang thai moi khong duoc de trong\"}");
                out.flush();
                return;
            }

            boolean success;
            if (type.equalsIgnoreCase("room")) {
                success = dao.updateRoomStatus(id, newStatus);
            } else if (type.equalsIgnoreCase("bed")) {
                success = dao.updateBedStatus(id, newStatus);
            } else {
                resp.status(400);
                out.print("{\"message\":\"Loai (room/bed) khong hop le\"}");
                out.flush();
                return;
            }

            if (success) {
                resp.status(200);
                out.print("{\"message\":\"Cap nhat trang thai " + type + " thanh cong\"}");
            } else {
                resp.status(404);
                out.print("{\"message\":\"Khong tim thay " + type + " de cap nhat\"}");
            }
        } catch (NumberFormatException e) {
            resp.status(400);
            out.print("{\"message\":\"ID khong hop le\"}");
        } catch (Exception e) {
            DataAccessException.rethrowIfDatabase(e);
            InputValidation.rethrowIfInvalid(e);
            resp.status(500);
            out.print(gson.toJson(java.util.Map.of("message", "Không thể thực hiện thao tác. Vui lòng kiểm tra dữ liệu.")));
        }
        out.flush();
    }
}
