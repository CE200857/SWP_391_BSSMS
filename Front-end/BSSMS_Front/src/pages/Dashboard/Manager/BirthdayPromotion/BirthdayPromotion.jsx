import { useEffect, useState } from "react";
import { Alert, Button, Card, Form, Spinner, Table } from "react-bootstrap";
import { api, post, money } from "../../../../services/api";
export default function BirthdayPromotion() {
  const [rows, setRows] = useState([]),
    [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
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
          <Form.Control
            className="mb-3"
            aria-label="Tìm voucher sinh nhật"
            placeholder="Mã voucher hoặc khách hàng"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading ? (
            <Spinner animation="border" />
          ) : (
            <div className="table-responsive">
              <Table>
                <thead>
                  <tr>
                    <th>Mã voucher</th>
                    <th>Khách hàng</th>
                    <th>Giá trị</th>
                    <th>Bắt đầu</th>
                    <th>Hết hạn</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {rows
                    .filter((r) =>
                      `${r.voucherCode} ${r.customerName}`
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                    )
                    .map((r) => (
                      <tr key={r.voucherId}>
                        <td>{r.voucherCode}</td>
                        <td>{r.customerName}</td>
                        <td>
                          {r.discountType === "Percentage"
                            ? `${r.discountValue}%`
                            : money(r.discountValue)}
                        </td>
                        <td>{r.startDate?.slice(0, 10)}</td>
                        <td>{r.endDate?.slice(0, 10)}</td>
                        <td>{r.status}</td>
                      </tr>
                    ))}
                </tbody>
              </Table>
              {!rows.length && <p>Chưa có voucher sinh nhật.</p>}
            </div>
          )}
        </Card.Body>
      </Card>
    </section>
  );
}
