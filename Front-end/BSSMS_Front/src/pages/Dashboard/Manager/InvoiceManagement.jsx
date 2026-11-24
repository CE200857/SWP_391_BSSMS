import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Form, Spinner, Table } from "react-bootstrap";
import { api, money, viDate, label } from "../../../services/api";
import servicePhoto03 from "../../../assets/figma/service-card-exact-03.png";
import { useManagerSearchFilter } from "../../../components/ManagerSearchFilter";
import "./InvoiceManagement.css";
import FloatingAlert from "../../../components/FloatingAlert";
import { needsRefund, displayStatus, StatusBadge } from "./invoiceShared";
import InvoiceDetail from "./InvoiceDetail";

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
