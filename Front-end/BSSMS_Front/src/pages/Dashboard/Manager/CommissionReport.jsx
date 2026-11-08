import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Card, Form, Table, Spinner } from "react-bootstrap";
import { getCommissionReport } from "../../../services/commissionService";
import { api, today, money } from "../../../services/api";
import { monthRange } from "../../../services/billing";
import { useManagerSearchFilter } from "../../../components/ManagerSearchFilter";
export default function CommissionReport() {
  const [month, setMonth] = useState(() => today().slice(0, 7)),
    [rows, setRows] = useState([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [openStaff, setOpenStaff] = useState(null),
    [details, setDetails] = useState({}); // { "tháng:mã nhân viên": { rows } | { error } }
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
  // Hoa hồng được tính theo TỪNG DỊCH VỤ: bấm vào một nhân viên để xem từng dịch vụ họ được hưởng.
  function toggleStaff(staffId) {
    if (openStaff === staffId) {
      setOpenStaff(null);
      return;
    }
    setOpenStaff(staffId);
    const key = `${month}:${staffId}`;
    if (details[key]) return;
    const [from, to] = monthRange(month);
    api(`/api/manager/commission/report?startDate=${from}&endDate=${to}&staffId=${staffId}`)
      .then((list) => setDetails((d) => ({ ...d, [key]: { rows: Array.isArray(list) ? list : [] } })))
      .catch((e) => setDetails((d) => ({ ...d, [key]: { error: e.message } })));
  }
  const day = (value) => (value ? String(value).slice(0, 10).split("-").reverse().join("/") : "—");
  const roleLabel = (line) => (line.staffRole === "Assistant" ? "Phụ" : "Chính");
  const detailBox = (staffId) => {
    const entry = details[`${month}:${staffId}`];
    if (!entry) return <div className="ui-empty"><Spinner animation="border" size="sm" /></div>;
    if (entry.error) return <Alert variant="danger" className="mb-0">{entry.error}</Alert>;
    if (!entry.rows.length) return <p className="ui-empty mb-0">Không có dịch vụ nào trong tháng này.</p>;
    return (
      <Table size="sm" className="mb-0">
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Khách hàng</th>
            <th>Dịch vụ</th>
            <th>Vai trò / tỷ lệ</th>
            <th className="text-end">Giá dịch vụ</th>
            <th className="text-end">Hoa hồng ròng</th>
            <th>Hóa đơn</th>
          </tr>
        </thead>
        <tbody>
          {entry.rows.map((line) => (
            <tr key={line.commissionId}>
              <td>{day(line.appointmentDate)}</td>
              <td>{line.customerName || "—"}</td>
              <td>{line.serviceName}</td>
              <td>
                <div>{roleLabel(line)} · {Number(line.commissionRate)}%</div>
                <small className="text-muted">
                  {Number(line.sharePercent ?? 100)}% quỹ hoa hồng của dịch vụ
                </small>
              </td>
              <td className="text-end">{money(line.serviceBase)}</td>
              <td className="text-end">{money(line.netCommission)}</td>
              <td>#{line.invoiceId}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };
  return (
    <section>
      <div className="ui-page-heading">
        <div>
          <h1>Báo cáo hoa hồng</h1>
          <p>Hoa hồng tính theo từng dịch vụ và từng nhân viên (người chính, người phụ), bao gồm điều chỉnh hoàn tiền.</p>
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
                      <th>Số dịch vụ</th>
                      <th>Số hóa đơn</th>
                      <th className="text-end">Hoa hồng ròng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r) => (
                      <Fragment key={r.staffId}>
                        <tr
                          role="button"
                          aria-expanded={openStaff === r.staffId}
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleStaff(r.staffId)}
                        >
                          <td>
                            <i className={`bi bi-chevron-${openStaff === r.staffId ? "down" : "right"} me-2`} aria-hidden="true" />
                            {r.fullName}
                          </td>
                          <td>{r.totalServices ?? r.totalInvoices}</td>
                          <td>{r.totalInvoices}</td>
                          <td className="text-end">{money(r.totalCommission)}</td>
                        </tr>
                        {openStaff === r.staffId && (
                          <tr>
                            <td colSpan="4" className="bg-light">{detailBox(r.staffId)}</td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th colSpan="3">Tổng cộng</th>
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
