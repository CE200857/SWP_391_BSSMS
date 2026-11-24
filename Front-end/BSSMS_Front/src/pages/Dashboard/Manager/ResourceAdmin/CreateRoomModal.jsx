// UC Create Room — Manager adds a room.
import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { post } from "../../../../services/api";
import FloatingAlert from "../../../../components/FloatingAlert";
import { emptyRoomForm, RoomFields } from "./resourceShared";

/** show: open/closed */
export default function CreateRoomModal({ show, onClose, onSaved }) {
  const [form, setForm] = useState(emptyRoomForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (show) { setForm(emptyRoomForm); setFormError(""); }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const r = await post("/api/rooms", form);
      onSaved(r.message, r.affectedAppointments);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={() => !saving && onClose()} centered>
      <Modal.Header closeButton><Modal.Title>Add room</Modal.Title></Modal.Header>
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
