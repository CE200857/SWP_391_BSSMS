// UC Update Voucher — Manager edits a voucher.
import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { post } from "../../../../services/api";
import FloatingAlert from "../../../../components/FloatingAlert";
import { emptyVoucherForm, buildVoucherBody, VoucherFields } from "./voucherShared";

/** voucher: the voucher to edit (null = closed) */
export default function UpdateVoucherModal({ voucher, onClose, onSaved }) {
  const [form, setForm] = useState(emptyVoucherForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (voucher) { setForm({
      ...emptyVoucherForm, ...voucher, maxDiscount: voucher.maxDiscount ?? "",
      startDate: String(voucher.startDate).slice(0, 10), endDate: String(voucher.endDate).slice(0, 10),
    }); setFormError(""); }
  }, [voucher]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const r = await post("/api/vouchers", buildVoucherBody(form, "update"));
      onSaved(r.message);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={Boolean(voucher)} onHide={() => !saving && onClose()} centered size="lg" backdrop="static">
      <Modal.Header closeButton className="bg-light"><Modal.Title className="fw-bold">Update voucher</Modal.Title></Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <FloatingAlert message={formError} onClose={() => setFormError("")} />
          <VoucherFields form={form} setForm={setForm} />
        </Modal.Body>
        <Modal.Footer className="bg-light border-0">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>Save changes</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
