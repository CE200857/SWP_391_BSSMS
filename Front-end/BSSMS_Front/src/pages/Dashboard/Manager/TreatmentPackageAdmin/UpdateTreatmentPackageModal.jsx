// UC Update Package — Manager edits an existing treatment package.
import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { put } from "../../../../services/api";
import FloatingAlert from "../../../../components/FloatingAlert";
import { emptyPackageForm, buildPackageBody, TreatmentPackageFields } from "./treatmentPackageShared";

/** pkg: the package to edit (null = closed) */
export default function UpdateTreatmentPackageModal({ pkg, services, onClose, onSaved }) {
  const [formData, setFormData] = useState(emptyPackageForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pkg) {
      setFormData({ ...emptyPackageForm, ...pkg, serviceIds: [...(pkg.serviceIds || [])] });
      setFormError("");
    }
  }, [pkg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.serviceIds.length) return setFormError("Choose at least one applicable service.");
    setSaving(true);
    setFormError("");
    try {
      const r = await put("/api/treatment-packages", buildPackageBody(formData));
      onSaved(r?.message || "Treatment package saved.");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={Boolean(pkg)} onHide={() => !saving && onClose()} centered backdrop="static" size="lg">
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="fw-bold">Update treatment package</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <FloatingAlert message={formError} onClose={() => setFormError("")} />
          <TreatmentPackageFields formData={formData} setFormData={setFormData} services={services} />
          <small className="text-muted">Changes only apply to future sales; packages customers bought keep their sessions and expiry date.</small>
        </Modal.Body>
        <Modal.Footer className="bg-light border-0">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={saving}>Save changes</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
