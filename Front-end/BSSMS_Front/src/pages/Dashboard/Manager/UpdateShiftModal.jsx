// UC Update Staff Scheduling — Manager changes the shift type of one shift.
import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { viDate, label } from "../../../services/api";
import FloatingAlert from "../../../components/FloatingAlert";
import { SHIFT_TYPES } from "./operationsShared";
import { writeScheduling } from "./operationsWrite";

/** shift: the shift to edit (null = closed); onRequestDelete(shift) opens DeleteShiftModal */
export default function UpdateShiftModal({ shift, onClose, onSaved, onRequestDelete }) {
  const [shiftType, setShiftType] = useState("FullDay");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (shift) { setShiftType(shift.shiftType); setError(""); } }, [shift]);

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await writeScheduling({ action: "updateShift", id: shift.staffShiftId, shiftType });
      onSaved(r.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal show={Boolean(shift)} onHide={() => !busy && onClose()} centered>
      <Modal.Header closeButton><Modal.Title>Shifts · {shift?.fullName} · {viDate(shift?.shiftDate)}</Modal.Title></Modal.Header>
      {shift && (
        <Modal.Body>
          <FloatingAlert message={error} onClose={() => setError("")} />
          {SHIFT_TYPES.map((t) => <Form.Check key={t} type="radio" id={`et-${t}`} label={label(t)} checked={shiftType === t} onChange={() => setShiftType(t)} />)}
          <small className="text-muted d-block mt-2">If an assigned service falls outside the new shift, the appointment will appear under "Affected appointments" for the receptionist to reassign.</small>
        </Modal.Body>
      )}
      <Modal.Footer>
        <Button variant="outline-danger" disabled={busy} onClick={() => onRequestDelete(shift)}>Delete shift</Button>
        <Button disabled={busy} onClick={save}>Save</Button>
      </Modal.Footer>
    </Modal>
  );
}
