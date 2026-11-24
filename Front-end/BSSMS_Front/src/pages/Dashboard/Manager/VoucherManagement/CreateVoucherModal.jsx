// UC Create Voucher — Manager creates a voucher.
import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { post } from "../../../../services/api";
import FloatingAlert from "../../../../components/FloatingAlert";
import { emptyVoucherForm, buildVoucherBody, VoucherFields } from "./voucherShared";

/** show: open/closed */
export default function CreateVoucherModal({ show, onClose, onSaved }) {
  const [form, setForm] = useState(emptyVoucherForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (show) { setForm(emptyVoucherForm); setFormError(""); }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const r = await post("/api/vouchers", buildVoucherBody(form, "create"));
      onSaved(r.message);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={() => !saving && onClose()} centered size="lg" backdrop="static">
      <Modal.Header closeButton className="bg-light"><Modal.Title className="fw-bold">Create voucher</Modal.Title></Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <FloatingAlert message={formError} onClose={() => setFormError("")} />
          <VoucherFields form={form} setForm={setForm} />
        </Modal.Body>
        <Modal.Footer className="bg-light border-0">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>Create voucher</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
