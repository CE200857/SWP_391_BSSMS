// Shared, presentation-only form fields for the Room and Bed modals. No API calls here.
import { Col, Form, Row } from "react-bootstrap";
import { label } from "../../../../services/api";

export const ROOM_TYPES = ["Facial", "Massage", "HairWash", "Body"];
export const emptyRoomForm = { roomId: 0, roomName: "", roomType: "Facial", status: "Active" };
export const emptyBedForm = { bedId: 0, roomId: "", bedNumber: "", status: "Active" };

export function RoomFields({ form, setForm }) {
  return (
    <>
      <Form.Group className="mb-3"><Form.Label className="fw-bold">Room name *</Form.Label>
        <Form.Control value={form.roomName} maxLength={100} onChange={(e) => setForm({ ...form, roomName: e.target.value })} required /></Form.Group>
      <Row>
        <Col><Form.Label className="fw-bold">Room type*</Form.Label>
          <Form.Select value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })}>
            {ROOM_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}
          </Form.Select></Col>
        <Col><Form.Label className="fw-bold">Status</Form.Label>
          <Form.Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="Active">Active</option><option value="Maintenance">Maintenance</option>
          </Form.Select></Col>
      </Row>
      <small className="text-muted d-block mt-2">Setting the room to maintenance will also set its free beds to maintenance.</small>
    </>
  );
}

export function BedFields({ form, setForm, rooms }) {
  return (
    <>
      <Form.Group className="mb-3"><Form.Label className="fw-bold">Room*</Form.Label>
        <Form.Select value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })} required>
          {rooms.map((r) => <option key={r.roomId} value={r.roomId}>{r.roomName} · {label(r.roomType)}</option>)}
        </Form.Select></Form.Group>
      <Row>
        <Col><Form.Label className="fw-bold">Bed name *</Form.Label>
          <Form.Control value={form.bedNumber} maxLength={20} onChange={(e) => setForm({ ...form, bedNumber: e.target.value })} required /></Col>
        <Col><Form.Label className="fw-bold">Status</Form.Label>
          <Form.Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="Active">Active</option><option value="Maintenance">Maintenance</option>
          </Form.Select></Col>
      </Row>
    </>
  );
}
