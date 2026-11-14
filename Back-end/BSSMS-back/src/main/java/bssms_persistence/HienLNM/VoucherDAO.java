package bssms_persistence.HienLNM;

import bssms_persistence.DBContext;
import bssms_persistence.common.*;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.*;

public class VoucherDAO extends DBContext implements AutoCloseable {
    @Override public void close() throws SQLException { if (conn != null) conn.close(); }

    private static final String COLUMNS = "v.voucher_id,v.voucher_code,v.voucher_name,v.discount_type,v.discount_value,v.min_order_amount,v.max_discount,v.max_uses,v.used_count,v.start_date,v.end_date,"
            + "CASE WHEN v.status='Active' AND v.end_date<SYSDATETIME() THEN 'Expired' WHEN v.status='Active' AND v.used_count>=v.max_uses THEN 'UsedUp' ELSE v.status END AS status,"
            + "v.status AS raw_status,st.full_name AS created_by_name";

    public List<Map<String, Object>> getAllVouchers(String search, String status) throws SQLException {
        Workflow w = workflow();
        w.roles("Manager", "Receptionist");
        String like = search == null || search.isBlank() ? null : "%" + search.trim() + "%";
        return w.query("SELECT " + COLUMNS + " FROM Voucher v LEFT JOIN Staff st ON st.staff_id=v.created_by_staff_id WHERE (? IS NULL OR v.voucher_code LIKE ? OR v.voucher_name LIKE ?) AND (? IS NULL OR v.status=?) ORDER BY v.start_date DESC",
                like, like, like, status, status);
    }

    public Map<String, Object> getVoucherById(int voucherId) throws SQLException {
        Workflow w = workflow();
        w.roles("Manager", "Receptionist");
        return w.one("SELECT " + COLUMNS + " FROM Voucher v LEFT JOIN Staff st ON st.staff_id=v.created_by_staff_id WHERE v.voucher_id=?", voucherId);
    }

    public static final class Data {
        public String voucherCode, voucherName, discountType, startDate, endDate;
        public BigDecimal discountValue, minOrderAmount, maxDiscount;
        public Integer maxUses;
        void validate() {
            if (voucherCode == null || !voucherCode.trim().matches("[A-Za-z0-9_-]{3,50}")) throw new IllegalArgumentException("Mã voucher 3-50 ký tự chữ, số, - hoặc _.");
            if (voucherName == null || voucherName.isBlank() || voucherName.length() > 100) throw new IllegalArgumentException("Tên voucher không hợp lệ.");
            if (!"Percent".equals(discountType) && !"Amount".equals(discountType)) throw new IllegalArgumentException("Loại giảm phải là Percent hoặc Amount.");
            if (discountValue == null || discountValue.signum() <= 0 || ("Percent".equals(discountType) && discountValue.compareTo(BigDecimal.valueOf(100)) > 0))
                throw new IllegalArgumentException("Giá trị giảm không hợp lệ.");
            if (minOrderAmount == null) minOrderAmount = BigDecimal.ZERO;
            if (minOrderAmount.signum() < 0 || (maxDiscount != null && maxDiscount.signum() <= 0)) throw new IllegalArgumentException("Đơn tối thiểu/giảm tối đa không hợp lệ.");
            if (maxUses == null || maxUses <= 0) throw new IllegalArgumentException("Số lượt sử dụng phải lớn hơn 0.");
            if (startDate == null || endDate == null || !at(endDate, true).after(at(startDate, false)))
                throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu.");
            voucherCode = voucherCode.trim().toUpperCase();
        }
    }
    static String norm(String value) {
        String v = value.trim().replace(' ', 'T');
        return v.length() == 10 ? v + "T00:00:00" : v.length() == 16 ? v + ":00" : v;
    }
    static java.sql.Timestamp at(String value, boolean endOfDay) {
        String v = value.trim();
        if (v.length() == 10) v = v + (endOfDay ? "T23:59:59" : "T00:00:00");
        return java.sql.Timestamp.valueOf(java.time.LocalDateTime.parse(norm(v)));
    }

    public int createVoucher(Data d) throws SQLException {
        Workflow w = workflow();
        w.roles("Manager");
        d.validate();
        if (at(d.endDate, true).toLocalDateTime().isBefore(java.time.LocalDateTime.now(bssms_persistence.common.BookingWorkflow.ZONE)))
            throw new IllegalArgumentException("Ngày kết thúc đã qua: voucher mới phải còn hạn sử dụng.");
        if (isVoucherCodeExists(d.voucherCode, null)) throw new WorkflowException(409, "Mã voucher đã tồn tại!");
        return w.insert("INSERT INTO Voucher(voucher_code,voucher_name,discount_type,discount_value,min_order_amount,max_discount,max_uses,used_count,start_date,end_date,status,created_by_staff_id) VALUES(?,?,?,?,?,?,?,0,?,?,'Active',?)",
                d.voucherCode, d.voucherName.trim(), d.discountType, d.discountValue, d.minOrderAmount, d.maxDiscount, d.maxUses, at(d.startDate, false), at(d.endDate, true), w.staffId());
    }

    public boolean updateVoucher(int voucherId, Data d) throws SQLException {
        Workflow w = workflow();
        w.roles("Manager");
        d.validate();
        Map<String, Object> current = w.one("SELECT voucher_code,used_count FROM Voucher WHERE voucher_id=?", voucherId);
        int used = ((Number) current.get("usedCount")).intValue();
        if (used > 0 && !d.voucherCode.equals(current.get("voucherCode"))) throw new WorkflowException(409, "Không đổi mã của voucher đã được sử dụng.");
        if (d.maxUses < used) throw new WorkflowException(409, "Số lượt không được thấp hơn số lượt đã dùng (" + used + ").");
        if (isVoucherCodeExists(d.voucherCode, voucherId)) throw new WorkflowException(409, "Mã voucher đã tồn tại!");
        return w.update("UPDATE Voucher SET voucher_code=?,voucher_name=?,discount_type=?,discount_value=?,min_order_amount=?,max_discount=?,max_uses=?,start_date=?,end_date=? WHERE voucher_id=?",
                d.voucherCode, d.voucherName.trim(), d.discountType, d.discountValue, d.minOrderAmount, d.maxDiscount, d.maxUses, at(d.startDate, false), at(d.endDate, true), voucherId) == 1;
    }

    public boolean setVoucherStatus(int voucherId, String status) throws SQLException {
        workflow().roles("Manager");
        if (!"Active".equals(status) && !"Inactive".equals(status)) throw new IllegalArgumentException("Trạng thái phải là Active hoặc Inactive.");
        return workflow().update("UPDATE Voucher SET status=? WHERE voucher_id=?", status, voucherId) == 1;
    }
    public boolean deleteVoucher(int voucherId) throws SQLException { return setVoucherStatus(voucherId, "Inactive"); }

    public boolean isVoucherCodeExists(String voucherCode, Integer excludeVoucherId) throws SQLException {
        return !workflow().query("SELECT voucher_id FROM Voucher WHERE voucher_code=? AND voucher_id<>?", voucherCode, excludeVoucherId == null ? -1 : excludeVoucherId).isEmpty();
    }

    public Map<String, Object> preview(String code, int customerId, BigDecimal subtotal) throws SQLException {
        Workflow w = workflow();
        if ("Customer".equals(w.role())) customerId = w.customerId();
        BillingWorkflow billing = new BillingWorkflow(w);
        BigDecimal tier = subtotal.multiply(billing.tierPercent(customerId)).divide(BigDecimal.valueOf(100), 0, java.math.RoundingMode.HALF_UP);
        BigDecimal limit = subtotal.multiply(new BigDecimal("0.5")).setScale(0, java.math.RoundingMode.HALF_UP);
        tier = tier.min(limit);
        BigDecimal voucher = BigDecimal.ZERO;
        Integer id = null;
        if (code != null && !code.isBlank()) {
            id = billing.validateVoucher(code, subtotal.subtract(tier));
            voucher = billing.voucherDiscount(id, subtotal.subtract(tier)).min(limit.subtract(tier));
        }
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("voucherId", id); r.put("subtotal", subtotal); r.put("tierDiscount", tier); r.put("voucherDiscount", voucher);
        r.put("totalAmount", subtotal.subtract(tier).subtract(voucher));
        return r;
    }
}
