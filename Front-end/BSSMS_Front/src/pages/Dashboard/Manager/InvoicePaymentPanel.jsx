// UC Make Payment — Receptionist/Manager applies a voucher and takes payment at the counter.
// Also exports startVnpayPayment, used for the customer's online VNPay payment.
import { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { post, money } from "../../../services/api";

export const startVnpayPayment = async (invoiceId) => {
  const r = await post("/api/payments/vnpay/create", { invoiceId });
  window.location.assign(r.paymentUrl);
};

/** Shown inside the invoice detail when the invoice is unpaid and collectible. */
export default function InvoicePaymentPanel({ invoiceId, amountDue, voucherCode, onDone, onError }) {
  const [voucher, setVoucher] = useState(voucherCode || "");
  const [method, setMethod] = useState("Cash");
  const [txn, setTxn] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setVoucher(voucherCode || ""); }, [voucherCode]);

  const run = async (fn, message) => {
    setBusy(true);
    onError("");
    try {
      await fn();
      onDone(message);
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const applyVoucher = () => run(
    () => post(`/api/invoices/${invoiceId}/voucher`, { voucherCode: voucher.trim() || null }),
    voucher.trim() ? "Voucher applied." : "Voucher removed.",
  );

  const pay = async () => {
    if (method === "VNPay") {
      setBusy(true);
      try { await startVnpayPayment(invoiceId); } catch (e) { onError(e.message); setBusy(false); }
      return;
    }
    run(
      () => post(`/api/invoices/${invoiceId}/pay`, { paymentMethod: method, transactionCode: txn.trim() || null }),
      `Collected ${money(amountDue)} for invoice #${invoiceId}.`,
    );
  };

  return (
    <section className="invoice-detail-section">
      <div className="invoice-detail-section-heading"><i className="bi bi-credit-card invoice-detail-section-icon" /> Take payment at the counter</div>
      <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
        <Form.Group>
          <Form.Label className="small">Voucher code</Form.Label>
          <Form.Control value={voucher} onChange={(e) => setVoucher(e.target.value.toUpperCase())} placeholder="Enter code" style={{ width: 180 }} />
        </Form.Group>
        <Button variant="outline-primary" disabled={busy} onClick={applyVoucher}>
          {voucher.trim() ? "Apply" : "Remove voucher"}
        </Button>
      </div>
      <div className="d-flex flex-wrap gap-2 align-items-end">
        <Form.Group>
          <Form.Label className="small">Type</Form.Label>
          <Form.Select value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: 180 }}>
            <option value="Cash">Cash</option>
            <option value="BankTransfer">Bank transfer</option>
            <option value="VNPay">VNPay (QR)</option>
          </Form.Select>
        </Form.Group>
        {method === "BankTransfer" && (
          <Form.Group>
            <Form.Label className="small">Transaction ID</Form.Label>
            <Form.Control value={txn} onChange={(e) => setTxn(e.target.value)} style={{ width: 200 }} />
          </Form.Group>
        )}
        <Button disabled={busy} onClick={pay}>
          <i className="bi bi-check2-circle" /> Thu {money(amountDue)}
        </Button>
      </div>
    </section>
  );
}
