import { useEffect, useState } from "react";
import { Alert, Button, Card, Spinner, Table } from "react-bootstrap";
import { getTechnicianCommissions } from "../../../services/commissionService";
import { money } from "../../../services/api";
export default function PersonalCommission() {
  const [rows, setRows] = useState([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await getTechnicianCommissions());
    } catch (e) {
      setError(e.message || "Không thể tải hoa hồng.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the view while synchronizing external data for this selection.
    load();
  }, []);
  return (
    <section>
      <div className="ui-page-heading">
        <div>
          <h1>Hoa hồng cá nhân</h1>
          <p>Hoa hồng sau điều chỉnh hoàn tiền, theo từng buổi dịch vụ.</p>
        </div>
        <Button variant="outline-primary" disabled={loading} onClick={load}>
          Làm mới
        </Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Card className="mb-4">
        <Card.Body>
          <h2>Tổng hoa hồng</h2>
          <strong className="fs-3">
            {money(
              rows.reduce(
                (s, r) =>
                  s + Number(r.netCommission ?? r.commissionAmount ?? 0),
                0,
              ),
            )}
          </strong>
        </Card.Body>
      </Card>
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <Table>
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Hóa đơn</th>
                    <th>Ngày</th>
                    <th>Tỷ lệ</th>
                    <th>Điều chỉnh</th>
                    <th>Thực nhận</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.commissionId}>
                      <td>#{r.commissionId}</td>
                      <td>#{r.invoiceId}</td>
                      <td>{r.createdAt}</td>
                      <td>{r.commissionRate}%</td>
                      <td>{money(r.adjustmentAmount)}</td>
                      <td>{money(r.netCommission ?? r.commissionAmount)}</td>
                      <td>{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {!rows.length && <p>Chưa có hoa hồng được ghi nhận.</p>}
            </div>
          </Card.Body>
        </Card>
      )}
    </section>
  );
}
