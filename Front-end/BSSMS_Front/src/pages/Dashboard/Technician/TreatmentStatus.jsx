import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Container, Form, Modal, Spinner, Table } from "react-bootstrap";
import { api, post, put, del, today, time5, viDate, label } from "../../../services/api";
import { imageFileToUpload } from "../../../utils/imageUpload";
import FloatingAlert from "../../../components/FloatingAlert";

const lineBadge = { Waiting: "secondary", InProgress: "primary", Done: "success" };
const realAllergy = (value) => value && !/^(none|no|không|khong|n\/a|-)$/i.test(String(value).trim());

// One block per appointment so the customer is shown once, not on every service line
const groupByAppointment = (rows) => {
  const groups = new Map();
  rows.forEach((l) => {
    if (!groups.has(l.appointmentId)) groups.set(l.appointmentId, []);
    groups.get(l.appointmentId).push(l);
  });
  return [...groups.values()];
};

function OutcomeModal({ line, canEdit, onClose, onSaved }) {
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState("");
  const [skinReaction, setSkinReaction] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!line) return;
    try {
      const r = await api(`/api/treatment-outcomes/${line.appointmentServiceId}`);
      setData(r);
      setNotes(r.notes || "");
      setSkinReaction(r.skinReaction || "");
    } catch (e) {
      setError(e.message);
    }
  }, [line]);
  useEffect(() => { setData(null); setError(""); load(); }, [load]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await put(`/api/treatment-outcomes/${line.appointmentServiceId}`, { notes, skinReaction });
      onSaved("Treatment notes saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const upload = async (photoType, file) => {
    if (!file) return;
    setError("");
    try {
      const image = await imageFileToUpload(file);
      await post(`/api/treatment-photos/${line.appointmentServiceId}`, { photoType, ...image });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  const removePhoto = async (photoId) => {
    try {
      await del(`/api/treatment-photos/${photoId}`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Modal show={!!line} onHide={() => !saving && onClose()} size="lg" centered>
      <Modal.Header closeButton={!saving}>
        <Modal.Title>Treatment notes · {line?.serviceName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <FloatingAlert message={error} onClose={() => setError("")} />
        {!data && !error && <div className="text-center py-4"><Spinner animation="border" variant="danger" /></div>}
        {data && (
          <>
            <p className="text-muted">Customer: <strong>{data.customerName}</strong> · Appointment #{data.appointmentId}</p>
            <Form.Group className="mb-3">
              <Form.Label>Treatment notes *</Form.Label>
              <Form.Control as="textarea" rows={4} maxLength={4000} value={notes} disabled={!canEdit} onChange={(e) => setNotes(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Skin reaction</Form.Label>
              <Form.Control as="textarea" rows={2} maxLength={1000} value={skinReaction} disabled={!canEdit} onChange={(e) => setSkinReaction(e.target.value)} />
              <Form.Text>Treatment notes can only be edited on the day of the service.</Form.Text>
            </Form.Group>
            <h6 className="fw-bold">Before / after photos ({(data.photos || []).length}/10)</h6>
            <div className="d-flex flex-wrap gap-3 mb-2">
              {(data.photos || []).map((p) => (
                <figure key={p.photoId} className="text-center mb-0">
                  <img src={`/api/treatment-photos/file/${p.photoId}`} alt={p.photoType} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }} />
                  <figcaption className="small">
                    {p.photoType === "Before" ? "Before" : "Sau"}
                    {canEdit && <Button variant="link" size="sm" className="text-danger p-0 ms-2" onClick={() => removePhoto(p.photoId)}>Delete</Button>}
                  </figcaption>
                </figure>
              ))}
            </div>
            {canEdit && (
              <div className="d-flex gap-3 flex-wrap">
                <Form.Group><Form.Label className="small">Add before photo</Form.Label>
                  <Form.Control type="file" size="sm" accept="image/jpeg,image/png,image/webp" onChange={(e) => { upload("Before", e.target.files[0]); e.target.value = ""; }} /></Form.Group>
                <Form.Group><Form.Label className="small">Add after photo</Form.Label>
                  <Form.Control type="file" size="sm" accept="image/jpeg,image/png,image/webp" onChange={(e) => { upload("After", e.target.files[0]); e.target.value = ""; }} /></Form.Group>
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose} disabled={saving}>Close</Button>
        {canEdit && <Button onClick={save} disabled={saving || !notes.trim()}>{saving ? "Saving..." : "Save notes"}</Button>}
      </Modal.Footer>
    </Modal>
  );
}

function AppointmentLineBadge({ status }) {
  const icon = { Waiting: "pause-circle", InProgress: "play-circle", Done: "check-circle-fill" }[status] || "circle";
  return <span className={`ts-status ts-status--${status}`}><i className={`bi bi-${icon}`} aria-hidden="true" /> {label(status)}</span>;
}

export default function TreatmentStatus({ outcomeOnly = false, user: signedIn }) {
  // Prefer the signed-in user from the app; localStorage can hold another tab's account
  const user = signedIn || JSON.parse(localStorage.getItem("user") || "null");
  const isTechnician = user?.role === "Technician";
  const [date, setDate] = useState(today());
  const [status, setStatus] = useState(outcomeOnly ? "Done" : "");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(null);
  const [outcome, setOutcome] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (date) { params.set("fromDate", date); params.set("toDate", date); }
      if (status) params.set("status", status);
      setRows(await api(`/api/treatment-status?${params}`));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [date, status]);
  useEffect(() => { load(); }, [load]);

  const act = async (line, action) => {
    setBusy(line.appointmentServiceId);
    setError("");
    try {
      const r = await put(`/api/treatment-status/${line.appointmentServiceId}/${action}`, {});
      setNotice(action === "start" ? `Started ${line.serviceName}.` : r?.appointmentCompleted
        ? `Completed ${line.serviceName}. Appointment #${line.appointmentId} completed.`
        : `Completed ${line.serviceName}.`);
      await load();
      if (action === "done") setOutcome(line);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Container fluid className="mt-4 px-4">
      <h2 className="manager-page-title fw-bold mb-1">{outcomeOnly ? "Record treatment notes" : "Service status"}</h2>
      <p className="text-muted mb-4">
        {isTechnician
          ? "Start and complete each assigned service in order, then add treatment notes. Completing a service that uses a package deducts 1 session."
          : "Track the progress of each service on the selected day."}
      </p>
      <FloatingAlert message={error} onClose={() => setError("")} />
      <FloatingAlert message={notice} variant="success" onClose={() => setNotice("")} />

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="d-flex flex-wrap gap-3 align-items-center">
          <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 180 }} />
          <Form.Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 200 }}>
            <option value="">All statuses</option>
            <option value="Waiting">Waiting</option>
            <option value="InProgress">In progress</option>
            <option value="Done">Complete</option>
          </Form.Select>
          <Button variant="outline-secondary" onClick={load}><i className="bi bi-arrow-clockwise" /> Refresh</Button>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table responsive className="align-middle mb-0 manager-list-table ts-table">
            <thead className="table-dark">
              <tr><th>Customer</th><th>Time</th><th>Service</th><th>{isTechnician ? "Bed" : "Bed · technician"}</th><th>Status</th><th className="text-center">Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4"><Spinner animation="border" size="sm" /> Loading...</td></tr>
              ) : rows.length ? groupByAppointment(rows).map((lines) => lines.map((l, i) => (
                <tr key={l.appointmentServiceId} className={i === 0 ? "ts-group-start" : undefined}>
                  {i === 0 && (
                    <td rowSpan={lines.length} className="ts-customer">
                      <strong>{l.customerName}</strong>
                      {realAllergy(l.allergies) && (
                        <span className="ts-flag ts-flag--danger"><i className="bi bi-exclamation-triangle" aria-hidden="true" /> Allergy: {l.allergies}</span>
                      )}
                      {l.skinCondition && (
                        <span className="ts-flag" title={l.skinCondition}><i className="bi bi-info-circle" aria-hidden="true" /> {l.skinCondition}</span>
                      )}
                    </td>
                  )}
                  <td className="ts-time">{time5(l.startTime)}–{time5(l.endTime)}</td>
                  <td>
                    {l.serviceName}
                    {l.customerPackageId ? <span className="ts-package">Package</span> : null}
                  </td>
                  <td>
                    {l.roomName ? <span className="ts-bed" title={l.roomName}>{l.bedNumber}</span> : <span className="text-muted">—</span>}
                    {!isTechnician && l.technicianName && <small className="d-block text-muted">{l.technicianName}</small>}
                  </td>
                  <td><AppointmentLineBadge status={l.status} /></td>
                  <td className="text-center">
                    <div className="manager-list-actions justify-content-center">
                      {isTechnician && l.status === "Waiting" && (l.canStart === false ? (
                        <small className="text-muted d-inline-block text-start" style={{ maxWidth: 220 }}>
                          <i className="bi bi-hourglass-split me-1" />{l.startNote}
                        </small>
                      ) : (
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" disabled={busy === l.appointmentServiceId} onClick={() => act(l, "start")}>
                          <i className="bi bi-play-circle" /> Start
                        </Button>
                      ))}
                      {isTechnician && l.status === "InProgress" && (
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" disabled={busy === l.appointmentServiceId} onClick={() => act(l, "done")}>
                          <i className="bi bi-check2-circle" /> Complete
                        </Button>
                      )}
                      {l.status === "Done" && (
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--view" onClick={() => setOutcome(l)}>
                          <i className="bi bi-journal-medical" /> Notes
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))) : (
                <tr><td colSpan={6} className="text-center text-muted py-4">There are no services on the selected day.</td></tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <OutcomeModal
        line={outcome}
        canEdit={isTechnician}
        onClose={() => setOutcome(null)}
        onSaved={(m) => { setOutcome(null); setNotice(m); load(); }}
      />
    </Container>
  );
}
