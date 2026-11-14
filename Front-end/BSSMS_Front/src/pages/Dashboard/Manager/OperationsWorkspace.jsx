import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Form, Modal, Nav, Row, Spinner, Table } from "react-bootstrap";
import { api, post, today, addDays, viDate, time5, label } from "../../../services/api";

const SHIFT_TYPES = ["Morning", "Afternoon", "FullDay"];
const WEEKDAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const leaveBg = { Pending: "warning", Approved: "success", Rejected: "danger", Cancelled: "secondary" };
const mondayOf = (iso) => {
  const d = new Date(iso + "T00:00:00Z");
  const offset = (d.getUTCDay() + 6) % 7;
  return addDays(iso, -offset);
};
const shiftShort = { Morning: "Sáng", Afternoon: "Chiều", FullDay: "Cả ngày" };

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
      <Button variant="link" onClick={() => setWeek(mondayOf(today()))}>Tuần này</Button>
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

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <Nav variant="tabs" activeKey={tab} onSelect={setTab}>
          <Nav.Item><Nav.Link eventKey="shifts">Ca làm theo tuần</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="skills">Kỹ năng kỹ thuật viên</Nav.Link></Nav.Item>
        </Nav>
        {tab === "shifts" && (
          <div className="d-flex gap-2 flex-wrap">
            <WeekPicker week={week} setWeek={setWeek} />
            <Button variant="outline-primary" disabled={busy} onClick={() => write({ action: "copyWeek", fromDate: week, toDate: addDays(week, 7) })}>
              <i className="bi bi-files" /> Sao chép sang tuần sau
            </Button>
            <Button onClick={() => setCreate({ staffIds: [], dates: [], shiftType: "FullDay" })}><i className="bi bi-plus-lg" /> Phân ca</Button>
          </div>
        )}
      </div>
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {notice && <Alert variant="success" dismissible onClose={() => setNotice("")}>{notice}</Alert>}
      {loading && !data ? <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div> : tab === "shifts" ? (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            <Table bordered responsive className="align-middle mb-0 manager-list-table text-center">
              <thead className="table-dark">
                <tr><th className="text-start">Nhân viên</th>{days.map((d, i) => <th key={d}>{WEEKDAYS[i]}<small className="d-block fw-normal">{viDate(d).slice(0, 5)}</small></th>)}</tr>
              </thead>
              <tbody>
                {(data?.staff || []).map((s) => (
                  <tr key={s.staffId}>
                    <td className="text-start fw-semibold">{s.fullName}<small className="d-block text-muted fw-normal">{s.role === "Technician" ? "Kỹ thuật viên" : "Lễ tân"}</small></td>
                    {days.map((d) => {
                      const shift = shiftOf(s.staffId, d);
                      const past = d < today();
                      if (past) return <td key={d} className="text-muted">{shift ? <Badge bg="light" text="dark">{shiftShort[shift.shiftType]}</Badge> : "—"}</td>;
                      if (onLeave(s.staffId, d)) return <td key={d}><Badge bg="warning" text="dark">Nghỉ phép</Badge></td>;
                      return (
                        <td key={d}>
                          {shift ? (
                            <Button size="sm" variant={shift.shiftType === "FullDay" ? "primary" : "outline-primary"} onClick={() => setEdit({ ...shift, shiftType: shift.shiftType })}>
                              {shiftShort[shift.shiftType]}
                            </Button>
                          ) : (
                            <Button size="sm" variant="link" className="text-muted" onClick={() => setCreate({ staffIds: [s.staffId], dates: [d], shiftType: "FullDay" })}>+</Button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            <Table hover responsive className="align-middle mb-0 manager-list-table">
              <thead className="table-dark"><tr><th>Kỹ thuật viên</th><th>Dịch vụ thực hiện được</th><th /></tr></thead>
              <tbody>
                {technicians.map((t) => (
                  <tr key={t.staffId}>
                    <td className="fw-semibold">{t.fullName}</td>
                    <td>{(data?.skills || []).filter((x) => x.staffId === t.staffId).map((x) => <Badge key={x.serviceId} bg="info" className="me-1 mb-1">{x.serviceName}</Badge>)}</td>
                    <td><Button size="sm" variant="outline-primary" onClick={() => setSkills({ staffId: t.staffId, fullName: t.fullName, serviceIds: skillIds(t.staffId) })}>Cập nhật</Button></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <Modal show={!!create} onHide={() => setCreate(null)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Phân ca làm</Modal.Title></Modal.Header>
        {create && (
          <Modal.Body>
            <Form.Label className="fw-bold">Loại ca</Form.Label>
            <div className="d-flex gap-3 mb-3">
              {SHIFT_TYPES.map((t) => <Form.Check key={t} type="radio" id={`st-${t}`} label={label(t)} checked={create.shiftType === t} onChange={() => setCreate({ ...create, shiftType: t })} />)}
            </div>
            <Row>
              <Col md={6}>
                <Form.Label className="fw-bold">Nhân viên</Form.Label>
                {(data?.staff || []).map((s) => (
                  <Form.Check key={s.staffId} id={`cs-${s.staffId}`} label={s.fullName} checked={create.staffIds.includes(s.staffId)}
                    onChange={() => setCreate({ ...create, staffIds: create.staffIds.includes(s.staffId) ? create.staffIds.filter((x) => x !== s.staffId) : [...create.staffIds, s.staffId] })} />
                ))}
              </Col>
              <Col md={6}>
                <Form.Label className="fw-bold">Ngày trong tuần</Form.Label>
                {days.map((d, i) => (
                  <Form.Check key={d} id={`cd-${d}`} label={`${WEEKDAYS[i]} ${viDate(d)}${d < today() ? " (đã qua)" : ""}`} disabled={d < today()} checked={create.dates.includes(d)}
                    onChange={() => setCreate({ ...create, dates: create.dates.includes(d) ? create.dates.filter((x) => x !== d) : [...create.dates, d] })} />
                ))}
              </Col>
            </Row>
            <small className="text-muted">Ngày đã có ca hoặc đang nghỉ phép sẽ được bỏ qua. Mỗi nhân viên tối đa 1 ca/ngày.</small>
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setCreate(null)}>Hủy</Button>
          <Button disabled={busy || !create?.staffIds.length || !create?.dates.length} onClick={() => write({ action: "createShifts", ...create }, () => setCreate(null))}>Tạo ca</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={!!edit} onHide={() => setEdit(null)} centered>
        <Modal.Header closeButton><Modal.Title>Ca làm · {edit?.fullName} · {viDate(edit?.shiftDate)}</Modal.Title></Modal.Header>
        {edit && (
          <Modal.Body>
            {SHIFT_TYPES.map((t) => <Form.Check key={t} type="radio" id={`et-${t}`} label={label(t)} checked={edit.shiftType === t} onChange={() => setEdit({ ...edit, shiftType: t })} />)}
            <small className="text-muted d-block mt-2">Nếu có dịch vụ đã giao nằm ngoài ca mới, lịch sẽ xuất hiện trong mục "Lịch bị ảnh hưởng" để lễ tân điều phối.</small>
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="outline-danger" disabled={busy} onClick={() => write({ action: "deleteShift", id: edit.staffShiftId }, () => setEdit(null))}>Xóa ca</Button>
          <Button disabled={busy} onClick={() => write({ action: "updateShift", id: edit.staffShiftId, shiftType: edit.shiftType }, () => setEdit(null))}>Lưu</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={!!skills} onHide={() => setSkills(null)} centered>
        <Modal.Header closeButton><Modal.Title>Kỹ năng · {skills?.fullName}</Modal.Title></Modal.Header>
        {skills && (
          <Modal.Body style={{ maxHeight: 400, overflowY: "auto" }}>
            {(data?.services || []).map((s) => (
              <Form.Check key={s.serviceId} id={`sk-${s.serviceId}`} label={s.serviceName} checked={skills.serviceIds.includes(s.serviceId)}
                onChange={() => setSkills({ ...skills, serviceIds: skills.serviceIds.includes(s.serviceId) ? skills.serviceIds.filter((x) => x !== s.serviceId) : [...skills.serviceIds, s.serviceId] })} />
            ))}
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSkills(null)}>Hủy</Button>
          <Button disabled={busy} onClick={() => write({ action: "saveSkills", staffId: skills.staffId, serviceIds: skills.serviceIds }, () => setSkills(null))}>Lưu kỹ năng</Button>
        </Modal.Footer>
      </Modal>
    </>
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
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {notice && <Alert variant="success" dismissible onClose={() => setNotice("")}>{notice}</Alert>}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table hover responsive className="align-middle mb-0 manager-list-table">
            <thead className="table-dark"><tr><th>Nhân viên</th><th>Thời gian nghỉ</th><th>Lý do</th><th>Lịch đã giao</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-4"><Spinner size="sm" animation="border" /></td></tr> : (data || []).map((l) => (
                <tr key={l.leaveId}>
                  <td className="fw-semibold">{l.fullName}</td>
                  <td>{viDate(l.startDate)} – {viDate(l.endDate)}<small className="d-block text-muted">Gửi {String(l.requestedAt).slice(0, 10)}</small></td>
                  <td>{l.reason || "—"}</td>
                  <td>{Number(l.affectedAppointments) > 0 ? <Badge bg="danger">{l.affectedAppointments} lịch</Badge> : "0"}</td>
                  <td><Badge bg={leaveBg[l.status]}>{label(l.status)}</Badge>{l.decisionNote && <small className="d-block text-muted">{l.decisionNote}</small>}</td>
                  <td>{l.status === "Pending" && <Button size="sm" onClick={() => openDetail(l)}>Xem & duyệt</Button>}</td>
                </tr>
              ))}
              {!loading && !(data || []).length && <tr><td colSpan={6} className="text-center text-muted py-4">Chưa có đơn xin nghỉ.</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={!!detail} onHide={() => !busy && setDetail(null)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Đơn nghỉ · {detail?.leave.fullName}</Modal.Title></Modal.Header>
        {detail && (
          <Modal.Body>
            <p>{viDate(detail.leave.startDate)} – {viDate(detail.leave.endDate)} · {detail.leave.reason || "Không ghi lý do"}</p>
            <h6 className="fw-bold">Lịch hẹn đã giao trong thời gian nghỉ</h6>
            {!detail.appointments ? <Spinner size="sm" animation="border" /> : detail.appointments.length ? (
              <ul>
                {detail.appointments.map((a, i) => <li key={i}>#{a.appointmentId} · {viDate(a.appointmentDate)} {time5(a.startTime)} · {a.customerName} · {a.serviceName}</li>)}
              </ul>
            ) : <p className="text-muted">Không có lịch hẹn nào.</p>}
            <Alert variant="info" className="small">Đơn chỉ được duyệt khi mọi lịch trên đều có KTV thay thế. Sau khi duyệt, ca làm trong thời gian nghỉ bị xóa và lễ tân điều phối lại các lịch.</Alert>
            <Form.Group>
              <Form.Label>Ghi chú quyết định</Form.Label>
              <Form.Control value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            </Form.Group>
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="outline-danger" disabled={busy} onClick={() => decide("Rejected")}>Từ chối</Button>
          {detail?.leave && String(detail.leave.endDate).slice(0, 10) < today()
            ? <small className="text-muted me-auto">Đơn đã qua ngày nghỉ, chỉ có thể từ chối.</small>
            : <Button variant="success" disabled={busy} onClick={() => decide("Approved")}>Duyệt</Button>}
        </Modal.Footer>
      </Modal>
    </>
  );
}

function TourReport() {
  const [date, setDate] = useState(today());
  const { data, error, loading } = useOperations("tour-report", date);
  return (
    <>
      <div className="d-flex gap-3 align-items-center mb-3">
        <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 180 }} />
        <span>Chênh lệch tour (đã tính) giữa KTV: <strong>{data?.gap?.gap ?? 0}</strong></span>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table hover responsive className="align-middle mb-0 manager-list-table">
            <thead className="table-dark"><tr><th>Kỹ thuật viên</th><th>Tour bù đầu ngày</th><th>Tour đã tính</th><th>Tour thực làm</th><th>Tour được yêu cầu</th><th>Lần giao gần nhất</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-4"><Spinner size="sm" animation="border" /></td></tr> : (data?.rows || []).map((r) => (
                <tr key={r.staffId}>
                  <td className="fw-semibold">{r.fullName}</td>
                  <td>{Number(r.startOffsetTours)}</td>
                  <td>{Number(r.countedTours)}</td>
                  <td>{Number(r.actualTours)}</td>
                  <td>{Number(r.requestedTours)}</td>
                  <td>{r.lastAssignedAt ? String(r.lastAssignedAt).slice(11, 16) : "—"}</td>
                </tr>
              ))}
              {!loading && !(data?.rows || []).length && <tr><td colSpan={6} className="text-center text-muted py-4">Chưa có dữ liệu tour trong ngày.</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      <small className="text-muted d-block mt-2">Tour đã tính dùng để xoay vòng giao khách (KTV vào ca muộn được bù bằng tour thấp nhất hiện tại); tour được yêu cầu không làm thay đổi lượt.</small>
    </>
  );
}

function MySchedule() {
  const [week, setWeek] = useState(mondayOf(today()));
  const { data, error, loading, load, setError } = useOperations("my-schedule", week);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ startDate: addDays(today(), 1), endDate: addDays(today(), 1), reason: "" });
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

  return (
    <>
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {notice && <Alert variant="success" dismissible onClose={() => setNotice("")}>{notice}</Alert>}
      <div className="mb-3"><WeekPicker week={week} setWeek={setWeek} /></div>
      <Row className="g-2 mb-4">
        {days.map((d, i) => {
          const shift = (data?.shifts || []).find((s) => String(s.shiftDate).slice(0, 10) === d);
          return (
            <Col key={d} xs={6} md>
              <Card className={`shadow-sm border-0 h-100 ${d === today() ? "border border-primary" : ""}`}>
                <Card.Body className="text-center">
                  <small className="text-muted">{WEEKDAYS[i]} · {viDate(d).slice(0, 5)}</small>
                  <div className="fw-bold mt-1">{shift ? shiftShort[shift.shiftType] : "Nghỉ"}</div>
                  {shift && <small>{time5(shift.startTime)}–{time5(shift.endTime)}</small>}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
      {loading && <Spinner size="sm" animation="border" />}
      <Row className="g-4">
        <Col lg={5}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white fw-bold">Xin nghỉ phép</Card.Header>
            <Card.Body>
              <Row className="g-2">
                <Col><Form.Label>Từ ngày</Form.Label><Form.Control type="date" min={today()} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Col>
                <Col><Form.Label>Đến ngày</Form.Label><Form.Control type="date" min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Col>
              </Row>
              <Form.Label className="mt-2">Lý do</Form.Label>
              <Form.Control as="textarea" rows={2} maxLength={500} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              <Button className="mt-3 w-100" disabled={busy} onClick={() => send({ action: "request", ...form, reason: form.reason.trim() || null })}>Gửi đơn</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={7}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white fw-bold">Đơn nghỉ của tôi</Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="align-middle mb-0 manager-list-table">
                <thead className="table-light"><tr><th>Thời gian</th><th>Lý do</th><th>Trạng thái</th><th /></tr></thead>
                <tbody>
                  {(data?.leaves || []).map((l) => (
                    <tr key={l.leaveId}>
                      <td>{viDate(l.startDate)} – {viDate(l.endDate)}</td>
                      <td>{l.reason || "—"}{l.decisionNote && <small className="d-block text-muted">Quản lý: {l.decisionNote}</small>}</td>
                      <td><Badge bg={leaveBg[l.status]}>{label(l.status)}</Badge></td>
                      <td>{l.status === "Pending" && <Button size="sm" variant="link" className="text-danger" disabled={busy} onClick={() => send({ action: "cancel", id: l.leaveId })}>Hủy</Button>}</td>
                    </tr>
                  ))}
                  {!(data?.leaves || []).length && <tr><td colSpan={4} className="text-center text-muted py-3">Chưa có đơn.</td></tr>}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}

const TITLES = {
  scheduling: ["Ca làm & kỹ năng", "Phân ca theo tuần và cập nhật dịch vụ mỗi kỹ thuật viên thực hiện được."],
  leaves: ["Duyệt nghỉ phép", "Xem các lịch hẹn bị ảnh hưởng trước khi duyệt đơn nghỉ."],
  "tour-report": ["Báo cáo tour", "Số tour của từng kỹ thuật viên trong ngày theo quy tắc xoay vòng."],
  "my-schedule": ["Lịch làm việc của tôi", "Xem ca làm trong tuần và gửi đơn xin nghỉ phép."],
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
