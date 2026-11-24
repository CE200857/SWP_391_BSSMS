// Shared, presentation-only pieces for CreateTreatmentPackageModal and UpdateTreatmentPackageModal.
// No API calls here: each CRUD file owns its own request.
import { Col, Form, Row } from "react-bootstrap";
import { money } from "../../../../services/api";

export const emptyPackageForm = {
  treatmentPackageId: 0, packageName: "", description: "", price: "", numberOfSessions: "",
  validityDays: 180, status: "Active", serviceIds: [],
};

export const buildPackageBody = (formData) => ({
  treatmentPackageId: formData.treatmentPackageId,
  packageName: formData.packageName.trim(),
  description: formData.description?.trim() || null,
  price: Number(formData.price),
  numberOfSessions: Number(formData.numberOfSessions),
  validityDays: Number(formData.validityDays),
  status: formData.status,
  serviceIds: formData.serviceIds,
});

export function TreatmentPackageFields({ formData, setFormData, services }) {
  const toggleService = (id) => setFormData((f) => ({
    ...f, serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((x) => x !== id) : [...f.serviceIds, id],
  }));
  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Treatment package name*</Form.Label>
        <Form.Control maxLength={150} value={formData.packageName} onChange={(e) => setFormData({ ...formData, packageName: e.target.value })} required />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Applicable services* <small className="text-muted fw-normal">(each session can be used for one of these services)</small></Form.Label>
        <div className="d-flex flex-wrap gap-3 border rounded p-2" style={{ maxHeight: 180, overflowY: "auto" }}>
          {services.map((s) => (
            <Form.Check key={s.serviceId} id={`pkg-svc-${s.serviceId}`} label={`${s.serviceName} (${money(s.price)})`}
              checked={formData.serviceIds.includes(s.serviceId)} onChange={() => toggleService(s.serviceId)} />
          ))}
        </div>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Detailed description</Form.Label>
        <Form.Control as="textarea" rows={3} value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </Form.Group>
      <Row>
        <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold">Sessions*</Form.Label>
          <Form.Control type="number" min="1" max="100" value={formData.numberOfSessions} onChange={(e) => setFormData({ ...formData, numberOfSessions: e.target.value })} required /></Form.Group></Col>
        <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold">Validity (days)*</Form.Label>
          <Form.Control type="number" min="1" max="1095" value={formData.validityDays} onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })} required /></Form.Group></Col>
        <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold">Package price (VND)*</Form.Label>
          <Form.Control type="number" min="1000" step="1000" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required /></Form.Group></Col>
        <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold">Status</Form.Label>
          <Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
            <option value="Active">On sale</option><option value="Inactive">Stop selling</option>
          </Form.Select></Form.Group></Col>
      </Row>
    </>
  );
}
