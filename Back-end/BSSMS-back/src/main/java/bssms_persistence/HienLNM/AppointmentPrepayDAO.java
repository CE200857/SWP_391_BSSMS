package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

/** Khách thanh toán TRƯỚC dịch vụ lẻ: tạo hóa đơn chưa thanh toán cho lịch hẹn của mình, sau đó trả qua VNPay. */
public class AppointmentPrepayDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    public int prepay(int appointmentId) throws SQLException {
        workflow().roles("Customer");
        List<Map<String, Object>> rows = workflow().call("usp_PrepayAppointment", requireActorAccountId(), appointmentId);
        return ((Number) rows.get(0).get("invoiceId")).intValue();
    }
}
