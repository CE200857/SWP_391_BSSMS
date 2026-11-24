// UC Update Room — Manager edits a room.
import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { put } from "../../../../services/api";
import FloatingAlert from "../../../../components/FloatingAlert";
import { emptyRoomForm, RoomFields } from "./resourceShared";

/** room: the room to edit (null = closed) */
export default function UpdateRoomModal({ room, onClose, onSaved }) {
  const [form, setForm] = useState(emptyRoomForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (room) { setForm({ roomId: room.roomId, roomName: room.roomName, roomType: room.roomType, status: room.status }); setFormError(""); }
  }, [room]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const r = await put("/api/rooms", form);
      onSaved(r.message, r.affectedAppointments);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={Boolean(room)} onHide={() => !saving && onClose()} centered>
      <Modal.Header closeButton><Modal.Title>Update room</Modal.Title></Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <FloatingAlert message={formError} onClose={() => setFormError("")} />
          <RoomFields form={form} setForm={setForm} />
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>Save</Button></Modal.Footer>
      </Form>
    </Modal>
  );
}
