import { Button, Modal } from "react-bootstrap";
import "./StatusToggle.css";

// Nút trạng thái bấm được: active/inactive; activeLabel/inactiveLabel/label để đổi chữ (vd. Maintenance, Applying)
export function StatusToggleButton({ active, onClick, disabled = false, activeLabel = "Active", inactiveLabel = "Inactive", label }) {
  return (
    <button
      type="button"
      className={`status-toggle${active ? "" : " is-inactive"}`}
      onClick={onClick}
      disabled={disabled}
      title="Click to change status"
    >
      <i className={`bi ${active ? "bi-check-circle-fill" : "bi-pause-circle-fill"}`} aria-hidden="true" />
      {label || (active ? activeLabel : inactiveLabel)}
    </button>
  );
}

export function StatusChangeModal({ show, entity, name, nextActive, nextLabel, busy = false, onCancel, onConfirm }) {
  return (
    <Modal show={show} onHide={() => !busy && onCancel()} centered>
      <Modal.Header closeButton={!busy}>
        <Modal.Title className="text-warning fw-bold">
          <i className="bi bi-arrow-repeat me-2" aria-hidden="true" /> Confirm status change
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to change the status of {entity} <span className="fw-bold text-primary">{name}</span> to{" "}
        <span className={`fw-bold ${nextActive ? "text-success" : "text-danger"}`}>
          {nextLabel || (nextActive ? "Active" : "Inactive")}
        </span>{" "}
        ?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={busy}>
          {busy ? "Processing…" : "Confirm"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
