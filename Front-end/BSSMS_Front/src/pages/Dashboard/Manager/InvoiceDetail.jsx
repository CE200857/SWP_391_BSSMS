// UC View Invoice & Payment — invoice detail dialog (opened from the invoice list).
import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Modal, Spinner, Table } from "react-bootstrap";
import { api, money, time5, label } from "../../../services/api";
import FloatingAlert from "../../../components/FloatingAlert";
import { needsRefund, StatusBadge } from "./invoiceShared";
import InvoicePaymentPanel, { startVnpayPayment } from "./InvoicePaymentPanel";
import CancelInvoiceForm from "./CancelInvoiceForm";
import RefundInvoiceForm from "./RefundInvoiceForm";

export default function InvoiceDetail({ invoiceId, role, onClose, onChanged }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(null); // "cancel" | "refund" | null

  const load = useCallback(async () => {
    try {
      const r = await api(`/api/invoices/${invoiceId}`);
      setD(r);
    } catch (e) {
      setError(e.message);
    }
  }, [invoiceId]);
  useEffect(() => { if (invoiceId) { setD(null); setError(""); setMode(null); load(); } }, [invoiceId, load]);

  // Each action lives in its own file: InvoicePaymentPanel (pay), CancelInvoiceForm, RefundInvoiceForm
  const afterAction = async (message) => {
    setMode(null);
    await load();
    onChanged(message);
  };
  const vnpay = async () => {
    setBusy(true);
    try {
      await startVnpayPayment(invoiceId);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const unpaid = d?.status === "Unpaid";
  const collectible = d?.invoiceType !== "Appointment" || ["Checked-in", "In-progress", "Completed"].includes(d?.appointmentStatus);
  const apptStart = d?.appointmentDate ? new Date(`${String(d.appointmentDate).slice(0, 10)}T${String(d.startTime || "00:00").slice(0, 5)}:00`) : null;
  const onlinePayable = d?.invoiceType !== "Appointment" || collectible
    || (["Pending", "Confirmed"].includes(d?.appointmentStatus) && apptStart && apptStart > new Date());
  const amountDue = Number(d?.totalAmount || 0);
  return (
    <Modal className="invoice-detail-modal" show={!!invoiceId} onHide={() => !busy && onClose()} size="xl" centered>
      <Modal.Header closeButton={!busy}>
        <Modal.Title>Invoice #{invoiceId}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <FloatingAlert message={error} onClose={() => setError("")} />
        {d && needsRefund(d) && !(d.refunds || []).length && (
          <Alert variant="warning">
            <i className="bi bi-arrow-counterclockwise me-1" />
            Appointment #{d.appointmentId} was cancelled after the customer paid {money(d.totalAmount)}.{" "}
            {role === "Manager" ? "Click “Refund” below to refund the full amount to the customer." : "The manager needs to open Invoices and click “Refund” to refund the customer."}
          </Alert>
        )}
        {!d && !error && <div className="text-center py-4"><Spinner animation="border" /></div>}
        {d && (
          <>
            <div className="invoice-detail-summary">
              <div className="invoice-detail-customer">
                <div className="invoice-detail-customer-icon"><i className="bi bi-person" /></div>
                <div className="invoice-detail-customer-info">
                  <strong>{d.customerName}</strong>
                  <span>{d.customerPhone} · Tier {d.tierName}</span>
                </div>
              </div>
              <div className="invoice-detail-meta">
                <span className="invoice-detail-eyebrow">{label(d.invoiceType)}{d.appointmentId ? ` · Appointment #${d.appointmentId}` : ""}</span>
                <StatusBadge row={d} className="invoice-detail-status" />
                {d.appointmentStatus && <small>Appointment: {label(d.appointmentStatus)}</small>}
                <small>{String(d.invoiceDate).slice(0, 16).replace("T", " ")}</small>
              </div>
            </div>

            <section className="invoice-detail-section">
              <div className="invoice-detail-section-heading"><i className="bi bi-list-ul invoice-detail-section-icon" /> Details</div>
              <div className="invoice-detail-table-wrap">
                <Table className="invoice-detail-table mb-0">
                  <thead><tr><th>Item</th><th>Time / Technician</th><th className="text-end">Unit price</th></tr></thead>
                  <tbody>
                    {(d.services || []).map((s) => (
                      <tr key={s.invoiceServiceId}>
                        <td className="invoice-detail-item-name">{s.serviceName}{s.isPackageSession ? <Badge bg="success" className="ms-2">Package sessions</Badge> : null}</td>
                        <td>{time5(s.startTime)}–{time5(s.endTime)} · {s.technicianName || "—"}</td>
                        <td className="text-end">{s.isPackageSession ? "0 ₫" : money(s.unitPrice)}</td>
                      </tr>
                    ))}
                    {(d.packages || []).map((p) => (
                      <tr key={p.treatmentPackageId}>
                        <td className="invoice-detail-item-name">Package {p.packageName}</td>
                        <td>{p.numberOfSessions} sessions · expires {p.validityDays} days</td>
                        <td className="text-end">{money(p.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <dl className="invoice-detail-totals">
                <div><dt>Subtotal</dt><dd>{money(d.subtotal)}</dd></div>
                <div><dt>Tier discount ({Number(d.discountPercent || 0)}%)</dt><dd>− {money(d.tierDiscount)}</dd></div>
                <div><dt>Voucher {d.voucherCode ? `(${d.voucherCode})` : ""}</dt><dd>− {money(d.voucherDiscount)}</dd></div>
                <div className="invoice-detail-amount"><dt>Amount to pay</dt><dd>{money(d.totalAmount)}</dd></div>
              </dl>
            </section>

            {(d.payments?.length > 0 || d.refunds?.length > 0) && (
              <section className="invoice-detail-section">
                <div className="invoice-detail-section-heading"><i className="bi bi-cash-stack invoice-detail-section-icon" /> Payment & refund</div>
                <ul className="mb-0">
                  {(d.payments || []).map((p) => (
                    <li key={p.paymentId}>{label(p.paymentMethod)} · {money(p.amount)} · {String(p.paymentDate).slice(0, 16).replace("T", " ")}{p.receivedBy ? ` · ${p.receivedBy}` : ""}{p.transactionCode ? ` · Transaction ID ${p.transactionCode}` : ""} · {label(p.status)}</li>
                  ))}
                  {(d.refunds || []).map((r) => (
                    <li key={r.refundId}>Refund {money(r.amount)} · {r.reason} · {label(r.status)}{r.approvedBy ? ` · ${r.approvedBy}` : ""}</li>
                  ))}
                </ul>
              </section>
            )}
            {d.cancellationReason && <Alert variant="light">Cancellation reason: {d.cancellationReason}</Alert>}

            {(role === "Receptionist" || role === "Manager") && unpaid && !collectible && (
              <Alert variant="light" className="border">
                <i className="bi bi-hourglass-split me-1" /> Payment not due yet: appointment #{d.appointmentId} {d.appointmentStatus === "Pending" || d.appointmentStatus === "Confirmed" ? "not checked in" : "no longer valid"}. Take payment after the customer arrives or after the service is done.
              </Alert>
            )}
            {(role === "Receptionist" || role === "Manager") && unpaid && collectible && (
              <InvoicePaymentPanel invoiceId={invoiceId} amountDue={amountDue} orderAmount={Number(d.subtotal || 0) - Number(d.tierDiscount || 0)} voucherCode={d.voucherCode} onDone={afterAction} onError={setError} />
            )}

            {mode === "cancel" && <CancelInvoiceForm invoiceId={invoiceId} onDone={afterAction} onBack={() => setMode(null)} onError={setError} />}
            {mode === "refund" && <RefundInvoiceForm invoiceId={invoiceId} totalAmount={d.totalAmount} onDone={afterAction} onBack={() => setMode(null)} onError={setError} />}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {d && role === "Customer" && unpaid && amountDue > 0 && !onlinePayable && (
          <small className="text-muted me-auto">The appointment time has passed: please pay at the counter.</small>
        )}
        {d && role === "Customer" && unpaid && amountDue > 0 && onlinePayable && (
          <Button disabled={busy} onClick={vnpay}><i className="bi bi-qr-code" /> VNPay payment</Button>
        )}
        {d && role === "Manager" && unpaid && !mode && <Button variant="outline-danger" onClick={() => setMode("cancel")}>Cancel invoice</Button>}
        {d && role === "Manager" && d.status === "Paid" && (d.invoiceType === "Package" || needsRefund(d)) && !mode && <Button variant="outline-danger" onClick={() => setMode("refund")}>Refund</Button>}
        {!mode && <Button variant="outline-secondary" disabled={busy} onClick={onClose}>Close</Button>}
      </Modal.Footer>
    </Modal>
  );
}
