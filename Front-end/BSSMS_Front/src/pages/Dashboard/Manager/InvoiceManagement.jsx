import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  Modal,
  Spinner,
  Table,
} from "react-bootstrap";
import { api, post, money } from "../../../services/api";
import { refundableAmount } from "../../../services/billing";
export default function InvoiceManagement({ user }) {
  const location = useLocation();
  const role = user?.role || "Manager";
  const [rows, setRows] = useState([]),
    [details, setDetails] = useState(null),
    [selected, setSelected] = useState(
      location.state?.createdInvoiceId || null,
    );
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [loading, setLoading] = useState(true),
    [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [action, setAction] = useState(null),
    [busy, setBusy] = useState(false);
  async function load() {
    setLoading(true);
    try {
      setRows(await api("/api/invoices"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the view while synchronizing external data for this selection.
    load();
  }, []);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the view while synchronizing external data for this selection.
    setDetailLoading(true);
    setDetails(null);
    setError("");
    api(`/api/invoices/${selected}`)
      .then((d) => {
        if (active) setDetails(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selected]);
  const invoice = details?.invoice,
    paid = (details?.payments || [])
      .filter((p) => p.status === "Success")
      .reduce((s, p) => s + Number(p.amount), 0);
  const refundable = refundableAmount(details),
    pending = (details?.refunds || []).some((r) => r.status === "Pending");
  function openAction(type, extra = {}) {
    setError("");
    setAction({
      type,
      reason: "",
      paymentMethod: "Cash",
      receivedAmount: invoice?.outstandingAmount || 0,
      requestKey: crypto.randomUUID(),
      ...extra,
    });
  }
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      let url, payload;
      if (action.type === "pay") {
        url = `/api/invoices/${selected}/payments`;
        payload = {
          paymentMethod: action.paymentMethod,
          receivedAmount: Number(action.receivedAmount),
          requestKey: action.requestKey,
          transactionCode: action.transactionCode || null,
        };
      } else if (action.type === "refund") {
        url = `/api/invoices/${selected}/refund`;
        payload = { amount: paid, reason: action.reason };
      } else if (action.type === "complete") {
        url = `/api/invoices/refunds/${action.refundId}/complete`;
        payload = { confirmedReturned: true };
      } else {
        url = `/api/invoices/${selected}/cancel`;
        payload = { reason: action.reason };
      }
      const r = await post(url, payload);
      setSuccess(r.message || "Đã cập nhật hóa đơn.");
      setAction(null);
      setDetails(await api(`/api/invoices/${selected}`));
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function onlinePayment() {
    setBusy(true);
    setError("");
    try {
      const r = await post("/api/payments/vnpay/create", {
        invoiceId: selected,
      });
      window.location.assign(r.paymentUrl);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  const table = (headers, records, cells) => (
    <div className="table-responsive">
      <Table size="sm" bordered>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={r.paymentId || r.refundId || r.auditId || i}>
              {cells(r)}
            </tr>
          ))}
        </tbody>
      </Table>
      {!records.length && <p className="text-muted">Chưa có dữ liệu.</p>}
    </div>
  );
  return (
    <section>
      <div className="ui-page-heading">
        <div>
          <h1>
            {role === "Customer" ? "Hóa đơn của tôi" : "Hóa đơn & thanh toán"}
          </h1>
          <p>Tra cứu hóa đơn, số dư và lịch sử giao dịch.</p>
        </div>
        <div className="d-flex gap-2">
          {role === "Receptionist" && (
            <Link className="btn btn-primary" to="/invoices/create">
              Tạo hóa đơn
            </Link>
          )}
          <Button variant="outline-primary" onClick={load} disabled={loading}>
            Làm mới
          </Button>
        </div>
      </div>
      {role === "Customer" && (
        <div className="booking-payment-notice">
          <i className="bi bi-info-circle" aria-hidden="true" />
          <div>
            <p className="mt-0">
              Bạn có thể thanh toán hóa đơn còn dư nợ tại quầy hoặc qua VNPay.
            </p>
          </div>
        </div>
      )}
      {error && !selected && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <Card>
        <Card.Body>
          <div className="ui-toolbar">
            <Form.Control
              aria-label="Tìm hóa đơn"
              placeholder="Mã hóa đơn, tên hoặc số điện thoại…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Form.Select
              aria-label="Trạng thái hóa đơn"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {["Unpaid", "Paid", "Refunded", "Cancelled"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Form.Select>
          </div>
          {loading ? (
            <div className="ui-empty">
              <Spinner animation="border" />
            </div>
          ) : (
            table(
              [
                "Mã",
                "Ngày",
                "Khách hàng",
                "Tổng tiền",
                "Đã thu",
                "Còn lại",
                "Trạng thái",
                "Chi tiết",
              ],
              rows.filter(
                (r) =>
                  (!status || r.status === status) &&
                  `${r.invoiceId} ${r.customerName} ${r.customerPhone}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
              ),
              (r) => (
                <>
                  <td>#{r.invoiceId}</td>
                  <td>{r.invoiceDate?.slice(0, 10)}</td>
                  <td>{r.customerName}</td>
                  <td>{money(r.totalAmount)}</td>
                  <td>{money(r.paidAmount)}</td>
                  <td>{money(r.outstandingAmount)}</td>
                  <td>
                    <Badge
                      bg={
                        r.status === "Paid"
                          ? "success"
                          : r.status === "Unpaid"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => setSelected(r.invoiceId)}
                    >
                      Xem
                    </Button>
                  </td>
                </>
              ),
            )
          )}
        </Card.Body>
      </Card>
      <Modal
        show={!!selected}
        onHide={() => !busy && !action && setSelected(null)}
        size="xl"
        centered
      >
        <Modal.Header closeButton={!busy}>
          <Modal.Title>Hóa đơn #{selected}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="invoice-print">
          {error && <Alert variant="danger">{error}</Alert>}
          {detailLoading ? (
            <Spinner animation="border" />
          ) : (
            invoice && (
              <>
                <div className="ui-page-heading">
                  <div>
                    <h2>{invoice.customerName}</h2>
                    <p>
                      {invoice.customerPhone} · {invoice.invoiceDate}
                    </p>
                  </div>
                  <Badge
                    bg={invoice.status === "Paid" ? "success" : "secondary"}
                  >
                    {invoice.status}
                  </Badge>
                </div>
                <h3>Chi tiết hàng hóa / dịch vụ</h3>
                {table(
                  ["Nội dung", "Số lượng", "Đơn giá", "Giảm giá", "Thành tiền"],
                  [
                    ...(details.services || []).map((r) => ({
                      ...r,
                      name: r.serviceName,
                      quantity: 1,
                    })),
                    ...(details.packages || []).map((r) => ({
                      ...r,
                      name: r.packageName,
                      quantity: 1,
                    })),
                    ...(details.products || []).map((r) => ({
                      ...r,
                      name: r.productName,
                    })),
                  ],
                  (r) => (
                    <>
                      <td>{r.name}</td>
                      <td>{r.quantity}</td>
                      <td>{money(r.unitPrice)}</td>
                      <td>{money(r.discountAmount)}</td>
                      <td>
                        {money(
                          r.quantity * Number(r.unitPrice) -
                            Number(r.discountAmount || 0),
                        )}
                      </td>
                    </>
                  ),
                )}
                <p>
                  Tạm tính: <strong>{money(invoice.subtotal)}</strong> · Giảm
                  giá: <strong>{money(invoice.discount)}</strong> · Tổng cộng:{" "}
                  <strong>{money(invoice.totalAmount)}</strong>
                </p>
                <p>
                  Đã thu: {money(invoice.paidAmount)} · Đã hoàn:{" "}
                  {money(invoice.refundedAmount)} · Còn phải thu:{" "}
                  <strong>{money(invoice.outstandingAmount)}</strong>
                </p>
                <h3>Thanh toán</h3>
                {table(
                  ["Mã giao dịch", "Phương thức", "Số tiền", "Trạng thái"],
                  details.payments || [],
                  (r) => (
                    <>
                      <td>{r.transactionCode || `#${r.paymentId}`}</td>
                      <td>{r.paymentMethod}</td>
                      <td>{money(r.amount)}</td>
                      <td>{r.status}</td>
                    </>
                  ),
                )}
                <h3>Hoàn tiền</h3>
                {table(
                  ["Mã", "Số tiền", "Lý do", "Trạng thái", "Xử lý"],
                  details.refunds || [],
                  (r) => (
                    <>
                      <td>#{r.refundId}</td>
                      <td>{money(r.amount)}</td>
                      <td>{r.reason}</td>
                      <td>{r.status}</td>
                      <td>
                        {role === "Manager" && r.status === "Pending" && (
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              openAction("complete", {
                                refundId: r.refundId,
                                paymentMethod: r.paymentMethod,
                              })
                            }
                          >
                            {r.paymentMethod === "VNPay"
                              ? "Hoàn / đối soát VNPay"
                              : "Xác nhận đã trả tiền"}
                          </Button>
                        )}
                      </td>
                    </>
                  ),
                )}
                {role !== "Customer" && (
                  <>
                    <h3>Lịch sử thao tác</h3>
                    {table(
                      ["Thao tác", "Lý do", "Thời gian"],
                      details.actions || [],
                      (r) => (
                        <>
                          <td>{r.actionName}</td>
                          <td>{r.reason}</td>
                          <td>{r.createdAt}</td>
                        </>
                      ),
                    )}
                  </>
                )}
              </>
            )
          )}
        </Modal.Body>
        <Modal.Footer className="no-print">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => setSelected(null)}
          >
            Đóng
          </Button>
          {["Receptionist", "Manager"].includes(role) && (
            <Button
              variant="outline-primary"
              onClick={() => window.print()}
              disabled={!invoice}
            >
              In hóa đơn
            </Button>
          )}
          {role === "Receptionist" &&
            invoice?.status === "Unpaid" &&
            !pending && (
              <Button disabled={busy} onClick={() => openAction("pay")}>
                Thu tiền
              </Button>
            )}
          {role === "Customer" && invoice?.status === "Unpaid" && !pending && (
            <Button disabled={busy} onClick={onlinePayment}>
              Thanh toán VNPay
            </Button>
          )}
          {role === "Manager" && invoice?.status === "Unpaid" && paid === 0 && (
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => openAction("cancel")}
            >
              Hủy hóa đơn
            </Button>
          )}
          {role === "Manager" &&
            ["Paid", "Unpaid"].includes(invoice?.status) &&
            refundable > 0 &&
            !pending && (
              <Button
                variant="warning"
                disabled={busy}
                onClick={() => openAction("refund")}
              >
                Yêu cầu hoàn toàn bộ
              </Button>
            )}
        </Modal.Footer>
      </Modal>
      <Modal show={!!action} onHide={() => !busy && setAction(null)} centered>
        <Form onSubmit={submit}>
          <Modal.Header closeButton={!busy}>
            <Modal.Title>
              {
                {
                  pay: "Thu tiền",
                  refund: "Yêu cầu hoàn tiền",
                  complete: "Xác nhận hoàn tiền",
                  cancel: "Hủy hóa đơn",
                }[action?.type]
              }
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {action?.type === "pay" ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Phương thức</Form.Label>
                  <Form.Select
                    disabled={busy}
                    value={action.paymentMethod}
                    onChange={(e) =>
                      setAction({
                        ...action,
                        paymentMethod: e.target.value,
                        requestKey: crypto.randomUUID(),
                      })
                    }
                  >
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Số tiền khách đưa (VND)</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    min=".01"
                    step=".01"
                    disabled={busy}
                    value={action.receivedAmount}
                    onChange={(e) =>
                      setAction({
                        ...action,
                        receivedAmount: e.target.value,
                        requestKey: crypto.randomUUID(),
                      })
                    }
                  />
                </Form.Group>
                <Form.Group className="mt-3">
                  <Form.Label>Mã chuyển khoản (nếu có)</Form.Label>
                  <Form.Control
                    value={action.transactionCode || ""}
                    onChange={(e) =>
                      setAction({ ...action, transactionCode: e.target.value })
                    }
                  />
                </Form.Group>
                <p className="text-muted mt-3">
                  Tiền thừa:{" "}
                  {money(
                    action.paymentMethod === "Cash"
                      ? Math.max(
                          0,
                          Number(action.receivedAmount) -
                            Number(invoice?.outstandingAmount || 0),
                        )
                      : 0,
                  )}
                </p>
              </>
            ) : action?.type === "complete" ? (
              <Alert variant="warning">
                {action?.paymentMethod === "VNPay"
                  ? "Gửi yêu cầu hoàn tiền đến VNPay. Nếu yêu cầu đã gửi, hệ thống chỉ đối soát trạng thái; chỉ ghi nhận hoàn tiền khi có phản hồi xác thực thành công."
                  : "Chỉ xác nhận sau khi đã thực sự trả tiền cho khách. Hệ thống cập nhật tồn kho và hoa hồng khi hoàn đủ."}
              </Alert>
            ) : (
              <>
                {action?.type === "refund" && (
                  <Alert variant="info">
                    Hoàn toàn bộ số tiền đã thu: {money(paid)}. Sau đó cần xác
                    nhận từng giao dịch đã trả tiền.
                  </Alert>
                )}
                <Form.Group>
                  <Form.Label>Lý do</Form.Label>
                  <Form.Control
                    as="textarea"
                    required
                    maxLength={500}
                    value={action?.reason || ""}
                    onChange={(e) =>
                      setAction({ ...action, reason: e.target.value })
                    }
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setAction(null)}
            >
              Quay lại
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Đang xử lý…" : "Xác nhận"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </section>
  );
}
