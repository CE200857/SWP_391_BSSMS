import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Card, Form, Modal, Spinner, Table } from "react-bootstrap";
import { api, post, money, viDate, time5, label } from "../../../services/api";
import servicePhoto03 from "../../../assets/figma/service-card-exact-03.png";
import { useManagerSearchFilter } from "../../../components/ManagerSearchFilter";
import "./InvoiceManagement.css";
import FloatingAlert from "../../../components/FloatingAlert";

const statusBg = { Paid: "success", Unpaid: "warning", Refunded: "info", Cancelled: "secondary" };

function paymentNotice(search) {
  const q = new URLSearchParams(search);
  const result = q.get("payment");
  const id = q.get("invoice");
  const name = id ? `invoice #${id}` : "invoices";
  if (result === "success") return { variant: "success", text: `Pay ${name} via VNPay succeeded.` };
  if (result === "failed") return { variant: "warning", text: `Pay ${name} via VNPay failed. You can pay again or pay at the counter.` };
  if (result === "pending") return { variant: "warning", text: `Waiting for VNPay confirmation ${name}.` };
  if (result === "invalid" || result === "error") return { variant: "danger", text: "Could not confirm the payment result. Please contact the counter." };
  return null;
}

const needsRefund = (r) => r?.status === "Paid" && r?.invoiceType === "Appointment" && r?.appointmentStatus === "Cancelled";
const displayStatus = (r) => (needsRefund(r) ? "RefundPending" : r?.status);
const StatusBadge = ({ row, className }) => needsRefund(row)
  ? <Badge bg="danger" className={className}>Awaiting refund</Badge>
  : <Badge bg={statusBg[row.status]} className={className}>{label(row.status)}</Badge>;

function InvoiceDetail({ invoiceId, role, onClose, onChanged }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [voucher, setVoucher] = useState("");
  const [method, setMethod] = useState("Cash");
  const [txn, setTxn] = useState("");
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await api(`/api/invoices/${invoiceId}`);
      setD(r);
      setVoucher(r.voucherCode || "");
    } catch (e) {
      setError(e.message);
    }
  }, [invoiceId]);
  useEffect(() => { if (invoiceId) { setD(null); setError(""); setMode(null); setReason(""); load(); } }, [invoiceId, load]);

  const run = async (fn, message) => {
    setBusy(true);
    setError("");
    try {
      const r = await fn();
      await load();
      onChanged(typeof message === "function" ? message(r) : message);
      setMode(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const vnpay = async () => {
    setBusy(true);
    try {
      const r = await post("/api/payments/vnpay/create", { invoiceId });
      window.location.assign(r.paymentUrl);
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
              <section className="invoice-detail-section">
                <div className="invoice-detail-section-heading"><i className="bi bi-credit-card invoice-detail-section-icon" /> Take payment at the counter</div>
                <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
                  <Form.Group>
                    <Form.Label className="small">Voucher code</Form.Label>
                    <Form.Control value={voucher} onChange={(e) => setVoucher(e.target.value.toUpperCase())} placeholder="Enter code" style={{ width: 180 }} />
                  </Form.Group>
                  <Button variant="outline-primary" disabled={busy} onClick={() => run(() => post(`/api/invoices/${invoiceId}/voucher`, { voucherCode: voucher.trim() || null }), voucher.trim() ? "Voucher applied." : "Voucher removed.")}>
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
                  <Button disabled={busy} onClick={() => (method === "VNPay" ? vnpay() : run(
                    () => post(`/api/invoices/${invoiceId}/pay`, { paymentMethod: method, transactionCode: txn.trim() || null }),
                    `Collected ${money(amountDue)} for invoice #${invoiceId}.`,
                  ))}>
                    <i className="bi bi-check2-circle" /> Thu {money(amountDue)}
                  </Button>
                </div>
              </section>
            )}

            {mode && (
              <Form.Group className="mt-3">
                <Form.Label>{mode === "cancel" ? "Invoice cancellation reason *" : "Refund reason *"}</Form.Label>
                <Form.Control as="textarea" rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
              </Form.Group>
            )}
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
        {mode && (
          <Button variant="danger" disabled={busy || !reason.trim()} onClick={() => run(
            () => post(`/api/invoices/${invoiceId}/${mode}`, { reason: reason.trim() }),
            (r) => (mode === "cancel" ? "Invoice cancelled." : r?.message || "Refunded."),
          )}>
            {mode === "cancel" ? "Confirm cancellation" : `Confirm refund ${money(d?.totalAmount)}`}
          </Button>
        )}
        <Button variant="outline-secondary" disabled={busy} onClick={() => (mode ? setMode(null) : onClose())}>{mode ? "Back" : "Close"}</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default function InvoiceManagement({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentNote] = useState(() => paymentNotice(location.search));
  const role = user?.role || "Manager";
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(() => Number(new URLSearchParams(location.search).get("invoice")) || location.state?.invoiceId || null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const filterRows = useMemo(() => rows.map((r) => ({ ...r, statusText: needsRefund(r) ? "Awaiting refund" : label(r.status) })), [rows]);
  const { filteredRows: managerRows, toolbar } = useManagerSearchFilter(
    filterRows,
    [
      { key: "invoiceId", label: "Invoice ID", filterable: false },
      { key: "customerName", label: "Customer" },
      { key: "customerPhone", label: "Phone number", filterable: false },
      { key: "invoiceType", label: "Type", formatValue: label },
      { key: "statusText", label: "Status" },
      { key: "invoiceDate", label: "Created date", type: "date" },
    ],
    "Search by invoice ID, customer, phone number...",
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api("/api/invoices"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => (role === "Manager" ? managerRows : rows.filter((r) =>
    (!status || displayStatus(r) === status) &&
    `${r.invoiceId} ${r.customerName} ${r.customerPhone} ${r.packageName || ""}`.toLowerCase().includes(query.toLowerCase()))),
  [role, managerRows, rows, status, query]);
  const dueTotal = rows.filter((r) => r.status === "Unpaid").reduce((n, r) => n + Number(r.totalAmount), 0);

  return (
    <div className={role === "Customer" ? "public-service-page customer-invoices-page" : "invoice-management-page"}>
      {role === "Customer" && (
        <section className="public-service-hero customer-invoices-hero">
          <div className="public-service-hero-copy">
            <span className="seoul-eyebrow">ACCOUNT · TRANSACTIONS</span>
            <h1>My invoices</h1>
            <p>Look up appointment invoices, treatment packages and payment history at Seoul Center.</p>
            <span className="public-service-hero-note"><i className="bi bi-receipt" aria-hidden="true" /> Pay safely at the counter or via VNPay</span>
          </div>
          <img src={servicePhoto03} alt="Care experience at Seoul Center" />
        </section>
      )}
      <section className={role === "Customer" ? "public-service-content customer-invoices-content" : undefined}>
        <div className={`ui-page-heading${role === "Customer" ? " customer-invoices-heading" : ""}`}>
          <div>
            <h1>{role === "Customer" ? "My invoices" : "Invoice & payment"}</h1>
            <p>Each appointment has one invoice; package sessions are charged 0 ₫.</p>
          </div>
          <div className="d-flex gap-2">
            {(role === "Receptionist" || role === "Manager") && <Button onClick={() => navigate("/invoices/create")}><i className="bi bi-cash-coin" /> Payments</Button>}
            <Button variant="outline-primary" onClick={load} disabled={loading}>Refresh</Button>
          </div>
        </div>
        {paymentNote && <Alert variant={paymentNote.variant}>{paymentNote.text}</Alert>}
        <FloatingAlert message={error} onClose={() => setError("")} />
        <FloatingAlert message={success} variant="success" onClose={() => setSuccess("")} />
        {role !== "Customer" && (
          <div className="d-flex gap-3 mb-3 flex-wrap">
            <Card className="invoice-summary-card invoice-summary-card--due"><Card.Body><small>Unpaid</small><strong className="d-block">{money(dueTotal)}</strong></Card.Body></Card>
            <Card className="invoice-summary-card"><Card.Body><small>Number of invoices</small><strong className="d-block">{rows.length}</strong></Card.Body></Card>
            {rows.some(needsRefund) && (
              <Card className="invoice-summary-card invoice-summary-card--due"><Card.Body><small>Awaiting refund</small><strong className="d-block">{rows.filter(needsRefund).length} invoices</strong></Card.Body></Card>
            )}
          </div>
        )}
        <Card className={role === "Customer" ? "customer-invoices-card" : undefined}>
          <Card.Body>
            {role === "Manager" ? (
              <div className="manager-list-toolbar mb-3">{toolbar}</div>
            ) : (
              <div className="ui-toolbar">
                <Form.Control aria-label="Search invoices" placeholder="Invoice ID, name, phone number or package…" value={query} onChange={(e) => setQuery(e.target.value)} />
                <Form.Select aria-label="Invoice status" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All statuses</option>
                  {["Unpaid", "Paid", "RefundPending", "Refunded", "Cancelled"].map((s) => <option key={s} value={s}>{s === "RefundPending" ? "Awaiting refund" : label(s)}</option>)}
                </Form.Select>
              </div>
            )}
            {loading ? (
              <div className="ui-empty"><Spinner animation="border" /></div>
            ) : (
              <Table hover responsive className="align-middle mb-0 manager-list-table invoice-list-table">
                <thead><tr><th>Code</th><th>Customer</th><th>Content</th><th>Total</th><th>Status</th><th>Details</th></tr></thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.invoiceId}>
                      <td>#{r.invoiceId}</td>
                      {/* Mỗi ô 1 dòng; ngày, phương thức thanh toán và tiền giảm hiện khi rê chuột vào */}
                      <td className="fw-semibold text-dark" title={`Invoice date ${viDate(r.invoiceDate)}`}>{r.customerName}</td>
                      <td title={r.paymentMethod ? label(r.paymentMethod) : undefined}>
                        {r.invoiceType === "Package" ? (r.packageName || "Package") : `Appointment #${r.appointmentId}`}
                      </td>
                      <td className="fw-semibold text-nowrap" title={Number(r.totalDiscount) > 0 ? `Discount ${money(r.totalDiscount)}` : undefined}>{money(r.totalAmount)}</td>
                      <td>
                        <StatusBadge row={r} />
                      </td>
                      <td>
                        <div className="manager-list-actions">
                          <Button size="sm" variant="link" className="manager-list-action manager-list-action--view" onClick={() => setSelected(r.invoiceId)}>
                            <i className="bi bi-eye-fill" aria-hidden="true" /> View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!visible.length && <tr><td colSpan={6} className="text-center text-muted py-4">No invoices.</td></tr>}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </section>
      <InvoiceDetail invoiceId={selected} role={role} onClose={() => setSelected(null)} onChanged={(m) => { setSuccess(m); load(); }} />
    </div>
  );
}
