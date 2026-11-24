import { Button, Modal, Spinner } from "react-bootstrap";

// Presentation-only "are you sure?" dialog. Each Delete<X>Modal file owns its own API call
// and passes busy/error here, so one entity's delete cannot break another's.
export default function ConfirmDeleteModal({ show, title, busy = false, error = "", onCancel, onConfirm, children }) {
  return (
    <Modal show={show} onHide={() => !busy && onCancel()} centered>
      <Modal.Header closeButton={!busy}>
        <Modal.Title className="text-danger fw-bold">
          <i className="bi bi-trash me-2" aria-hidden="true" /> {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger mb-3" role="alert">{error}</div>}
        {children}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy ? (<><Spinner size="sm" animation="border" className="me-2" />Processing</>) : (<><i className="bi bi-trash me-2" aria-hidden="true" />Delete</>)}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
