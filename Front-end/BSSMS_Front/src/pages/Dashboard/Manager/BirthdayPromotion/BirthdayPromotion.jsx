import { useEffect, useState } from "react";
import { Alert, Button, Card, Modal, Spinner, Table } from "react-bootstrap";
import { api, post, money } from "../../../../services/api";
import { useManagerSearchFilter } from "../../../../components/ManagerSearchFilter";
export default function BirthdayPromotion() {
  const [rows, setRows] = useState([]),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [selectedVoucher, setSelectedVoucher] = useState(null);
  async function load() {
    setLoading(true);
    try {
      setRows(await api("/api/birthday-promotions"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the view while synchronizing external data for this selection.
    load();
  }, []);
  const { filteredRows, toolbar } = useManagerSearchFilter(
    rows,
    [
      { key: "voucherCode", label: "Mã voucher", filterable: false },
      { key: "customerName", label: "Khách hàng", filterable: false },
      {
        key: "status",
        label: "Trạng thái",
        formatValue: (value) => ({
          Active: "Đang hoạt động",
          Used: "Đã sử dụng",
          Expired: "Đã hết hạn",
        }[value] || value),
      },
    ],
    "Tìm theo mã voucher hoặc khách hàng...",
  );
  async function issue() {
    setBusy(true);
    setError("");
    try {
      await post("/api/operations/policy", { action: "issueBenefits" });
      setMessage(
        "Đã cấp ưu đãi tháng hiện tại cho khách đủ điều kiện. Không cấp trùng.",
      );
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <div className="ui-page-heading">
        <div>
          <h1>Ưu đãi sinh nhật</h1>
          <p>
            Voucher 800.000đ cho dịch vụ Treatment; giảm thêm 10% một lần trong
            tháng sinh nhật.
          </p>
        </div>
        <Button disabled={busy} onClick={issue}>
          {busy ? "Đang cấp…" : "Cấp ưu đãi tháng này"}
        </Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}
      <Card>
        <Card.Body>
          <div className="manager-list-toolbar mb-3">{toolbar}</div>
          {loading ? (
            <Spinner animation="border" />
          ) : (
            <div className="table-responsive">
              <Table hover className="manager-list-table">
                <thead>
                  <tr>
                    <th>Mã voucher</th>
                    <th>Khách hàng</th>
                    <th>Giá trị</th>
                    <th>Trạng thái</th>
                    <th>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => (
                      <tr key={r.voucherId}>
                        <td>{r.voucherCode}</td>
                        <td>{r.customerName}</td>
                        <td>
                          {r.discountType === "Percentage"
                            ? `${r.discountValue}%`
                            : money(r.discountValue)}
                        </td>
                        <td>
                          <span className={`badge ${r.status === "Active" ? "bg-success" : r.status === "Used" ? "bg-secondary" : r.status === "Expired" ? "bg-warning text-dark" : "bg-secondary"}`}>
                            {r.status === "Active" ? "Đang hoạt động" : r.status === "Used" ? "Đã sử dụng" : r.status === "Expired" ? "Đã hết hạn" : r.status}
                          </span>
                        </td>
                        <td>
                          <div className="manager-list-actions">
                          <Button
                            size="sm"
                            variant="link"
                            className="manager-list-action manager-list-action--view"
                            onClick={() => setSelectedVoucher(r)}
                          >
                            <i className="bi bi-eye-fill" aria-hidden="true" /> Xem
                          </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>
              {!rows.length && <p>Chưa có voucher sinh nhật.</p>}
            </div>
          )}
        </Card.Body>
      </Card>
      <Modal
        show={!!selectedVoucher}
        onHide={() => setSelectedVoucher(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết voucher sinh nhật</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Mã voucher:</strong> {selectedVoucher?.voucherCode || "—"}</p>
          <p><strong>Khách hàng:</strong> {selectedVoucher?.customerName || "—"}</p>
          <p><strong>Bắt đầu:</strong> {selectedVoucher?.startDate?.slice(0, 10) || "—"}</p>
          <p><strong>Hết hạn:</strong> {selectedVoucher?.endDate?.slice(0, 10) || "—"}</p>
          <p className="mb-0"><strong>Trạng thái:</strong> {selectedVoucher?.status || "—"}</p>
        </Modal.Body>
      </Modal>
    </section>
  );
}
