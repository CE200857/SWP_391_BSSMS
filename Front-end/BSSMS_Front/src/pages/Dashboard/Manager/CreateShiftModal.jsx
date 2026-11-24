// UC Create Staff Scheduling — Manager assigns shifts to staff for days of the week.
import { useEffect, useState } from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import { today, viDate, label } from "../../../services/api";
import FloatingAlert from "../../../components/FloatingAlert";
import { SHIFT_TYPES, WEEKDAYS } from "./operationsShared";
import { writeScheduling } from "./operationsWrite";

/** initial: { staffIds, dates, shiftType } or null = closed; staff: staff list; days: the 7 dates of the week */
export default function CreateShiftModal({ initial, staff, days, onClose, onSaved }) {
  const [create, setCreate] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setCreate(initial); setError(""); }, [initial]);

  const toggle = (key, value) => setCreate((c) => ({
    ...c, [key]: c[key].includes(value) ? c[key].filter((x) => x !== value) : [...c[key], value],
  }));

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await writeScheduling({ action: "createShifts", ...create });
      onSaved(r.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal show={Boolean(initial)} onHide={() => !busy && onClose()} centered size="lg">
      <Modal.Header closeButton><Modal.Title>Assign shifts</Modal.Title></Modal.Header>
      {create && (
        <Modal.Body>
          <FloatingAlert message={error} onClose={() => setError("")} />
          <Form.Label className="fw-bold">Shift type</Form.Label>
          <div className="d-flex gap-3 mb-3">
            {SHIFT_TYPES.map((t) => <Form.Check key={t} type="radio" id={`st-${t}`} label={label(t)} checked={create.shiftType === t} onChange={() => setCreate({ ...create, shiftType: t })} />)}
          </div>
          <Row>
            <Col md={6}>
              <Form.Label className="fw-bold">Staff</Form.Label>
              {staff.map((s) => (
                <Form.Check key={s.staffId} id={`cs-${s.staffId}`} label={s.fullName} checked={create.staffIds.includes(s.staffId)} onChange={() => toggle("staffIds", s.staffId)} />
              ))}
            </Col>
            <Col md={6}>
              <Form.Label className="fw-bold">Day of week</Form.Label>
              {days.map((d, i) => (
                <Form.Check key={d} id={`cd-${d}`} label={`${WEEKDAYS[i]} ${viDate(d)}${d < today() ? " (past)" : ""}`} disabled={d < today()} checked={create.dates.includes(d)} onChange={() => toggle("dates", d)} />
              ))}
            </Col>
          </Row>
          <small className="text-muted">Days that already have a shift or approved leave are skipped. Each staff member has at most 1 shift per day.</small>
        </Modal.Body>
      )}
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button disabled={busy || !create?.staffIds.length || !create?.dates.length} onClick={save}>Create shift</Button>
      </Modal.Footer>
    </Modal>
  );
}
