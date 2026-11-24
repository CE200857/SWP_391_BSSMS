import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Container, Modal, Nav, Table } from "react-bootstrap";
import { api, put, viDate, time5, label } from "../../../../services/api";
import { StatusToggleButton, StatusChangeModal } from "../../../../components/StatusToggle";
import FloatingAlert from "../../../../components/FloatingAlert";
import CreateRoomModal from "./CreateRoomModal";
import UpdateRoomModal from "./UpdateRoomModal";
import DeleteRoomModal from "./DeleteRoomModal";
import CreateBedModal from "./CreateBedModal";
import UpdateBedModal from "./UpdateBedModal";
import DeleteBedModal from "./DeleteBedModal";

export default function ResourceManagement() {
  const [tab, setTab] = useState("rooms");
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // Each CRUD action lives in its own modal file (Create/Update/Delete Room/Bed Modal.jsx)
  const [creating, setCreating] = useState(null); // "room" | "bed" | null
  const [editRoom, setEditRoom] = useState(null);
  const [editBed, setEditBed] = useState(null);
  const [deleteRoom, setDeleteRoom] = useState(null);
  const [deleteBed, setDeleteBed] = useState(null);
  const [affected, setAffected] = useState(null);

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

  const afterChange = (message, affectedAppointments) => {
    setNotice(message);
    setCreating(null);
    setEditRoom(null);
    setEditBed(null);
    setDeleteRoom(null);
    setDeleteBed(null);
    if (affectedAppointments?.length) setAffected(affectedAppointments);
    load();
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
        <Button className="fw-bold" onClick={() => setCreating(tab === "rooms" ? "room" : "bed")}>
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
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" onClick={() => setEditRoom(r)}><i className="bi bi-pencil-square" /> Edit</Button>
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--view" onClick={() => showAffected(r)}><i className="bi bi-calendar-event" /> Appointments</Button>
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--delete" onClick={() => setDeleteRoom(r)}><i className="bi bi-trash" /> Delete</Button>
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
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" onClick={() => setEditBed(b)}><i className="bi bi-pencil-square" /> Edit</Button>
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--delete" onClick={() => setDeleteBed(b)}><i className="bi bi-trash" /> Delete</Button>
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

      <CreateRoomModal show={creating === "room"} onClose={() => setCreating(null)} onSaved={afterChange} />
      <UpdateRoomModal room={editRoom} onClose={() => setEditRoom(null)} onSaved={afterChange} />
      <DeleteRoomModal room={deleteRoom} onClose={() => setDeleteRoom(null)} onDeleted={afterChange} />
      <CreateBedModal show={creating === "bed"} rooms={rooms} onClose={() => setCreating(null)} onSaved={afterChange} />
      <UpdateBedModal bed={editBed} rooms={rooms} onClose={() => setEditBed(null)} onSaved={afterChange} />
      <DeleteBedModal bed={deleteBed} onClose={() => setDeleteBed(null)} onDeleted={afterChange} />

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
