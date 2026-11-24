// UC Create Package — Manager adds a new treatment package.
import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { post } from "../../../../services/api";
import FloatingAlert from "../../../../components/FloatingAlert";
import { emptyPackageForm, buildPackageBody, TreatmentPackageFields } from "./treatmentPackageShared";

export default function CreateTreatmentPackageModal({ show, services, onClose, onSaved }) {
  const [formData, setFormData] = useState(emptyPackageForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (show) { setFormData(emptyPackageForm); setFormError(""); }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.serviceIds.length) return setFormError("Choose at least one applicable service.");
    setSaving(true);
    setFormError("");
    try {
      const r = await post("/api/treatment-packages", buildPackageBody(formData));
      onSaved(r?.message || "Treatment package created.");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={() => !saving && onClose()} centered backdrop="static" size="lg">
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="fw-bold">Add treatment package</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <FloatingAlert message={formError} onClose={() => setFormError("")} />
          <TreatmentPackageFields formData={formData} setFormData={setFormData} services={services} />
        </Modal.Body>
        <Modal.Footer className="bg-light border-0">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={saving}>Create</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
