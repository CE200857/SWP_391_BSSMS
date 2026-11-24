// UC View Daily Tour Report — tours per technician for the day.
import { useState } from "react";
import { Card, Form, Spinner, Table } from "react-bootstrap";
import { today } from "../../../services/api";
import FloatingAlert from "../../../components/FloatingAlert";
import { useOperations } from "./operationsShared";

export default function DailyTourReport() {
  const [date, setDate] = useState(today());
  const { data, error, loading, setError } = useOperations("tour-report", date);
  return (
    <>
      <div className="d-flex gap-3 align-items-center mb-3">
        <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 180 }} />
        <span>Tour difference (counted) between technicians: <strong>{data?.gap?.gap ?? 0}</strong></span>
      </div>
      <FloatingAlert message={error} onClose={() => setError("")} />
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table hover responsive className="align-middle mb-0 manager-list-table">
            <thead className="table-dark"><tr><th>Technician</th><th>Start-of-day compensation tours</th><th>Counted tours</th><th>Tours done</th><th>Requested tours</th><th>Last assigned</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-4"><Spinner size="sm" animation="border" /></td></tr> : (data?.rows || []).map((r) => (
                <tr key={r.staffId}>
                  <td className="fw-semibold">{r.fullName}</td>
                  <td>{Number(r.startOffsetTours)}</td>
                  <td>{Number(r.countedTours)}</td>
                  <td>{Number(r.actualTours)}</td>
                  <td>{Number(r.requestedTours)}</td>
                  <td>{r.lastAssignedAt ? String(r.lastAssignedAt).slice(11, 16) : "—"}</td>
                </tr>
              ))}
              {!loading && !(data?.rows || []).length && <tr><td colSpan={6} className="text-center text-muted py-4">No tour data for this day yet.</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      <small className="text-muted d-block mt-2">Counted tours are used to rotate customer assignments (technicians starting their shift late are compensated with the current lowest tour count); requested tours do not change the rotation.</small>
    </>
  );
}
