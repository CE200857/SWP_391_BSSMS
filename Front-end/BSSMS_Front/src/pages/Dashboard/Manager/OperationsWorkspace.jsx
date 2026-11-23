import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Form, Modal, Nav, Row, Spinner, Table } from "react-bootstrap";
import { api, post, today, addDays, viDate, time5, label } from "../../../services/api";
import FloatingAlert from "../../../components/FloatingAlert";

const SHIFT_TYPES = ["Morning", "Afternoon", "FullDay"];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const leaveBg = { Pending: "warning", Approved: "success", Rejected: "danger", Cancelled: "secondary" };
const mondayOf = (iso) => {
  const d = new Date(iso + "T00:00:00Z");
  const offset = (d.getUTCDay() + 6) % 7;
  return addDays(iso, -offset);
};
const shiftShort = { Morning: "Morning", Afternoon: "Afternoon", FullDay: "Full day" };

function useOperations(kind, date) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(`/api/operations/${kind}${date ? `?date=${date}` : ""}`));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [kind, date]);
  useEffect(() => { load(); }, [load]);
  return { data, error, loading, load, setError };
}

function WeekPicker({ week, setWeek }) {
  return (
    <div className="d-flex gap-2 align-items-center">
      <Button variant="outline-secondary" onClick={() => setWeek(addDays(week, -7))}><i className="bi bi-chevron-left" /></Button>
      <strong>{viDate(week)} – {viDate(addDays(week, 6))}</strong>
      <Button variant="outline-secondary" onClick={() => setWeek(addDays(week, 7))}><i className="bi bi-chevron-right" /></Button>
      <Button variant="link" onClick={() => setWeek(mondayOf(today()))}>This week</Button>
    </div>
  );
}

function Scheduling() {
  const [week, setWeek] = useState(mondayOf(today()));
  const [tab, setTab] = useState("shifts");
  const { data, error, loading, load, setError } = useOperations("scheduling", week);
  const [notice, setNotice] = useState("");
  const [create, setCreate] = useState(null);
  const [edit, setEdit] = useState(null);
  const [skills, setSkills] = useState(null);
  const [busy, setBusy] = useState(false);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week, i)), [week]);

  const write = async (body, after) => {
    setBusy(true);
    try {
      const r = await post("/api/operations/scheduling", body);
      setNotice(r.message);
      after?.();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const shiftOf = (staffId, day) => (data?.shifts || []).find((s) => s.staffId === staffId && String(s.shiftDate).slice(0, 10) === day);
  const onLeave = (staffId, day) => (data?.leaves || []).some((l) => l.staffId === staffId && String(l.startDate).slice(0, 10) <= day && String(l.endDate).slice(0, 10) >= day);
  const skillIds = (staffId) => (data?.skills || []).filter((s) => s.staffId === staffId).map((s) => s.serviceId);
  const technicians = (data?.staff || []).filter((s) => s.role === "Technician");

  const staff = data?.staff || [];
  const groups = [
    ["Technicians", staff.filter((x) => x.role === "Technician")],
    ["Receptionists", staff.filter((x) => x.role === "Receptionist")],
    ["Managers", staff.filter((x) => x.role === "Manager")],
  ].filter(([, list]) => list.length);
  const onDuty = (d) => staff.filter((x) => shiftOf(x.staffId, d) && !onLeave(x.staffId, d)).length;
  const initial = (name = "") => name.trim().split(/\s+/).slice(-1)[0]?.[0]?.toUpperCase() || "?";
  const isThisWeek = week === mondayOf(today());

  return (
    <div className="ss-page">
      <section className="ms-card ss-toolbar">
        <div className="desk-filter mb-0" role="tablist" aria-label="View">
          <button type="button" role="tab" aria-selected={tab === "shifts"} className={tab === "shifts" ? "active" : ""} onClick={() => setTab("shifts")}>
            <i className="bi bi-calendar-week me-1" aria-hidden="true" /> Weekly shifts
          </button>
          <button type="button" role="tab" aria-selected={tab === "skills"} className={tab === "skills" ? "active" : ""} onClick={() => setTab("skills")}>
            <i className="bi bi-stars me-1" aria-hidden="true" /> Technician skills
          </button>
        </div>
        {tab === "shifts" && (
          <>
            <div className="ms-week-nav">
              <button type="button" className="ms-icon-btn" aria-label="Previous week" onClick={() => setWeek(addDays(week, -7))}><i className="bi bi-chevron-left" aria-hidden="true" /></button>
              <strong>{viDate(week).slice(0, 5)} – {viDate(addDays(week, 6))}</strong>
              <button type="button" className="ms-icon-btn" aria-label="Next week" onClick={() => setWeek(addDays(week, 7))}><i className="bi bi-chevron-right" aria-hidden="true" /></button>
              {!isThisWeek && <button type="button" className="ms-pill-btn" onClick={() => setWeek(mondayOf(today()))}>This week</button>}
            </div>
            <div className="ss-actions">
              <Button variant="outline-primary" className="desk-btn" disabled={busy} onClick={() => write({ action: "copyWeek", fromDate: week, toDate: addDays(week, 7) })}>
                <i className="bi bi-files" aria-hidden="true" /> Copy to next week
              </Button>
              <Button className="desk-btn" onClick={() => setCreate({ staffIds: [], dates: [], shiftType: "FullDay" })}>
                <i className="bi bi-plus-lg" aria-hidden="true" /> Assign shifts
              </Button>
            </div>
          </>
        )}
      </section>
      <FloatingAlert message={error} onClose={() => setError("")} />
      <FloatingAlert message={notice} variant="success" onClose={() => setNotice("")} />

      {loading && !data ? <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div> : tab === "shifts" ? (
        <section className="ms-card p-0 overflow-hidden">
          <div className="ss-legend">
            <span className="ss-chip ss-chip--FullDay">Full day</span>
            <span className="ss-chip ss-chip--Morning">Morning</span>
            <span className="ss-chip ss-chip--Afternoon">Afternoon</span>
            <span className="ss-chip ss-chip--leave">On leave</span>
            <small>Click a shift to change it, or an empty cell to add one.</small>
          </div>
          <div className="table-responsive">
            <table className="ss-table">
              <thead>
                <tr>
                  <th className="ss-staff-col">Staff</th>
                  {days.map((d, i) => (
                    <th key={d} className={d === today() ? "is-today" : undefined}>
                      <span>{WEEKDAYS[i].slice(0, 3)}</span>
                      <strong>{viDate(d).slice(0, 5)}</strong>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map(([title, list]) => (
                  <Fragment key={title}>
                    <tr className="ss-group"><td colSpan={8}>{title} <span>{list.length}</span></td></tr>
                    {list.map((x) => (
                      <tr key={x.staffId}>
                        <td className="ss-staff-col"><div className="ss-staff">
                          <span className="ctp-avatar" aria-hidden="true">{initial(x.fullName)}</span>
                          <strong>{x.fullName}</strong>
                        </div></td>
                        {days.map((d) => {
                          const shift = shiftOf(x.staffId, d);
                          const past = d < today();
                          const cls = d === today() ? "is-today" : undefined;
                          if (onLeave(x.staffId, d)) return <td key={d} className={cls}><span className="ss-chip ss-chip--leave">On leave</span></td>;
                          if (past) return <td key={d} className={cls}>{shift ? <span className={`ss-chip ss-chip--${shift.shiftType} is-past`}>{shiftShort[shift.shiftType]}</span> : <span className="ss-none">—</span>}</td>;
                          return (
                            <td key={d} className={cls}>
                              {shift ? (
                                <button type="button" className={`ss-chip ss-chip--${shift.shiftType}`} onClick={() => setEdit({ ...shift, shiftType: shift.shiftType })} aria-label={`${x.fullName}, ${viDate(d)}: ${shiftShort[shift.shiftType]}. Change`}>
                                  {shiftShort[shift.shiftType]}
                                  {shift.startTime && <small>{time5(shift.startTime)}–{time5(shift.endTime)}</small>}
                                </button>
                              ) : (
                                <button type="button" className="ss-add" aria-label={`Add a shift for ${x.fullName} on ${viDate(d)}`} onClick={() => setCreate({ staffIds: [x.staffId], dates: [d], shiftType: "FullDay" })}>
                                  <i className="bi bi-plus-lg" aria-hidden="true" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="ss-staff-col">On duty</td>
                  {days.map((d) => <td key={d} className={d === today() ? "is-today" : undefined}><strong>{onDuty(d)}</strong> / {staff.length}</td>)}
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      ) : (
        <section className="ms-card">
          <header className="ms-card-head"><h4>Technician skills</h4><span>{technicians.length}</span></header>
          <div className="ss-skills">
            {technicians.map((t) => {
              const mine = (data?.skills || []).filter((x) => x.staffId === t.staffId);
              return (
                <article key={t.staffId} className="ss-skill">
                  <div className="ss-skill-head">
                    <span className="ctp-avatar" aria-hidden="true">{initial(t.fullName)}</span>
                    <div><strong>{t.fullName}</strong><small>{mine.length} service{mine.length === 1 ? "" : "s"}</small></div>
                    <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit ms-auto" onClick={() => setSkills({ staffId: t.staffId, fullName: t.fullName, serviceIds: skillIds(t.staffId) })}>
                      <i className="bi bi-pencil-square" aria-hidden="true" /> Edit
                    </Button>
                  </div>
                  <div className="ss-skill-tags">
                    {mine.length ? mine.map((x) => <span key={x.serviceId}>{x.serviceName}</span>) : <em>No skills yet</em>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <Modal show={!!create} onHide={() => setCreate(null)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Assign shifts</Modal.Title></Modal.Header>
        {create && (
          <Modal.Body>
            <Form.Label className="fw-bold">Shift type</Form.Label>
            <div className="d-flex gap-3 mb-3">
              {SHIFT_TYPES.map((t) => <Form.Check key={t} type="radio" id={`st-${t}`} label={label(t)} checked={create.shiftType === t} onChange={() => setCreate({ ...create, shiftType: t })} />)}
            </div>
            <Row>
              <Col md={6}>
                <Form.Label className="fw-bold">Staff</Form.Label>
                {(data?.staff || []).map((s) => (
                  <Form.Check key={s.staffId} id={`cs-${s.staffId}`} label={s.fullName} checked={create.staffIds.includes(s.staffId)}
                    onChange={() => setCreate({ ...create, staffIds: create.staffIds.includes(s.staffId) ? create.staffIds.filter((x) => x !== s.staffId) : [...create.staffIds, s.staffId] })} />
                ))}
              </Col>
              <Col md={6}>
                <Form.Label className="fw-bold">Day of week</Form.Label>
                {days.map((d, i) => (
                  <Form.Check key={d} id={`cd-${d}`} label={`${WEEKDAYS[i]} ${viDate(d)}${d < today() ? " (past)" : ""}`} disabled={d < today()} checked={create.dates.includes(d)}
                    onChange={() => setCreate({ ...create, dates: create.dates.includes(d) ? create.dates.filter((x) => x !== d) : [...create.dates, d] })} />
                ))}
              </Col>
            </Row>
            <small className="text-muted">Days that already have a shift or approved leave are skipped. Each staff member has at most 1 shift per day.</small>
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setCreate(null)}>Cancel</Button>
          <Button disabled={busy || !create?.staffIds.length || !create?.dates.length} onClick={() => write({ action: "createShifts", ...create }, () => setCreate(null))}>Create shift</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={!!edit} onHide={() => setEdit(null)} centered>
        <Modal.Header closeButton><Modal.Title>Shifts · {edit?.fullName} · {viDate(edit?.shiftDate)}</Modal.Title></Modal.Header>
        {edit && (
          <Modal.Body>
            {SHIFT_TYPES.map((t) => <Form.Check key={t} type="radio" id={`et-${t}`} label={label(t)} checked={edit.shiftType === t} onChange={() => setEdit({ ...edit, shiftType: t })} />)}
            <small className="text-muted d-block mt-2">If an assigned service falls outside the new shift, the appointment will appear under "Affected appointments" for the receptionist to reassign.</small>
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="outline-danger" disabled={busy} onClick={() => write({ action: "deleteShift", id: edit.staffShiftId }, () => setEdit(null))}>Delete shift</Button>
          <Button disabled={busy} onClick={() => write({ action: "updateShift", id: edit.staffShiftId, shiftType: edit.shiftType }, () => setEdit(null))}>Save</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={!!skills} onHide={() => setSkills(null)} centered>
        <Modal.Header closeButton><Modal.Title>Skills · {skills?.fullName}</Modal.Title></Modal.Header>
        {skills && (
          <Modal.Body style={{ maxHeight: 400, overflowY: "auto" }}>
            {(data?.services || []).map((s) => (
              <Form.Check key={s.serviceId} id={`sk-${s.serviceId}`} label={s.serviceName} checked={skills.serviceIds.includes(s.serviceId)}
                onChange={() => setSkills({ ...skills, serviceIds: skills.serviceIds.includes(s.serviceId) ? skills.serviceIds.filter((x) => x !== s.serviceId) : [...skills.serviceIds, s.serviceId] })} />
            ))}
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setSkills(null)}>Cancel</Button>
          <Button disabled={busy} onClick={() => write({ action: "saveSkills", staffId: skills.staffId, serviceIds: skills.serviceIds }, () => setSkills(null))}>Save skills</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function LeaveApprovals() {
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

function TourReport() {
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

function MySchedule() {
  const [week, setWeek] = useState(mondayOf(today()));
  const { data, error, loading, load, setError } = useOperations("my-schedule", week);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ startDate: "", endDate: "", reason: "" });
  // Ngày nghỉ sớm nhất do back-end tính: thứ 2 ngay sau thứ 6 gần nhất (thứ 6 + 3 ngày)
  const earliest = data?.leaveRule?.earliestStartDate || addDays(today(), 1);
  const startDate = form.startDate || earliest;
  const endDate = form.endDate && form.endDate >= startDate ? form.endDate : startDate;
  const [busy, setBusy] = useState(false);
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));

  const send = async (body) => {
    setBusy(true);
    try {
      const r = await post("/api/operations/leaves", body);
      setNotice(r.message);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const leaves = data?.leaves || [];
  const onLeave = (d) => leaves.some((l) => l.status === "Approved" && String(l.startDate).slice(0, 10) <= d && String(l.endDate).slice(0, 10) >= d);
  const shiftOf = (d) => (data?.shifts || []).find((s) => String(s.shiftDate).slice(0, 10) === d);
  const workDays = days.filter((d) => shiftOf(d) && !onLeave(d)).length;
  const dayCount = (a, b) => Math.round((new Date(`${String(b).slice(0, 10)}T00:00:00Z`) - new Date(`${String(a).slice(0, 10)}T00:00:00Z`)) / 86400000) + 1;
  const isThisWeek = week === mondayOf(today());

  return (
    <div className="ms-page">
      <FloatingAlert message={error} onClose={() => setError("")} />
      <FloatingAlert message={notice} variant="success" onClose={() => setNotice("")} />

      <section className="ms-card">
        <div className="ms-week-bar">
          <div className="ms-week-nav">
            <button type="button" className="ms-icon-btn" aria-label="Previous week" onClick={() => setWeek(addDays(week, -7))}><i className="bi bi-chevron-left" aria-hidden="true" /></button>
            <strong>{viDate(week).slice(0, 5)} – {viDate(addDays(week, 6))}</strong>
            <button type="button" className="ms-icon-btn" aria-label="Next week" onClick={() => setWeek(addDays(week, 7))}><i className="bi bi-chevron-right" aria-hidden="true" /></button>
            {!isThisWeek && <button type="button" className="ms-pill-btn" onClick={() => setWeek(mondayOf(today()))}>This week</button>}
          </div>
          <span className="ms-week-sum">
            {loading ? <Spinner size="sm" animation="border" /> : <><strong>{workDays}</strong> working day{workDays === 1 ? "" : "s"} · {7 - workDays} off</>}
          </span>
        </div>

        <div className="ms-days">
          {days.map((d, i) => {
            const shift = shiftOf(d);
            const leave = onLeave(d);
            const state = leave ? "leave" : shift ? shift.shiftType : "off";
            return (
              <div key={d} className={`ms-day ms-day--${state}${d === today() ? " is-today" : ""}`}>
                <div className="ms-day-head">
                  <span>{WEEKDAYS[i].slice(0, 3)}</span>
                  <strong>{viDate(d).slice(0, 5)}</strong>
                  {d === today() && <em>Today</em>}
                </div>
                <div className="ms-day-body">
                  <b>{leave ? "On leave" : shift ? shiftShort[shift.shiftType] : "Day off"}</b>
                  {shift && !leave && <small>{time5(shift.startTime)}–{time5(shift.endTime)}</small>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="ms-grid">
        <section className="ms-card">
          <header className="ms-card-head"><h4>Request leave</h4></header>
          <div className="ms-dates">
            <Form.Group controlId="leave-from">
              <Form.Label>From</Form.Label>
              <Form.Control type="date" min={earliest} value={startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Form.Group>
            <Form.Group controlId="leave-to">
              <Form.Label>To</Form.Label>
              <Form.Control type="date" min={startDate} value={endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Form.Group>
          </div>
          <p className="ms-rule">
            <i className="bi bi-info-circle" aria-hidden="true" />
            <span>Leave can start from <strong>{viDate(earliest)}</strong>. Requests are reviewed on Fridays, and only one person can be off per day.</span>
          </p>
          <Form.Group controlId="leave-reason">
            <Form.Label>Reason *</Form.Label>
            <Form.Control as="textarea" rows={3} maxLength={500} placeholder="e.g. Family event" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            <Form.Text className="d-flex justify-content-between">
              <span>At least 5 characters.</span>
              <span>{form.reason.length}/500</span>
            </Form.Text>
          </Form.Group>
          <Button className="ms-submit" disabled={busy || form.reason.trim().length < 5} onClick={() => send({ action: "request", startDate, endDate, reason: form.reason.trim() || null })}>
            <i className="bi bi-send" aria-hidden="true" /> {busy ? "Sending…" : `Send request · ${dayCount(startDate, endDate)} day${dayCount(startDate, endDate) === 1 ? "" : "s"}`}
          </Button>
        </section>

        <section className="ms-card">
          <header className="ms-card-head"><h4>My leave requests</h4><span>{leaves.length}</span></header>
          {leaves.length ? (
            <ul className="ms-leaves">
              {leaves.map((l) => (
                <li key={l.leaveId}>
                  <div className="ms-leave-date">
                    <strong>{viDate(l.startDate)}{String(l.endDate).slice(0, 10) !== String(l.startDate).slice(0, 10) ? ` – ${viDate(l.endDate)}` : ""}</strong>
                    <small>{dayCount(l.startDate, l.endDate)} day{dayCount(l.startDate, l.endDate) === 1 ? "" : "s"}</small>
                  </div>
                  <div className="ms-leave-reason">
                    {l.reason || "—"}
                    {l.decisionNote && <small>Manager: {l.decisionNote}</small>}
                  </div>
                  <div className="ms-leave-side">
                    <span className={`ms-status ms-status--${l.status}`}>{label(l.status)}</span>
                    {l.status === "Pending" && (
                      <button type="button" className="ms-cancel" disabled={busy} onClick={() => send({ action: "cancel", id: l.leaveId })}>Cancel</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="ms-empty"><i className="bi bi-calendar2-heart" aria-hidden="true" /><p>No leave requests yet.</p></div>
          )}
        </section>
      </div>
    </div>
  );
}

const TITLES = {
  scheduling: ["Shifts & skills", "Assign weekly shifts and update the services each technician can perform."],
  leaves: ["Leave approval", "View the affected appointments before approving a leave request."],
  "tour-report": ["Tour report", "Each technician’s tours for the day under the rotation rule."],
  "my-schedule": ["My work schedule", "View this week’s shifts and submit leave requests."],
};

export default function OperationsWorkspace({ kind = "scheduling" }) {
  const [title, subtitle] = TITLES[kind] || TITLES.scheduling;
  return (
    <Container fluid className="mt-4 px-4">
      <h2 className="manager-page-title fw-bold mb-1">{title}</h2>
      <p className="text-muted mb-4">{subtitle}</p>
      {kind === "scheduling" && <Scheduling />}
      {kind === "leaves" && <LeaveApprovals />}
      {kind === "tour-report" && <TourReport />}
      {kind === "my-schedule" && <MySchedule />}
    </Container>
  );
}
