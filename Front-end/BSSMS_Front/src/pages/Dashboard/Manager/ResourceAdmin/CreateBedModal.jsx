// UC Create Bed — Manager adds a bed to a room.
import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { post } from "../../../../services/api";
import FloatingAlert from "../../../../components/FloatingAlert";
import { emptyBedForm, BedFields } from "./resourceShared";

/** show: open/closed; rooms: rooms to choose from */
export default function CreateBedModal({ show, rooms, onClose, onSaved }) {
  const [form, setForm] = useState(emptyBedForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (show) { setForm({ ...emptyBedForm, roomId: rooms[0]?.roomId || "" }); setFormError(""); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const r = await post("/api/beds", { ...form, roomId: Number(form.roomId) });
      onSaved(r.message, r.affectedAppointments);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={() => !saving && onClose()} centered>
      <Modal.Header closeButton><Modal.Title>Add bed</Modal.Title></Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <FloatingAlert message={formError} onClose={() => setFormError("")} />
          <BedFields form={form} setForm={setForm} rooms={rooms} />
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>Save</Button></Modal.Footer>
      </Form>
    </Modal>
  );
}
