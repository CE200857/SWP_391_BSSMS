import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Form, Modal, Nav, Row, Table } from "react-bootstrap";
import { api, post, put, del, viDate, time5, label } from "../../../../services/api";
import { StatusToggleButton, StatusChangeModal } from "../../../../components/StatusToggle";
import FloatingAlert from "../../../../components/FloatingAlert";

const ROOM_TYPES = ["Facial", "Massage", "HairWash", "Body"];

export default function ResourceManagement() {
  const [tab, setTab] = useState("rooms");
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [roomForm, setRoomForm] = useState(null);
  const [bedForm, setBedForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [affected, setAffected] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, b] = await Promise.all([api("/api/rooms"), api("/api/beds")]);
      setRooms(r);
      setBeds(b);
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (kind, form, setForm) => {
    setSaving(true);
    setFormError("");
    try {
      const url = kind === "room" ? "/api/rooms" : "/api/beds";
      const id = kind === "room" ? form.roomId : form.bedId;
      const r = id ? await put(url, form) : await post(url, form);
      setNotice(r.message);
      setForm(null);
      if (r.affectedAppointments?.length) setAffected(r.affectedAppointments);
      load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };
  // Bấm nhãn trạng thái: phòng/giường Active <-> Maintenance
  const [statusTarget, setStatusTarget] = useState(null); // { kind, item }
  const [statusBusy, setStatusBusy] = useState(false);
  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const { kind, item } = statusTarget;
    const next = item.status === "Active" ? "Maintenance" : "Active";
    setStatusBusy(true);
    try {
      const r = kind === "room"
        ? await put("/api/rooms", { roomId: item.roomId, roomName: item.roomName, roomType: item.roomType, status: next })
        : await put("/api/beds", { bedId: item.bedId, roomId: item.roomId, bedNumber: item.bedNumber, status: next });
      setNotice(r.message);
      if (r.affectedAppointments?.length) setAffected(r.affectedAppointments);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setStatusBusy(false);
      setStatusTarget(null);
    }
  };

  const remove = async (kind, item) => {
    const name = kind === "room" ? `room ${item.roomName}` : `beds ${item.bedNumber} (${item.roomName})`;
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      const r = await del(`${kind === "room" ? "/api/rooms" : "/api/beds"}?id=${kind === "room" ? item.roomId : item.bedId}`);
      setNotice(r.message);
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const showAffected = async (room) => {
    try {
      setAffected(await api(`/api/rooms?affectedOf=${room.roomId}`));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Container fluid className="mt-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h2 className="manager-page-title fw-bold mb-1">Rooms & beds</h2>
          <p className="text-muted mb-0">Manage rooms by service type and the beds in each room.</p>
        </div>
        <Button className="fw-bold" onClick={() => { setFormError(""); tab === "rooms" ? setRoomForm({ roomId: 0, roomName: "", roomType: "Facial", status: "Active" }) : setBedForm({ bedId: 0, roomId: rooms[0]?.roomId || "", bedNumber: "", status: "Active" }); }}>
          <i className="bi bi-plus-lg" /> {tab === "rooms" ? "Add room" : "Add bed"}
        </Button>
      </div>
      <FloatingAlert message={error} onClose={() => setError("")} />
      <FloatingAlert message={notice} variant="success" onClose={() => setNotice("")} />

      <Nav variant="tabs" activeKey={tab} onSelect={setTab} className="mb-3">
        <Nav.Item><Nav.Link eventKey="rooms">Room ({rooms.length})</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="beds">Bed ({beds.length})</Nav.Link></Nav.Item>
      </Nav>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {tab === "rooms" ? (
            <Table hover responsive className="align-middle mb-0 manager-list-table">
              <thead className="table-dark"><tr><th>Room</th><th>Room type</th><th>Beds (active/total)</th><th>Status</th><th className="text-center">Actions</th></tr></thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.roomId}>
                    <td className="fw-bold">{r.roomName}</td>
                    <td>{label(r.roomType)}</td>
                    <td>{r.activeBedCount}/{r.bedCount}</td>
                    <td><StatusToggleButton active={r.status === "Active"} inactiveLabel={label(r.status)} onClick={() => setStatusTarget({ kind: "room", item: r })} /></td>
                    <td className="text-center">
                      <div className="manager-list-actions">
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" onClick={() => { setFormError(""); setRoomForm({ ...r }); }}><i className="bi bi-pencil-square" /> Edit</Button>
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--view" onClick={() => showAffected(r)}><i className="bi bi-calendar-event" /> Appointments</Button>
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--delete" onClick={() => remove("room", r)}><i className="bi bi-trash" /> Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!rooms.length && <tr><td colSpan={5} className="text-center text-muted py-4">No rooms yet.</td></tr>}
              </tbody>
            </Table>
          ) : (
            <Table hover responsive className="align-middle mb-0 manager-list-table">
              <thead className="table-dark"><tr><th>Bed</th><th>Room</th><th>Room type</th><th>Status</th><th>Use</th><th className="text-center">Actions</th></tr></thead>
              <tbody>
                {beds.map((b) => (
                  <tr key={b.bedId}>
                    <td className="fw-bold">{b.bedNumber}</td>
                    <td>{b.roomName}</td>
                    <td>{label(b.roomType)}</td>
                    <td><StatusToggleButton active={b.status === "Active"} inactiveLabel={label(b.status)} onClick={() => setStatusTarget({ kind: "bed", item: b })} /></td>
                    <td>{label(b.useState)}</td>
                    <td className="text-center">
                      <div className="manager-list-actions">
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" onClick={() => { setFormError(""); setBedForm({ bedId: b.bedId, roomId: b.roomId, bedNumber: b.bedNumber, status: b.status }); }}><i className="bi bi-pencil-square" /> Edit</Button>
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--delete" onClick={() => remove("bed", b)}><i className="bi bi-trash" /> Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!beds.length && <tr><td colSpan={6} className="text-center text-muted py-4">No beds yet.</td></tr>}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={!!roomForm} onHide={() => !saving && setRoomForm(null)} centered>
        <Modal.Header closeButton><Modal.Title>{roomForm?.roomId ? "Update room" : "Add room"}</Modal.Title></Modal.Header>
        {roomForm && (
          <Form onSubmit={(e) => { e.preventDefault(); save("room", roomForm, setRoomForm); }}>
            <Modal.Body>
              <FloatingAlert message={formError} onClose={() => setFormError("")} />
              <Form.Group className="mb-3"><Form.Label className="fw-bold">Room name *</Form.Label>
                <Form.Control value={roomForm.roomName} maxLength={100} onChange={(e) => setRoomForm({ ...roomForm, roomName: e.target.value })} required /></Form.Group>
              <Row>
                <Col><Form.Label className="fw-bold">Room type*</Form.Label>
                  <Form.Select value={roomForm.roomType} onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}>
                    {ROOM_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}
                  </Form.Select></Col>
                <Col><Form.Label className="fw-bold">Status</Form.Label>
                  <Form.Select value={roomForm.status} onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}>
                    <option value="Active">Active</option><option value="Maintenance">Maintenance</option>
                  </Form.Select></Col>
              </Row>
              <small className="text-muted d-block mt-2">Setting the room to maintenance will also set its free beds to maintenance.</small>
            </Modal.Body>
            <Modal.Footer><Button variant="secondary" onClick={() => setRoomForm(null)}>Cancel</Button><Button type="submit" disabled={saving}>Save</Button></Modal.Footer>
          </Form>
        )}
      </Modal>

      <Modal show={!!bedForm} onHide={() => !saving && setBedForm(null)} centered>
        <Modal.Header closeButton><Modal.Title>{bedForm?.bedId ? "Update bed" : "Add bed"}</Modal.Title></Modal.Header>
        {bedForm && (
          <Form onSubmit={(e) => { e.preventDefault(); save("bed", { ...bedForm, roomId: Number(bedForm.roomId) }, setBedForm); }}>
            <Modal.Body>
              <FloatingAlert message={formError} onClose={() => setFormError("")} />
              <Form.Group className="mb-3"><Form.Label className="fw-bold">Room*</Form.Label>
                <Form.Select value={bedForm.roomId} onChange={(e) => setBedForm({ ...bedForm, roomId: e.target.value })} required>
                  {rooms.map((r) => <option key={r.roomId} value={r.roomId}>{r.roomName} · {label(r.roomType)}</option>)}
                </Form.Select></Form.Group>
              <Row>
                <Col><Form.Label className="fw-bold">Bed name *</Form.Label>
                  <Form.Control value={bedForm.bedNumber} maxLength={20} onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })} required /></Col>
                <Col><Form.Label className="fw-bold">Status</Form.Label>
                  <Form.Select value={bedForm.status} onChange={(e) => setBedForm({ ...bedForm, status: e.target.value })}>
                    <option value="Active">Active</option><option value="Maintenance">Maintenance</option>
                  </Form.Select></Col>
              </Row>
            </Modal.Body>
            <Modal.Footer><Button variant="secondary" onClick={() => setBedForm(null)}>Cancel</Button><Button type="submit" disabled={saving}>Save</Button></Modal.Footer>
          </Form>
        )}
      </Modal>

      <Modal show={!!affected} onHide={() => setAffected(null)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Upcoming appointments using the room/bed</Modal.Title></Modal.Header>
        <Modal.Body>
          {affected?.length ? (
            <>
              <Table size="sm" responsive>
                <thead><tr><th>Schedule</th><th>Date & time</th><th>Customer</th><th>Service</th><th>Bed</th></tr></thead>
                <tbody>
                  {affected.map((a, i) => (
                    <tr key={i}><td>#{a.appointmentId}</td><td>{viDate(a.appointmentDate)} {time5(a.startTime)}–{time5(a.endTime)}</td><td>{a.customerName} · {a.customerPhone}</td><td>{a.serviceName}</td><td>{a.roomName} · {a.bedNumber}</td></tr>
                  ))}
                </tbody>
              </Table>
              <Alert variant="warning" className="mb-0">If a room/bed is under maintenance, these appointments appear under "Affected appointments" so the receptionist can assign another bed.</Alert>
            </>
          ) : <p className="text-muted mb-0">No upcoming appointments.</p>}
        </Modal.Body>
      </Modal>

      <StatusChangeModal
        show={!!statusTarget}
        entity={statusTarget?.kind === "bed" ? "bed" : "room"}
        name={statusTarget?.kind === "bed" ? `${statusTarget.item.bedNumber} (${statusTarget.item.roomName})` : statusTarget?.item.roomName}
        nextActive={statusTarget?.item.status !== "Active"}
        nextLabel={statusTarget?.item.status === "Active" ? "Maintenance" : "Active"}
        busy={statusBusy}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />
    </Container>
  );
}
