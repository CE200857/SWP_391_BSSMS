// UC Assign Role — Manager changes a staff member's position (opened from the staff list).
import { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import axios from "axios";

/** change: { accountId, staffName, newRole } or null = closed */
export default function AssignRoleModal({ change, onClose, onAssigned }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setError(""); }, [change]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      const url = `/api/staff/assign-role?accountId=${change.accountId}&role=${change.newRole}`;
      await axios.post(url, null, { withCredentials: true });
      onAssigned(`Role changed to ${change.newRole} successful!`);
    } catch (err) {
      console.error("Error changing role:", err);
      setError("Failed to change the role. Please try again!");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal show={Boolean(change)} onHide={() => !busy && onClose()} centered>
      <Modal.Header closeButton={!busy}>
        <Modal.Title className="text-primary fw-bold">
          <i className="bi bi-person-gear me-2"></i> Confirm role change
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger mb-3" role="alert">{error}</div>}
        Do you want to change the role of staff member{" "}
        <span className="fw-bold text-danger">{change?.staffName}</span> to the position{" "}
        <span className="fw-bold text-success">{change?.newRole}</span> ?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="primary" onClick={confirm} disabled={busy}>{busy ? "Processing…" : "Confirm"}</Button>
      </Modal.Footer>
    </Modal>
  );
}
