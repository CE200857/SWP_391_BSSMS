// UC Delete Service — confirmation dialog opened from the Service list (Manager only).
// Owns its own API call and error state, so the list keeps working even if delete fails.
import { useState } from "react";
import axios from "axios";
import { Button, Modal, Spinner } from "react-bootstrap";
import { getRequestErrorMessage } from "./serviceFormShared";

/**
 * Props:
 *  - service: the service to delete (null = dialog closed)
 *  - onClose(): close without deleting
 *  - onDeleted(message): called after a successful delete
 */
const DeleteServiceModal = ({ service, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const close = () => {
    if (deleting) return;
    setDeleteError("");
    onClose();
  };

  const confirmDelete = async () => {
    if (!service || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await axios.delete(`/api/service?id=${service.serviceId}`);
      onDeleted(`Service "${service.serviceName}": ${response.data?.message || "has been deleted."}`);
    } catch (error) {
      console.error("Error deleting service:", error);
      setDeleteError(getRequestErrorMessage(error, "Could not delete the service. Please try again."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal show={Boolean(service)} onHide={close} centered aria-labelledby="delete-service-title">
      <Modal.Header closeButton={!deleting}>
        <Modal.Title id="delete-service-title">Delete service</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {deleteError && <div className="alert alert-danger mb-3" role="alert">{deleteError}</div>}
        <p className="mb-2">
          Delete service <strong>{service?.serviceName}</strong>?
        </p>
        <p className="text-muted small mb-0">
          The service is removed from all lists and can no longer be booked. Its data is kept in the
          database so past appointments, invoices and reviews still show it. Upcoming appointments already booked are kept.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={close} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
          {deleting ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" />
              Processing
            </>
          ) : (
            <>
              <i className="bi bi-trash me-2" aria-hidden="true" />
              Delete
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteServiceModal;
