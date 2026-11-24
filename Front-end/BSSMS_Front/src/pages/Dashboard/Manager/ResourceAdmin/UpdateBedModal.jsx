// UC Update Bed — Manager edits a bed.
import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { put } from "../../../../services/api";
import FloatingAlert from "../../../../components/FloatingAlert";
import { emptyBedForm, BedFields } from "./resourceShared";

/** bed: the bed to edit (null = closed); rooms: rooms to choose from */
export default function UpdateBedModal({ bed, rooms, onClose, onSaved }) {
  const [form, setForm] = useState(emptyBedForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bed) { setForm({ bedId: bed.bedId, roomId: bed.roomId, bedNumber: bed.bedNumber, status: bed.status }); setFormError(""); }
  }, [bed]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const r = await put("/api/beds", { ...form, roomId: Number(form.roomId) });
      onSaved(r.message, r.affectedAppointments);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={Boolean(bed)} onHide={() => !saving && onClose()} centered>
      <Modal.Header closeButton><Modal.Title>Update bed</Modal.Title></Modal.Header>
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
