import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge, Button, Card, Container, Form, Modal, Nav, Spinner, Table } from "react-bootstrap";
import AppointmentStatusBadge from "../../../components/AppointmentStatusBadge";
import { api, put, today, time5, viDate, label } from "../../../services/api";
import FloatingAlert from "../../../components/FloatingAlert";

function AssignmentModal({ appointmentId, mode, onClose, onDone }) {
  const [plan, setPlan] = useState(null);
  const [choice, setChoice] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!appointmentId) return;
    setPlan(null);
    setError("");
    const url = mode === "checkin" ? `/api/booking/coordination?appointmentId=${appointmentId}` : `/api/booking/affected?appointmentId=${appointmentId}`;
    api(url)
      .then((data) => {
        setPlan(data);
        setChoice(Object.fromEntries((data.lines || []).map((l) => [l.appointmentServiceId, {
          technicianId: String(l.technicianId ?? l.suggestedTechnicianId ?? ""),
          bedId: String(l.bedId ?? l.suggestedBedId ?? l.bedOptions?.[0]?.bedId ?? ""),
        }])));
      })
      .catch((e) => setError(e.message));
  }, [appointmentId, mode]);

  const set = (lineId, patch) => setChoice((c) => ({ ...c, [lineId]: { ...c[lineId], ...patch } }));
  const setTechnician = (line, value) => {
    const next = { ...choice };
    (plan.lines || []).filter((l) => l.part === line.part).forEach((l) => { next[l.appointmentServiceId] = { ...next[l.appointmentServiceId], technicianId: value }; });
    setChoice(next);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const assignments = Object.entries(choice).map(([lineId, c]) => ({
        appointmentServiceId: Number(lineId),
        technicianId: c.technicianId ? Number(c.technicianId) : null,
        bedId: c.bedId ? Number(c.bedId) : null,
      }));
      const r = await put(mode === "checkin" ? "/api/booking/checkin" : "/api/booking/coordinate", { appointmentId, assignments });
      onDone(r.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={!!appointmentId} onHide={() => !saving && onClose()} size="lg" centered>
      <Modal.Header closeButton={!saving}>
        <Modal.Title>{mode === "checkin" ? "Check-in & assignment" : "Reassign"} · Appointment #{appointmentId}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <FloatingAlert message={error} onClose={() => setError("")} />
        {!plan && !error && <div className="text-center py-4"><Spinner animation="border" variant="danger" /></div>}
        {plan && (
          <>
            {plan.customerName && (
              <p className="mb-3"><strong>{plan.customerName}</strong> · {plan.customerPhone} · {time5(plan.startTime)}–{time5(plan.endTime)}</p>
            )}
            <Table responsive className="align-middle manager-list-table">
              <thead className="table-light">
                <tr><th>Service</th><th>Time</th><th>Technician</th><th>Bed</th></tr>
              </thead>
              <tbody>
                {plan.lines.map((l) => (
                  <tr key={l.appointmentServiceId}>
                    <td className="fw-semibold">{l.serviceName}<small className="d-block text-muted">Part {l.part} · {label(l.requiredRoomType)} · {l.tourCount} tour</small></td>
                    <td>{time5(l.startTime)}–{time5(l.endTime)}</td>
                    <td>
                      <Form.Select size="sm" value={choice[l.appointmentServiceId]?.technicianId || ""} onChange={(e) => setTechnician(l, e.target.value)}>
                        <option value="">-- Select technician --</option>
                        {(l.technicianOptions || []).map((t) => (
                          <option key={t.staffId} value={t.staffId}>{t.fullName}{t.staffId === l.suggestedTechnicianId ? " (suggested by tour)" : ""}</option>
                        ))}
                      </Form.Select>
                      {!(l.technicianOptions || []).length && <small className="text-danger">No technician available</small>}
                    </td>
                    <td>
                      <Form.Select size="sm" value={choice[l.appointmentServiceId]?.bedId || ""} onChange={(e) => set(l.appointmentServiceId, { bedId: e.target.value })}>
                        <option value="">-- Select bed --</option>
                        {l.bedId && !(l.bedOptions || []).some((b) => b.bedId === l.bedId) && <option value={l.bedId}>Current bed</option>}
                        {(l.bedOptions || []).map((b) => <option key={b.bedId} value={b.bedId}>{b.roomName} · {b.bedNumber}</option>)}
                      </Form.Select>
                      {!(l.bedOptions || []).length && !l.bedId && <small className="text-danger">No beds available</small>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <small className="text-muted">Appointments with 3–4 services are split into 2 parts; each part is handled by one technician. Technicians are suggested by the fewest tours of the day.</small>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose} disabled={saving}>Close</Button>
        <Button onClick={save} disabled={saving || !plan}>{saving ? "Saving..." : mode === "checkin" ? "Check-in" : "Save assignment"}</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default function ReceptionistBookingDesk({ user }) {
  const canAct = ["Receptionist", "Manager"].includes(user?.role || "Receptionist");
  // Receptionists and managers (who inherit every receptionist function) share one merged page
  const overview = canAct;
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") || "arrivals");
  const [appointments, setAppointments] = useState([]);
  const [listFilter, setListFilter] = useState("action");
  const [date, setDate] = useState(today());
  const [board, setBoard] = useState(null);
  const [affected, setAffected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(params.get("appointmentId") ? { id: Number(params.get("appointmentId")), mode: "checkin" } : null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, a, all] = await Promise.all([
        api(`/api/booking/coordination?date=${date}`),
        api("/api/booking/affected"),
        overview ? api("/api/appointments") : Promise.resolve([]),
      ]);
      setBoard(b);
      setAffected(a || []);
      setAppointments(Array.isArray(all) ? all : []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [date, overview]);
  useEffect(() => { load(); }, [load]);

  const quick = async (id, path, message) => {
    setBusy(id);
    try {
      await put(`/api/appointments/${id}/${path}`, {});
      setNotice(message);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const closeModal = () => {
    setModal(null);
    if (params.get("appointmentId")) setParams({}, { replace: true });
  };
  const affectedIds = [...new Set(affected.map((r) => r.appointmentId))];
  const isToday = date === today();

  // Overview data: every appointment of the chosen day, with the reception flags merged in
  const arrivalsById = new Map((board?.arrivals || []).map((a) => [a.appointmentId, a]));
  const dayRows = overview
    ? appointments
        .filter((a) => String(a.appointmentDate).slice(0, 10) === date)
        .map((a) => ({ ...a, ...(arrivalsById.get(a.appointmentId) || {}), needsAction: arrivalsById.has(a.appointmentId) }))
        .sort((x, y) => String(x.startTime).localeCompare(String(y.startTime)))
    : (board?.arrivals || []).map((a) => ({ ...a, needsAction: true }));
  const actionRows = dayRows.filter((a) => a.needsAction);
  const shownRows = overview && listFilter === "all" ? dayRows : actionRows;
  const upcomingPending = overview
    ? appointments
        .filter((a) => a.status === "Pending" && String(a.appointmentDate).slice(0, 10) > today())
        .sort((x, y) => String(x.appointmentDate).localeCompare(String(y.appointmentDate)) || String(x.startTime).localeCompare(String(y.startTime)))
    : [];
  const metrics = [
    ["calendar2-week", isToday ? "Today’s appointments" : "Appointments", dayRows.length],
    ["clock", "Pending", dayRows.filter((a) => a.status === "Pending").length],
    ["activity", "In progress", dayRows.filter((a) => a.status === "In-progress" || a.status === "Checked-in").length],
    ["check2-circle", "Completed", dayRows.filter((a) => a.status === "Completed").length],
  ];

  const actionButtons = (a, dateOfRow = date) => (
    <div className="manager-list-actions justify-content-center">
      {canAct && a.status === "Pending" && a.canConfirm !== false && (
        <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" disabled={busy === a.appointmentId}
          onClick={() => quick(a.appointmentId, "confirm", `Confirmed appointment #${a.appointmentId}.`)}>
          <i className="bi bi-check2-circle" aria-hidden="true" /> Confirm
        </Button>
      )}
      {canAct && a.needsAction && a.status === "Confirmed" && dateOfRow === today() && a.canCheckIn !== false && (
        <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" onClick={() => setModal({ id: a.appointmentId, mode: "checkin" })}>
          <i className="bi bi-door-open" aria-hidden="true" /> Check-in
        </Button>
      )}
      {canAct && a.needsAction && a.status === "Confirmed" && a.canNoShow === true && (
        <Button variant="link" size="sm" className="manager-list-action manager-list-action--delete" disabled={busy === a.appointmentId}
          onClick={() => quick(a.appointmentId, "no-show", `Marked appointment #${a.appointmentId} no-show.`)}>
          <i className="bi bi-person-x" aria-hidden="true" /> No-show
        </Button>
      )}
      <Button variant="link" size="sm" className="manager-list-action manager-list-action--view" onClick={() => navigate(`/appointments/${a.appointmentId}`)}>
        <i className="bi bi-eye" aria-hidden="true" /> View
      </Button>
    </div>
  );

  return (
    <Container fluid className="mt-4 px-4 desk-page">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="manager-page-title fw-bold mb-1">{overview ? "Receptionist overview" : "Staff coordination"}</h2>
          <p className="text-muted mb-0">
            {overview
              ? "Receive customers, check them in, assign technicians and beds, and handle affected appointments."
              : "Assign technicians and beds, and handle affected appointments."}
          </p>
        </div>
        <div className="desk-toolbar">
          <Form.Control type="date" aria-label="Day" value={date} onChange={(e) => setDate(e.target.value)} className="desk-date" />
          <Button variant="outline-primary" className="desk-btn" onClick={load} disabled={loading}>
            <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Refresh
          </Button>
          {canAct && (
            <Button variant="primary" className="desk-btn" onClick={() => navigate("/appointments/create")}>
              <i className="bi bi-calendar-plus" aria-hidden="true" /> Book
            </Button>
          )}
        </div>
      </div>

      {overview && (
        <div className="staff-metrics mb-4" aria-label="Day statistics" aria-busy={loading}>
          {metrics.map(([icon, text, value]) => (
            <article className="staff-metric" key={text}>
              <i className={`bi bi-${icon}`} aria-hidden="true" />
              <span>{text}</span>
              <strong>{loading && !board ? "—" : value}</strong>
            </article>
          ))}
        </div>
      )}
      <FloatingAlert message={error} onClose={() => setError("")} />
      <FloatingAlert message={notice} variant="success" onClose={() => setNotice("")} />

      <Nav variant="tabs" activeKey={tab} onSelect={(k) => setTab(k)} className="mb-3">
        <Nav.Item><Nav.Link eventKey="arrivals">{overview ? `Appointments (${dayRows.length})` : `Reception (${actionRows.length})`}</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="board">Technician coordination board</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="affected">Affected appointments {affectedIds.length > 0 && <Badge bg="danger">{affectedIds.length}</Badge>}</Nav.Link></Nav.Item>
        {overview && (
          <Nav.Item><Nav.Link eventKey="upcoming">Upcoming pending {upcomingPending.length > 0 && <Badge bg="warning" text="dark">{upcomingPending.length}</Badge>}</Nav.Link></Nav.Item>
        )}
      </Nav>

      {loading && !board ? (
        <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div>
      ) : tab === "arrivals" ? (
        <>
        {overview && (
          <div className="desk-filter" role="group" aria-label="Show appointments">
            <button type="button" className={listFilter === "action" ? "active" : ""} aria-pressed={listFilter === "action"} onClick={() => setListFilter("action")}>
              Needs action <span>{actionRows.length}</span>
            </button>
            <button type="button" className={listFilter === "all" ? "active" : ""} aria-pressed={listFilter === "all"} onClick={() => setListFilter("all")}>
              All <span>{dayRows.length}</span>
            </button>
          </div>
        )}
        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            <Table hover responsive className="align-middle mb-0 manager-list-table">
              <thead className="table-dark"><tr><th>Time</th><th>Customer</th><th>Service</th><th>Status</th><th className="text-center">Actions</th></tr></thead>
              <tbody>
                {shownRows.map((a) => (
                  <tr key={a.appointmentId}>
                    <td className="fw-bold">{time5(a.startTime)}–{time5(a.endTime)}</td>
                    <td>{a.customerName}<small className="d-block text-muted">{a.customerPhone}</small></td>
                    <td>{a.serviceNames}{a.technicianNames && <small className="d-block text-muted">{a.technicianNames}</small>}</td>
                    <td>
                      <AppointmentStatusBadge status={a.status} />
                      {a.timingNote && <small className={`d-block mt-1 ${/Confirmation deadline passed|More than 15 minutes late/.test(a.timingNote) ? "text-danger fw-semibold" : "text-muted"}`}>{a.timingNote}</small>}
                    </td>
                    <td className="text-center">{actionButtons(a)}</td>
                  </tr>
                ))}
                {!shownRows.length && (
                  <tr><td colSpan={5} className="text-center text-muted py-4">
                    {overview && listFilter === "action" && dayRows.length
                      ? "Nothing needs action right now."
                      : `No appointments on ${viDate(date)}.`}
                  </td></tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
        </>
      ) : tab === "board" ? (
        <>
          <p className="text-muted">Tour difference between technicians today: <strong>{board?.tourGap ?? 0}</strong> tours. The technician with the fewest tours gets priority for the next turn.</p>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              <Table responsive className="align-middle mb-0 manager-list-table">
                <thead className="table-dark"><tr><th>Technician</th><th>Shift</th><th>Counted tours</th><th>Tours done</th><th>Requested tours</th><th>Services today</th></tr></thead>
                <tbody>
                  {(board?.technicians || []).map((t) => {
                    const mine = (board.lines || []).filter((l) => l.technicianId === t.staffId);
                    return (
                      <tr key={t.staffId}>
                        <td className="fw-bold">{t.fullName}{t.onLeave ? <Badge bg="warning" text="dark" className="ms-1">Leave</Badge> : null}</td>
                        <td>{t.shiftType ? label(t.shiftType) : <span className="text-muted">No shift</span>}</td>
                        <td>{Number(t.countedTours || 0)}</td>
                        <td>{Number(t.actualTours || 0)}</td>
                        <td>{Number(t.requestedTours || 0)}</td>
                        <td>
                          {mine.length ? mine.map((l) => (
                            <Badge key={l.appointmentServiceId} bg={l.status === "Done" ? "success" : l.status === "InProgress" ? "primary" : "secondary"} className="me-1 mb-1">
                              {time5(l.startTime)} {l.serviceName} · {l.customerName}
                            </Badge>
                          )) : <span className="text-muted">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      ) : tab === "upcoming" ? (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            <Table hover responsive className="align-middle mb-0 manager-list-table">
              <thead className="table-dark"><tr><th>Date & time</th><th>Customer</th><th>Service</th><th>Status</th><th className="text-center">Actions</th></tr></thead>
              <tbody>
                {upcomingPending.map((a) => (
                  <tr key={a.appointmentId}>
                    <td className="fw-bold">{viDate(a.appointmentDate)}<small className="d-block text-muted">{time5(a.startTime)}–{time5(a.endTime)}</small></td>
                    <td>{a.customerName}</td>
                    <td>{a.serviceNames}{a.technicianNames && <small className="d-block text-muted">{a.technicianNames}</small>}</td>
                    <td><AppointmentStatusBadge status={a.status} /></td>
                    <td className="text-center">{actionButtons(a, String(a.appointmentDate).slice(0, 10))}</td>
                  </tr>
                ))}
                {!upcomingPending.length && <tr><td colSpan={5} className="text-center text-muted py-4">No upcoming appointments waiting to be confirmed.</td></tr>}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            <Table hover responsive className="align-middle mb-0 manager-list-table">
              <thead className="table-dark"><tr><th>Schedule</th><th>Date & time</th><th>Customer</th><th>Service</th><th>Current assignment</th><th>Reason</th><th className="text-center">Actions</th></tr></thead>
              <tbody>
                {affected.map((r) => (
                  <tr key={r.appointmentServiceId}>
                    <td className="fw-bold">#{r.appointmentId}</td>
                    <td>{viDate(r.appointmentDate)}<small className="d-block text-muted">{time5(r.lineStart)}–{time5(r.lineEnd)}</small></td>
                    <td>{r.customerName}<small className="d-block text-muted">{r.customerPhone}</small></td>
                    <td>{r.serviceName}</td>
                    <td>{r.technicianName || "—"}{r.roomName ? ` · ${r.roomName} ${r.bedNumber}` : ""}</td>
                    <td><Badge bg="danger">{r.reason}</Badge></td>
                    <td className="text-center">{canAct ? (
                      <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" onClick={() => setModal({ id: r.appointmentId, mode: "coordinate" })}>
                        <i className="bi bi-arrow-left-right" aria-hidden="true" /> Reassign
                      </Button>
                    ) : <small className="text-muted">Assigned by receptionist</small>}</td>
                  </tr>
                ))}
                {!affected.length && <tr><td colSpan={7} className="text-center text-muted py-4">No appointments are affected by leave or maintenance.</td></tr>}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <AssignmentModal
        appointmentId={modal?.id}
        mode={modal?.mode}
        onClose={closeModal}
        onDone={(message) => { closeModal(); setNotice(message); load(); }}
      />
    </Container>
  );
}
