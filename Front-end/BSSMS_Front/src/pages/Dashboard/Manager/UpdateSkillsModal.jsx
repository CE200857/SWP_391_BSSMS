// UC Update Staff Skills — Manager picks the services a technician can perform.
import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import FloatingAlert from "../../../components/FloatingAlert";
import { writeScheduling } from "./operationsWrite";

/** target: { staffId, fullName, serviceIds } or null = closed; services: all services */
export default function UpdateSkillsModal({ target, services, onClose, onSaved }) {
  const [serviceIds, setServiceIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (target) { setServiceIds(target.serviceIds); setError(""); } }, [target]);

  const toggle = (id) => setServiceIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await writeScheduling({ action: "saveSkills", staffId: target.staffId, serviceIds });
      onSaved(r.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal show={Boolean(target)} onHide={() => !busy && onClose()} centered>
      <Modal.Header closeButton><Modal.Title>Skills · {target?.fullName}</Modal.Title></Modal.Header>
      {target && (
        <Modal.Body style={{ maxHeight: 400, overflowY: "auto" }}>
          <FloatingAlert message={error} onClose={() => setError("")} />
          {services.map((s) => (
            <Form.Check key={s.serviceId} id={`sk-${s.serviceId}`} label={s.serviceName} checked={serviceIds.includes(s.serviceId)} onChange={() => toggle(s.serviceId)} />
          ))}
        </Modal.Body>
      )}
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button disabled={busy} onClick={save}>Save skills</Button>
      </Modal.Footer>
    </Modal>
  );
}
