// UC Cancel Invoice — Manager cancels an unpaid invoice (shown inside the invoice detail).
import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { post } from "../../../services/api";

/** invoiceId, totalAmount: the invoice; onDone(message) after success; onBack() to return */
export default function CancelInvoiceForm({ invoiceId, totalAmount, onDone, onBack, onError }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    onError("");
    try {
      const r = await post(`/api/invoices/${invoiceId}/cancel`, { reason: reason.trim() });
      onDone("Invoice cancelled.");
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      <Form.Group>
        <Form.Label>Invoice cancellation reason *</Form.Label>
        <Form.Control as="textarea" rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
      </Form.Group>
      <div className="d-flex justify-content-end gap-2 mt-2">
        <Button variant="outline-secondary" disabled={busy} onClick={onBack}>Back</Button>
        <Button variant="danger" disabled={busy || !reason.trim()} onClick={confirm}>Confirm cancellation</Button>
      </div>
    </div>
  );
}
