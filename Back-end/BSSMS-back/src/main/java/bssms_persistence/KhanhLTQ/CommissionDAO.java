/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_persistence.KhanhLTQ;

import bssms_persistence.DBContext;
import bssms_billing.Commission;
import bssms_api.KhanhLTQ.CommissionReportDTO;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CommissionDAO extends DBContext {

    // 1. Lấy tất cả hoa hồng
    public List<Commission> getAllCommissions() {
        List<Commission> list = new ArrayList<>();
        String sql = "SELECT * FROM Commission ORDER BY created_at DESC";

        if (this.conn == null) {
            return list;
        }

        try (PreparedStatement ps = this.conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Commission c = new Commission();
                c.setCommissionId(rs.getInt("commission_id"));
                c.setInvoiceId(rs.getInt("invoice_id"));
                c.setStaffId(rs.getInt("staff_id"));
                c.setCommissionRate(rs.getDouble("commission_rate"));
                c.setCommissionAmount(rs.getDouble("commission_amount"));
                c.setCreatedAt(rs.getTimestamp("created_at"));

                list.add(c);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // 2. Lấy danh sách hoa hồng theo nhân viên (staff_id)
    public List<Commission> getCommissionsByStaffId(int staffId) {
        List<Commission> list = new ArrayList<>();
        String sql = "SELECT * FROM Commission WHERE staff_id = ? ORDER BY created_at DESC";

        if (this.conn == null) {
            return list;
        }

        try (PreparedStatement ps = this.conn.prepareStatement(sql)) {
            ps.setInt(1, staffId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Commission c = new Commission();
                    c.setCommissionId(rs.getInt("commission_id"));
                    c.setInvoiceId(rs.getInt("invoice_id"));
                    c.setStaffId(rs.getInt("staff_id"));
                    c.setCommissionRate(rs.getDouble("commission_rate"));
                    c.setCommissionAmount(rs.getDouble("commission_amount"));
                    c.setCreatedAt(rs.getTimestamp("created_at"));

                    list.add(c);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // 3. Lấy hoa hồng theo mã hóa đơn (invoice_id)
    public Commission getCommissionByInvoiceId(int invoiceId) {
        String sql = "SELECT * FROM Commission WHERE invoice_id = ?";

        if (this.conn == null) {
            return null;
        }

        try (PreparedStatement ps = this.conn.prepareStatement(sql)) {
            ps.setInt(1, invoiceId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Commission c = new Commission();
                    c.setCommissionId(rs.getInt("commission_id"));
                    c.setInvoiceId(rs.getInt("invoice_id"));
                    c.setStaffId(rs.getInt("staff_id"));
                    c.setCommissionRate(rs.getDouble("commission_rate"));
                    c.setCommissionAmount(rs.getDouble("commission_amount"));
                    c.setCreatedAt(rs.getTimestamp("created_at"));
                    return c;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    // 4. Thêm mới một bản ghi hoa hồng
    public boolean createCommission(Commission commission) {
        String sql = "INSERT INTO Commission (invoice_id, staff_id, commission_rate, commission_amount, created_at) "
                   + "VALUES (?, ?, ?, ?, GETDATE())";

        if (this.conn == null) {
            return false;
        }

        try (PreparedStatement ps = this.conn.prepareStatement(sql)) {
            ps.setInt(1, commission.getInvoiceId());
            ps.setInt(2, commission.getStaffId());
            ps.setDouble(3, commission.getCommissionRate());
            ps.setDouble(4, commission.getCommissionAmount());

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 5. UC77 - Báo cáo hoa hồng theo khoảng thời gian
    public List<CommissionReportDTO> getCommissionReport(String startDate, String endDate) {
        List<CommissionReportDTO> list = new ArrayList<>();
        String sql = "SELECT c.staff_id, a.username AS full_name, "
                   + "COUNT(c.invoice_id) AS total_invoices, "
                   + "SUM(c.commission_amount) AS total_commission "
                   + "FROM Commission c "
                   + "JOIN Account a ON c.staff_id = a.account_id "
                   + "WHERE c.created_at BETWEEN ? AND ? "
                   + "GROUP BY c.staff_id, a.username";

        if (this.conn == null) {
            return list;
        }

        try (PreparedStatement ps = this.conn.prepareStatement(sql)) {
            ps.setString(1, startDate + " 00:00:00");
            ps.setString(2, endDate + " 23:59:59");

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    CommissionReportDTO dto = new CommissionReportDTO(
                        rs.getInt("staff_id"),
                        rs.getString("full_name"),
                        rs.getInt("total_invoices"),
                        rs.getDouble("total_commission")
                    );
                    list.add(dto);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }
}