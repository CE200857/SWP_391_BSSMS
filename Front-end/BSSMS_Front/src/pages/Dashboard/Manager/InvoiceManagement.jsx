import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Card, Form, Modal, Spinner, Table } from "react-bootstrap";
import { api, post, money, viDate, time5, label } from "../../../services/api";
import servicePhoto03 from "../../../assets/figma/service-card-exact-03.png";
import { useManagerSearchFilter } from "../../../components/ManagerSearchFilter";
import "./InvoiceManagement.css";

const statusBg = { Paid: "success", Unpaid: "warning", Refunded: "info", Cancelled: "secondary" };

function paymentNotice(search) {
  const q = new URLSearchParams(search);
  const result = q.get("payment");
  const id = q.get("invoice");
  const name = id ? `hóa đơn #${id}` : "hóa đơn";
  if (result === "success") return { variant: "success", text: `Thanh toán ${name} qua VNPay thành công.` };
  if (result === "failed") return { variant: "warning", text: `Thanh toán ${name} qua VNPay không thành công. Bạn có thể thanh toán lại hoặc thanh toán tại quầy.` };
  if (result === "pending") return { variant: "warning", text: `Đang chờ VNPay xác nhận ${name}.` };
  if (result === "invalid" || result === "error") return { variant: "danger", text: "Không xác nhận được kết quả thanh toán. Vui lòng liên hệ quầy." };
  return null;
}

const needsRefund = (r) => r?.status === "Paid" && r?.invoiceType === "Appointment" && r?.appointmentStatus === "Cancelled";
const displayStatus = (r) => (needsRefund(r) ? "RefundPending" : r?.status);
const StatusBadge = ({ row, className }) => needsRefund(row)
  ? <Badge bg="danger" className={className}>Chờ hoàn tiền</Badge>
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
        <Modal.Title>Hóa đơn #{invoiceId}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {d && needsRefund(d) && !(d.refunds || []).length && (
          <Alert variant="warning">
            <i className="bi bi-arrow-counterclockwise me-1" />
            Lịch #{d.appointmentId} đã bị hủy sau khi khách thanh toán {money(d.totalAmount)}.{" "}
            {role === "Manager" ? "Bấm “Hoàn tiền” bên dưới để hoàn toàn bộ cho khách (UC-16.5)." : "Quản lý cần vào Hóa đơn và bấm “Hoàn tiền” để hoàn cho khách (UC-16.5)."}
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
                  <span>{d.customerPhone} · Hạng {d.tierName}</span>
                </div>
              </div>
              <div className="invoice-detail-meta">
                <span className="invoice-detail-eyebrow">{label(d.invoiceType)}{d.appointmentId ? ` · Lịch #${d.appointmentId}` : ""}</span>
                <StatusBadge row={d} className="invoice-detail-status" />
                {d.appointmentStatus && <small>Lịch hẹn: {label(d.appointmentStatus)}</small>}
                <small>{String(d.invoiceDate).slice(0, 16).replace("T", " ")}</small>
              </div>
            </div>

            <section className="invoice-detail-section">
              <div className="invoice-detail-section-heading"><i className="bi bi-list-ul invoice-detail-section-icon" /> Chi tiết</div>
              <div className="invoice-detail-table-wrap">
                <Table className="invoice-detail-table mb-0">
                  <thead><tr><th>Mục</th><th>Thời gian / KTV</th><th className="text-end">Đơn giá</th></tr></thead>
                  <tbody>
                    {(d.services || []).map((s) => (
                      <tr key={s.invoiceServiceId}>
                        <td className="invoice-detail-item-name">{s.serviceName}{s.isPackageSession ? <Badge bg="success" className="ms-2">Buổi gói</Badge> : null}</td>
                        <td>{time5(s.startTime)}–{time5(s.endTime)} · {s.technicianName || "—"}</td>
                        <td className="text-end">{s.isPackageSession ? "0 ₫" : money(s.unitPrice)}</td>
                      </tr>
                    ))}
                    {(d.packages || []).map((p) => (
                      <tr key={p.treatmentPackageId}>
                        <td className="invoice-detail-item-name">Gói {p.packageName}</td>
                        <td>{p.numberOfSessions} buổi · hạn {p.validityDays} ngày</td>
                        <td className="text-end">{money(p.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <dl className="invoice-detail-totals">
                <div><dt>Tạm tính</dt><dd>{money(d.subtotal)}</dd></div>
                <div><dt>Giảm theo hạng ({Number(d.discountPercent || 0)}%)</dt><dd>− {money(d.tierDiscount)}</dd></div>
                <div><dt>Voucher {d.voucherCode ? `(${d.voucherCode})` : ""}</dt><dd>− {money(d.voucherDiscount)}</dd></div>
                <div className="invoice-detail-amount"><dt>Phải thanh toán</dt><dd>{money(d.totalAmount)}</dd></div>
              </dl>
            </section>

            {(d.payments?.length > 0 || d.refunds?.length > 0) && (
              <section className="invoice-detail-section">
                <div className="invoice-detail-section-heading"><i className="bi bi-cash-stack invoice-detail-section-icon" /> Thanh toán & hoàn tiền</div>
                <ul className="mb-0">
                  {(d.payments || []).map((p) => (
                    <li key={p.paymentId}>{label(p.paymentMethod)} · {money(p.amount)} · {String(p.paymentDate).slice(0, 16).replace("T", " ")}{p.receivedBy ? ` · ${p.receivedBy}` : ""}{p.transactionCode ? ` · Mã GD ${p.transactionCode}` : ""} · {label(p.status)}</li>
                  ))}
                  {(d.refunds || []).map((r) => (
                    <li key={r.refundId}>Hoàn tiền {money(r.amount)} · {r.reason} · {label(r.status)}{r.approvedBy ? ` · ${r.approvedBy}` : ""}</li>
                  ))}
                </ul>
              </section>
            )}
            {d.cancellationReason && <Alert variant="light">Lý do hủy: {d.cancellationReason}</Alert>}

            {role === "Receptionist" && unpaid && !collectible && (
              <Alert variant="light" className="border">
                <i className="bi bi-hourglass-split me-1" /> Chưa đến lúc thu tiền: lịch #{d.appointmentId} {d.appointmentStatus === "Pending" || d.appointmentStatus === "Confirmed" ? "chưa check-in" : "không còn hiệu lực"}. Thu tiền khi khách đã đến hoặc sau khi làm xong dịch vụ.
              </Alert>
            )}
            {role === "Receptionist" && unpaid && collectible && (
              <section className="invoice-detail-section">
                <div className="invoice-detail-section-heading"><i className="bi bi-credit-card invoice-detail-section-icon" /> Thu tiền tại quầy</div>
                <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
                  <Form.Group>
                    <Form.Label className="small">Mã voucher</Form.Label>
                    <Form.Control value={voucher} onChange={(e) => setVoucher(e.target.value.toUpperCase())} placeholder="Nhập mã" style={{ width: 180 }} />
                  </Form.Group>
                  <Button variant="outline-primary" disabled={busy} onClick={() => run(() => post(`/api/invoices/${invoiceId}/voucher`, { voucherCode: voucher.trim() || null }), voucher.trim() ? "Đã áp dụng voucher." : "Đã bỏ voucher.")}>
                    {voucher.trim() ? "Áp dụng" : "Bỏ voucher"}
                  </Button>
                </div>
                <div className="d-flex flex-wrap gap-2 align-items-end">
                  <Form.Group>
                    <Form.Label className="small">Hình thức</Form.Label>
                    <Form.Select value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: 180 }}>
                      <option value="Cash">Tiền mặt</option>
                      <option value="BankTransfer">Chuyển khoản</option>
                      <option value="VNPay">VNPay (QR)</option>
                    </Form.Select>
                  </Form.Group>
                  {method === "BankTransfer" && (
                    <Form.Group>
                      <Form.Label className="small">Mã giao dịch</Form.Label>
                      <Form.Control value={txn} onChange={(e) => setTxn(e.target.value)} style={{ width: 200 }} />
                    </Form.Group>
                  )}
                  <Button disabled={busy} onClick={() => (method === "VNPay" ? vnpay() : run(
                    () => post(`/api/invoices/${invoiceId}/pay`, { paymentMethod: method, transactionCode: txn.trim() || null }),
                    `Đã thu ${money(amountDue)} cho hóa đơn #${invoiceId}.`,
                  ))}>
                    <i className="bi bi-check2-circle" /> Thu {money(amountDue)}
                  </Button>
                </div>
              </section>
            )}

            {mode && (
              <Form.Group className="mt-3">
                <Form.Label>{mode === "cancel" ? "Lý do hủy hóa đơn *" : "Lý do hoàn tiền *"}</Form.Label>
                <Form.Control as="textarea" rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
              </Form.Group>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {d && role === "Customer" && unpaid && amountDue > 0 && !onlinePayable && (
          <small className="text-muted me-auto">Đã qua giờ hẹn: vui lòng thanh toán tại quầy.</small>
        )}
        {d && role === "Customer" && unpaid && amountDue > 0 && onlinePayable && (
          <Button disabled={busy} onClick={vnpay}><i className="bi bi-qr-code" /> Thanh toán VNPay</Button>
        )}
        {d && role === "Manager" && unpaid && !mode && <Button variant="outline-danger" onClick={() => setMode("cancel")}>Hủy hóa đơn</Button>}
        {d && role === "Manager" && d.status === "Paid" && (d.invoiceType === "Package" || needsRefund(d)) && !mode && <Button variant="outline-danger" onClick={() => setMode("refund")}>Hoàn tiền</Button>}
        {mode && (
          <Button variant="danger" disabled={busy || !reason.trim()} onClick={() => run(
            () => post(`/api/invoices/${invoiceId}/${mode}`, { reason: reason.trim() }),
            (r) => (mode === "cancel" ? "Đã hủy hóa đơn." : r?.message || "Đã hoàn tiền."),
          )}>
            {mode === "cancel" ? "Xác nhận hủy" : `Xác nhận hoàn ${money(d?.totalAmount)}`}
          </Button>
        )}
        <Button variant="outline-secondary" disabled={busy} onClick={() => (mode ? setMode(null) : onClose())}>{mode ? "Quay lại" : "Đóng"}</Button>
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
  const filterRows = useMemo(() => rows.map((r) => ({ ...r, statusText: needsRefund(r) ? "Chờ hoàn tiền" : label(r.status) })), [rows]);
  const { filteredRows: managerRows, toolbar } = useManagerSearchFilter(
    filterRows,
    [
      { key: "invoiceId", label: "Mã hóa đơn", filterable: false },
      { key: "customerName", label: "Khách hàng" },
      { key: "customerPhone", label: "Số điện thoại", filterable: false },
      { key: "invoiceType", label: "Loại", formatValue: label },
      { key: "statusText", label: "Trạng thái" },
      { key: "invoiceDate", label: "Ngày tạo", type: "date" },
    ],
    "Tìm theo mã hóa đơn, khách hàng, số điện thoại...",
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
            <span className="seoul-eyebrow">TÀI KHOẢN · GIAO DỊCH</span>
            <h1>Hóa đơn của tôi</h1>
            <p>Tra cứu hóa đơn lịch hẹn, gói liệu trình và lịch sử thanh toán tại Seoul Center.</p>
            <span className="public-service-hero-note"><i className="bi bi-receipt" aria-hidden="true" /> Thanh toán an toàn tại quầy hoặc qua VNPay</span>
          </div>
          <img src={servicePhoto03} alt="Trải nghiệm chăm sóc tại Seoul Center" />
        </section>
      )}
      <section className={role === "Customer" ? "public-service-content customer-invoices-content" : undefined}>
        <div className={`ui-page-heading${role === "Customer" ? " customer-invoices-heading" : ""}`}>
          <div>
            <h1>{role === "Customer" ? "Hóa đơn của tôi" : "Hóa đơn & thanh toán"}</h1>
            <p>Mỗi lịch hẹn có một hóa đơn; buổi dùng gói được tính 0 ₫.</p>
          </div>
          <div className="d-flex gap-2">
            {role === "Receptionist" && <Button onClick={() => navigate("/invoices/create")}><i className="bi bi-cash-coin" /> Thu ngân</Button>}
            <Button variant="outline-primary" onClick={load} disabled={loading}>Làm mới</Button>
          </div>
        </div>
        {paymentNote && <Alert variant={paymentNote.variant}>{paymentNote.text}</Alert>}
        {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}
        {role !== "Customer" && (
          <div className="d-flex gap-3 mb-3 flex-wrap">
            <Card className="invoice-summary-card invoice-summary-card--due"><Card.Body><small>Chưa thanh toán</small><strong className="d-block">{money(dueTotal)}</strong></Card.Body></Card>
            <Card className="invoice-summary-card"><Card.Body><small>Số hóa đơn</small><strong className="d-block">{rows.length}</strong></Card.Body></Card>
            {rows.some(needsRefund) && (
              <Card className="invoice-summary-card invoice-summary-card--due"><Card.Body><small>Chờ hoàn tiền</small><strong className="d-block">{rows.filter(needsRefund).length} hóa đơn</strong></Card.Body></Card>
            )}
          </div>
        )}
        <Card className={role === "Customer" ? "customer-invoices-card" : undefined}>
          <Card.Body>
            {role === "Manager" ? (
              <div className="manager-list-toolbar mb-3">{toolbar}</div>
            ) : (
              <div className="ui-toolbar">
                <Form.Control aria-label="Tìm hóa đơn" placeholder="Mã hóa đơn, tên, số điện thoại hoặc gói…" value={query} onChange={(e) => setQuery(e.target.value)} />
                <Form.Select aria-label="Trạng thái hóa đơn" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">Tất cả trạng thái</option>
                  {["Unpaid", "Paid", "RefundPending", "Refunded", "Cancelled"].map((s) => <option key={s} value={s}>{s === "RefundPending" ? "Chờ hoàn tiền" : label(s)}</option>)}
                </Form.Select>
              </div>
            )}
            {loading ? (
              <div className="ui-empty"><Spinner animation="border" /></div>
            ) : (
              <Table hover responsive className="align-middle mb-0 manager-list-table invoice-list-table">
                <thead><tr><th>Mã</th><th>Khách hàng</th><th>Nội dung</th><th>Thành tiền</th><th>Trạng thái</th><th>Chi tiết</th></tr></thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.invoiceId}>
                      <td>#{r.invoiceId}</td>
                      <td><strong>{r.customerName}</strong><div className="small text-muted">{viDate(r.invoiceDate)}</div></td>
                      <td>
                        {r.invoiceType === "Package" ? `Gói ${r.packageName || ""}` : `Lịch #${r.appointmentId} · ${viDate(r.appointmentDate)} ${time5(r.startTime)}`}
                        {r.paymentMethod && <div className="small text-muted">{label(r.paymentMethod)}</div>}
                      </td>
                      <td><strong>{money(r.totalAmount)}</strong>{Number(r.totalDiscount) > 0 && <div className="small text-muted">Đã giảm {money(r.totalDiscount)}</div>}</td>
                      <td>
                        <StatusBadge row={r} />
                      </td>
                      <td>
                        <div className="manager-list-actions">
                          <Button size="sm" variant="link" className="manager-list-action manager-list-action--view" onClick={() => setSelected(r.invoiceId)}>
                            <i className="bi bi-eye-fill" aria-hidden="true" /> Xem
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!visible.length && <tr><td colSpan={6} className="text-center text-muted py-4">Không có hóa đơn.</td></tr>}
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
