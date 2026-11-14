import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Badge, Button, Card, Container, Form, Modal, Nav, Spinner, Table } from "react-bootstrap";
import AppointmentStatusBadge from "../../../components/AppointmentStatusBadge";
import { api, put, today, time5, viDate, label } from "../../../services/api";

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
        <Modal.Title>{mode === "checkin" ? "Check-in & phân công" : "Điều phối lại"} · Lịch #{appointmentId}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {!plan && !error && <div className="text-center py-4"><Spinner animation="border" variant="danger" /></div>}
        {plan && (
          <>
            {plan.customerName && (
              <p className="mb-3"><strong>{plan.customerName}</strong> · {plan.customerPhone} · {time5(plan.startTime)}–{time5(plan.endTime)}</p>
            )}
            <Table responsive className="align-middle manager-list-table">
              <thead className="table-light">
                <tr><th>Dịch vụ</th><th>Giờ</th><th>Kỹ thuật viên</th><th>Giường</th></tr>
              </thead>
              <tbody>
                {plan.lines.map((l) => (
                  <tr key={l.appointmentServiceId}>
                    <td className="fw-semibold">{l.serviceName}<small className="d-block text-muted">Phần {l.part} · {label(l.requiredRoomType)} · {l.tourCount} tour</small></td>
                    <td>{time5(l.startTime)}–{time5(l.endTime)}</td>
                    <td>
                      <Form.Select size="sm" value={choice[l.appointmentServiceId]?.technicianId || ""} onChange={(e) => setTechnician(l, e.target.value)}>
                        <option value="">-- Chọn KTV --</option>
                        {(l.technicianOptions || []).map((t) => (
                          <option key={t.staffId} value={t.staffId}>{t.fullName}{t.staffId === l.suggestedTechnicianId ? " (gợi ý theo tour)" : ""}</option>
                        ))}
                      </Form.Select>
                      {!(l.technicianOptions || []).length && <small className="text-danger">Không có KTV phù hợp rảnh</small>}
                    </td>
                    <td>
                      <Form.Select size="sm" value={choice[l.appointmentServiceId]?.bedId || ""} onChange={(e) => set(l.appointmentServiceId, { bedId: e.target.value })}>
                        <option value="">-- Chọn giường --</option>
                        {l.bedId && !(l.bedOptions || []).some((b) => b.bedId === l.bedId) && <option value={l.bedId}>Giường hiện tại</option>}
                        {(l.bedOptions || []).map((b) => <option key={b.bedId} value={b.bedId}>{b.roomName} · {b.bedNumber}</option>)}
                      </Form.Select>
                      {!(l.bedOptions || []).length && !l.bedId && <small className="text-danger">Hết giường trống</small>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <small className="text-muted">Lịch 3–4 dịch vụ được chia 2 phần; mỗi phần do một KTV đảm nhận. Gợi ý KTV theo số tour ít nhất trong ngày.</small>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose} disabled={saving}>Đóng</Button>
        <Button onClick={save} disabled={saving || !plan}>{saving ? "Đang lưu..." : mode === "checkin" ? "Check-in" : "Lưu điều phối"}</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default function ReceptionistBookingDesk({ user }) {
  const canAct = (user?.role || "Receptionist") === "Receptionist";
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") || "arrivals");
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
      const [b, a] = await Promise.all([api(`/api/booking/coordination?date=${date}`), api("/api/booking/affected")]);
      setBoard(b);
      setAffected(a || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [date]);
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

  return (
    <Container fluid className="mt-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="manager-page-title fw-bold mb-1">{canAct ? "Check-in & điều phối" : "Điều phối nhân viên"}</h2>
          <p className="text-muted mb-0">Đón khách, phân công kỹ thuật viên – giường và xử lý lịch bị ảnh hưởng.</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 180 }} />
          <Button variant="outline-secondary" onClick={load}><i className="bi bi-arrow-clockwise" /> Làm mới</Button>
          {canAct && <Button onClick={() => navigate("/appointments/create")}><i className="bi bi-calendar-plus" /> Tạo lịch</Button>}
        </div>
      </div>
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {notice && <Alert variant="success" dismissible onClose={() => setNotice("")}>{notice}</Alert>}

      <Nav variant="tabs" activeKey={tab} onSelect={(k) => setTab(k)} className="mb-3">
        <Nav.Item><Nav.Link eventKey="arrivals">Đón khách ({board?.arrivals?.length || 0})</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="board">Bảng điều phối KTV</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="affected">Lịch bị ảnh hưởng {affectedIds.length > 0 && <Badge bg="danger">{affectedIds.length}</Badge>}</Nav.Link></Nav.Item>
      </Nav>

      {loading && !board ? (
        <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div>
      ) : tab === "arrivals" ? (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            <Table hover responsive className="align-middle mb-0 manager-list-table">
              <thead className="table-dark"><tr><th>Giờ</th><th>Khách hàng</th><th>Dịch vụ</th><th>Trạng thái</th><th className="text-center">Thao tác</th></tr></thead>
              <tbody>
                {(board?.arrivals || []).map((a) => (
                  <tr key={a.appointmentId}>
                    <td className="fw-bold">{time5(a.startTime)}–{time5(a.endTime)}</td>
                    <td>{a.customerName}<small className="d-block text-muted">{a.customerPhone}</small></td>
                    <td>{a.serviceNames}</td>
                    <td>
                      <AppointmentStatusBadge status={a.status} />
                      {a.timingNote && <small className={`d-block mt-1 ${/Quá hạn|Trễ/.test(a.timingNote) ? "text-danger fw-semibold" : "text-muted"}`}>{a.timingNote}</small>}
                    </td>
                    <td className="text-center">
                      <div className="manager-list-actions">
                        {canAct && a.status === "Pending" && a.canConfirm !== false && (
                          <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" disabled={busy === a.appointmentId}
                            onClick={() => quick(a.appointmentId, "confirm", `Đã xác nhận lịch #${a.appointmentId}.`)}>
                            <i className="bi bi-check2-circle" /> Xác nhận
                          </Button>
                        )}
                        {canAct && a.status === "Confirmed" && isToday && a.canCheckIn !== false && (
                          <Button variant="link" size="sm" className="manager-list-action manager-list-action--view" onClick={() => setModal({ id: a.appointmentId, mode: "checkin" })}>
                            <i className="bi bi-door-open" /> Check-in
                          </Button>
                        )}
                        {canAct && a.status === "Confirmed" && a.canNoShow === true && (
                          <Button variant="link" size="sm" className="manager-list-action manager-list-action--delete" disabled={busy === a.appointmentId}
                            onClick={() => quick(a.appointmentId, "no-show", `Đã đánh dấu lịch #${a.appointmentId} không đến.`)}>
                            <i className="bi bi-person-x" /> Không đến
                          </Button>
                        )}
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--view" onClick={() => navigate(`/appointments/${a.appointmentId}`)}>
                          <i className="bi bi-eye" /> Xem
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!board?.arrivals?.length && <tr><td colSpan={5} className="text-center text-muted py-4">Không có lịch hẹn cần đón trong ngày {viDate(date)}.</td></tr>}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ) : tab === "board" ? (
        <>
          <p className="text-muted">Chênh lệch tour giữa các KTV trong ngày: <strong>{board?.tourGap ?? 0}</strong> tour. KTV có ít tour nhất được ưu tiên ở lượt tiếp theo.</p>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              <Table responsive className="align-middle mb-0 manager-list-table">
                <thead className="table-dark"><tr><th>Kỹ thuật viên</th><th>Ca</th><th>Tour đã tính</th><th>Tour thực làm</th><th>Tour được yêu cầu</th><th>Dịch vụ trong ngày</th></tr></thead>
                <tbody>
                  {(board?.technicians || []).map((t) => {
                    const mine = (board.lines || []).filter((l) => l.technicianId === t.staffId);
                    return (
                      <tr key={t.staffId}>
                        <td className="fw-bold">{t.fullName}{t.onLeave ? <Badge bg="warning" text="dark" className="ms-1">Nghỉ phép</Badge> : null}</td>
                        <td>{t.shiftType ? label(t.shiftType) : <span className="text-muted">Không có ca</span>}</td>
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
      ) : (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            <Table hover responsive className="align-middle mb-0 manager-list-table">
              <thead className="table-dark"><tr><th>Lịch</th><th>Ngày giờ</th><th>Khách hàng</th><th>Dịch vụ</th><th>Phân công hiện tại</th><th>Lý do</th><th /></tr></thead>
              <tbody>
                {affected.map((r) => (
                  <tr key={r.appointmentServiceId}>
                    <td className="fw-bold">#{r.appointmentId}</td>
                    <td>{viDate(r.appointmentDate)}<small className="d-block text-muted">{time5(r.lineStart)}–{time5(r.lineEnd)}</small></td>
                    <td>{r.customerName}<small className="d-block text-muted">{r.customerPhone}</small></td>
                    <td>{r.serviceName}</td>
                    <td>{r.technicianName || "—"}{r.roomName ? ` · ${r.roomName} ${r.bedNumber}` : ""}</td>
                    <td><Badge bg="danger">{r.reason}</Badge></td>
                    <td>{canAct ? <Button size="sm" onClick={() => setModal({ id: r.appointmentId, mode: "coordinate" })}>Điều phối</Button> : <small className="text-muted">Lễ tân điều phối</small>}</td>
                  </tr>
                ))}
                {!affected.length && <tr><td colSpan={7} className="text-center text-muted py-4">Không có lịch hẹn nào bị ảnh hưởng bởi nghỉ phép hoặc bảo trì.</td></tr>}
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
