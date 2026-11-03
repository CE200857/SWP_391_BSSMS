import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Card, Form, Table, Spinner } from "react-bootstrap";
import { getCommissionReport } from "../../../services/commissionService";
import { today, money } from "../../../services/api";
import { monthRange } from "../../../services/billing";
import { useManagerSearchFilter } from "../../../components/ManagerSearchFilter";
export default function CommissionReport() {
  const [month, setMonth] = useState(() => today().slice(0, 7)),
    [rows, setRows] = useState([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const { filteredRows, toolbar } = useManagerSearchFilter(
    rows,
    [{ key: "fullName", label: "Nhân viên" }],
    "Tìm theo tên nhân viên...",
  );
  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the view while synchronizing external data for this selection.
    setLoading(true);
    setError("");
    getCommissionReport(...monthRange(month))
      .then((r) => {
        if (active) setRows(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [month]);
  return (
    <section>
      <div className="ui-page-heading">
        <div>
          <h1>Báo cáo hoa hồng</h1>
          <p>Hoa hồng thực tế, bao gồm điều chỉnh hoàn tiền.</p>
        </div>
        <Link className="btn btn-outline-primary" to="/manager/policy">
          Chính sách & chốt tháng
        </Link>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="ui-toolbar">
        <Form.Group>
          <Form.Label>Tháng báo cáo</Form.Label>
          <Form.Control
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
          />
        </Form.Group>
      </div>
      <Card>
        <Card.Body>
          <div className="manager-list-toolbar mb-3">{toolbar}</div>
          {loading ? (
            <div className="ui-empty">
              <Spinner animation="border" />
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="manager-list-table">
                  <thead>
                    <tr>
                      <th>Nhân viên</th>
                      <th>Số hóa đơn</th>
                      <th className="text-end">Hoa hồng ròng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r) => (
                      <tr key={r.staffId}>
                        <td>{r.fullName}</td>
                        <td>{r.totalInvoices}</td>
                        <td className="text-end">{money(r.totalCommission)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th colSpan="2">Tổng cộng</th>
                      <th className="text-end">
                        {money(
                          filteredRows.reduce(
                            (sum, r) => sum + Number(r.totalCommission || 0),
                            0,
                          ),
                        )}
                      </th>
                    </tr>
                  </tfoot>
                </Table>
              </div>
              {!rows.length && (
                <p className="ui-empty">Chưa có hoa hồng trong tháng này.</p>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </section>
  );
}
