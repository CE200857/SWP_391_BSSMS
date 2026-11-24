// UC Approve Leave — Manager reviews affected appointments and approves/rejects leave requests.
import { useState } from "react";
import { Alert, Badge, Button, Card, Form, Modal, Spinner, Table } from "react-bootstrap";
import { api, post, today, viDate, time5, label } from "../../../services/api";
import FloatingAlert from "../../../components/FloatingAlert";
import { leaveBg, useOperations } from "./operationsShared";

export default function ApproveLeave() {
  const { data, error, loading, load, setError } = useOperations("leaves");
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const openDetail = async (leave) => {
    setNote("");
    setDetail({ leave, appointments: null });
    try {
      const appointments = await api(`/api/operations/leave-appointments?date=${leave.leaveId}`);
      setDetail({ leave, appointments });
    } catch (e) {
      setError(e.message);
    }
  };
  const decide = async (decision) => {
    setBusy(true);
    try {
      const r = await post("/api/operations/leaves", { action: "decide", id: detail.leave.leaveId, decision, note: note.trim() || null });
      setNotice(r.message);
      setDetail(null);
      load();
    } catch (e) {
      setError(e.message);
      setDetail(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <FloatingAlert message={error} onClose={() => setError("")} />
      <FloatingAlert message={notice} variant="success" onClose={() => setNotice("")} />
      <p className="small text-muted mb-3" title="Approving a request automatically rejects other pending requests on the same days. Suggested = no affected appointments and the day is still free.">
        <i className="bi bi-info-circle me-1" aria-hidden="true" />
        Approve on <strong>Fridays</strong> · Max <strong>1 staff</strong> on leave per day · <Badge bg="success">Suggested</Badge> = no appointment conflict
        {new Date().getDay() !== 5 && <span className="text-danger"> · Today is not Friday: reject only</span>}
      </p>
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table hover responsive className="align-middle mb-0 manager-list-table">
            <thead className="table-dark"><tr><th>Staff</th><th>Leave period</th><th>Reason</th><th>Conflicts</th><th>Status</th><th /></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-4"><Spinner size="sm" animation="border" /></td></tr> : (data || []).map((l) => (
                <tr key={l.leaveId}>
                  {/* Mỗi ô 1 dòng; vai trò, ngày gửi và ghi chú quyết định hiện khi rê chuột vào */}
                  <td className="fw-semibold text-nowrap" title={label(l.role)}>{l.fullName}{l.mine && <Badge bg="secondary" className="ms-2">Your request</Badge>}{l.suggested && <Badge bg="success" className="ms-2">Suggested</Badge>}</td>
                  <td className="text-nowrap" title={`Sent ${String(l.requestedAt).slice(0, 10)}`}>{viDate(l.startDate)} – {viDate(l.endDate)}</td>
                  <td className="text-truncate" style={{ maxWidth: 220 }} title={l.reason || undefined}>{l.reason || "—"}</td>
                  <td className="text-nowrap">
                    {l.status === "Pending" && l.approvedStaffName ? <Badge bg="danger" title={`Day already taken by ${l.approvedStaffName}`}>Day taken</Badge>
                      : Number(l.affectedAppointments) > 0 ? <Badge bg="danger">{l.affectedAppointments} appointment(s)</Badge>
                      : Number(l.sameDayRequests) > 0 ? <Badge bg="warning" text="dark" title="Other pending requests on the same days">{l.sameDayRequests} same-day</Badge>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td title={l.decisionNote || undefined}><Badge bg={leaveBg[l.status]}>{label(l.status)}</Badge></td>
                  <td>{l.status === "Pending" && <Button size="sm" onClick={() => openDetail(l)}>{l.mine ? "View" : "View & approve"}</Button>}</td>
                </tr>
              ))}
              {!loading && !(data || []).length && <tr><td colSpan={7} className="text-center text-muted py-4">No leave requests yet.</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={!!detail} onHide={() => !busy && setDetail(null)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Leave request · {detail?.leave.fullName}</Modal.Title></Modal.Header>
        {detail && (
          <Modal.Body>
            <p>{viDate(detail.leave.startDate)} – {viDate(detail.leave.endDate)} · {detail.leave.reason || "No reason given"}</p>
            <h6 className="fw-bold">Appointments assigned during the leave</h6>
            {!detail.appointments ? <Spinner size="sm" animation="border" /> : detail.appointments.length ? (
              <ul>
                {detail.appointments.map((a, i) => <li key={i}>#{a.appointmentId} · {viDate(a.appointmentDate)} {time5(a.startTime)} · {a.customerName} · {a.serviceName}</li>)}
              </ul>
            ) : <p className="text-muted">No appointments.</p>}
            <Alert variant="info" className="small">A request can be approved only when every appointment above has a replacement technician. After approval, shifts during the leave are removed and the receptionist reassigns the appointments.</Alert>
            <Form.Group>
              <Form.Label>Decision note</Form.Label>
              <Form.Control value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            </Form.Group>
          </Modal.Body>
        )}
        <Modal.Footer>
          {detail?.leave.mine ? (
            <small className="text-muted me-auto">This is your own request. Another manager must approve or reject it.</small>
          ) : (
            <>
              <Button variant="outline-danger" disabled={busy} onClick={() => decide("Rejected")}>Reject</Button>
              {detail?.leave && String(detail.leave.endDate).slice(0, 10) < today()
                ? <small className="text-muted me-auto">The leave dates have passed; the request can only be rejected.</small>
                : <Button variant="success" disabled={busy} onClick={() => decide("Approved")}>Approve</Button>}
            </>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
}
