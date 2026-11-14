import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Card, Col, Container, Form, ListGroup, Row, Spinner, Table } from "react-bootstrap";
import AppointmentStatusBadge from "../../../components/AppointmentStatusBadge";
import { api, post, money, viDate, time5 } from "../../../services/api";

function SellPackage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState(null);
  const [packageId, setPackageId] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [method, setMethod] = useState("Cash");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/api/customers").then((r) => setCustomers((r || []).filter((c) => c.status === "Active"))).catch((e) => setError(e.message));
    api("/api/treatment-packages?activeOnly=true").then(setPackages).catch((e) => setError(e.message));
  }, []);
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? customers.filter((c) => `${c.fullName} ${c.phone}`.toLowerCase().includes(q)).slice(0, 8) : [];
  }, [customers, search]);
  const pkg = packages.find((p) => String(p.treatmentPackageId) === String(packageId));
  const tierPercent = Number(customer?.membership?.discountPercent || 0);

  const sell = async () => {
    setSaving(true);
    setError("");
    try {
      const r = await post("/api/customer-packages/sell", {
        customerId: customer.customerId, treatmentPackageId: Number(packageId), voucherCode: voucherCode.trim() || null, paymentMethod: method,
      });
      if (method === "VNPay") {
        const pay = await post("/api/payments/vnpay/create", { invoiceId: r.invoiceId });
        window.location.assign(pay.paymentUrl);
        return;
      }
      setResult(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container fluid className="mt-4 px-4">
      <h2 className="manager-page-title fw-bold mb-1">Bán gói liệu trình</h2>
      <p className="text-muted mb-4">Gói được kích hoạt ngay khi thanh toán thành công; hạn dùng tính từ ngày mua.</p>
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {result && (
        <Alert variant="success">
          Đã bán gói cho {customer?.fullName}. Hóa đơn #{result.invoiceId} · {money(result.totalAmount)}
          {result.customerPackage && <> · {result.customerPackage.totalSessions} buổi, hạn đến {viDate(result.customerPackage.expiryDate)}</>}
          <div className="mt-2 d-flex gap-2">
            <Button size="sm" onClick={() => navigate(`/invoices?invoice=${result.invoiceId}`)}>Xem hóa đơn</Button>
            <Button size="sm" variant="outline-success" onClick={() => { setResult(null); setPackageId(""); setVoucherCode(""); }}>Bán gói khác</Button>
          </div>
        </Alert>
      )}
      <Row className="g-4">
        <Col lg={7}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white fw-bold">1. Khách hàng</Card.Header>
            <Card.Body>
              {customer ? (
                <div className="d-flex justify-content-between align-items-center">
                  <span><strong>{customer.fullName}</strong> · {customer.phone} {customer.membership && <Badge bg="info">{customer.membership.tierName}</Badge>}</span>
                  <Button variant="link" onClick={() => setCustomer(null)}>Đổi</Button>
                </div>
              ) : (
                <>
                  <Form.Control placeholder="Tìm theo tên hoặc số điện thoại..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  <ListGroup className="mt-2">
                    {matches.map((c) => <ListGroup.Item action key={c.customerId} onClick={() => setCustomer(c)}>{c.fullName} · {c.phone}</ListGroup.Item>)}
                  </ListGroup>
                </>
              )}
            </Card.Body>
          </Card>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white fw-bold">2. Gói liệu trình</Card.Header>
            <Card.Body>
              <Form.Select value={packageId} onChange={(e) => setPackageId(e.target.value)}>
                <option value="">-- Chọn gói --</option>
                {packages.map((p) => <option key={p.treatmentPackageId} value={p.treatmentPackageId}>{p.packageName} · {p.numberOfSessions} buổi · {money(p.price)}</option>)}
              </Form.Select>
              {pkg && (
                <p className="text-muted small mt-2 mb-0">
                  Dịch vụ áp dụng: {(pkg.services || []).map((s) => s.serviceName).join(", ")} · Hạn dùng {pkg.validityDays} ngày
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white fw-bold">3. Thanh toán</Card.Header>
            <Card.Body>
              <p className="mb-1">Giá gói: <strong>{pkg ? money(pkg.price) : "—"}</strong></p>
              {tierPercent > 0 && <p className="mb-1 text-muted small">Giảm theo hạng {customer.membership.tierName}: {tierPercent}% (trừ khi lập hóa đơn)</p>}
              <Form.Group className="my-3">
                <Form.Label>Mã voucher</Form.Label>
                <Form.Control value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Hình thức thanh toán</Form.Label>
                <Form.Select value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="Cash">Tiền mặt</option>
                  <option value="BankTransfer">Chuyển khoản</option>
                  <option value="VNPay">VNPay</option>
                </Form.Select>
              </Form.Group>
              <Button className="w-100 fw-bold" disabled={saving || !customer || !packageId || !!result} onClick={sell}>
                {saving ? <Spinner size="sm" /> : "Thanh toán & kích hoạt gói"}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

function Cashier() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api("/api/invoices/unpaid-appointments"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <Container fluid className="mt-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="manager-page-title fw-bold mb-1">Thu ngân</h2>
          <p className="text-muted mb-0">Các lịch hẹn còn hóa đơn chưa thanh toán. Mở hóa đơn để áp voucher và thu tiền.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={load}><i className="bi bi-arrow-clockwise" /> Làm mới</Button>
          <Button onClick={() => navigate("/sell-treatment-package")}><i className="bi bi-box-seam" /> Bán gói liệu trình</Button>
        </div>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table hover responsive className="align-middle mb-0 manager-list-table">
            <thead className="table-dark"><tr><th>Hóa đơn</th><th>Lịch hẹn</th><th>Khách hàng</th><th>Dịch vụ</th><th>Trạng thái lịch</th><th>Phải thu</th><th /></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-4"><Spinner animation="border" size="sm" /></td></tr> : rows.map((r) => (
                <tr key={r.invoiceId}>
                  <td className="fw-bold">#{r.invoiceId}</td>
                  <td>#{r.appointmentId}<small className="d-block text-muted">{viDate(r.appointmentDate)} {time5(r.startTime)}</small></td>
                  <td>{r.customerName}<small className="d-block text-muted">{r.customerPhone}</small></td>
                  <td>{r.serviceNames}</td>
                  <td><AppointmentStatusBadge status={r.appointmentStatus} /></td>
                  <td className="fw-bold text-danger">{money(r.totalAmount)}</td>
                  <td>
                    {r.canCollect === false ? (
                      <span className="d-inline-block" title={r.collectNote || ""}>
                        <Button size="sm" variant="outline-secondary" disabled>Chưa đến lúc thu</Button>
                        <small className="d-block text-muted mt-1">Thu khi khách đã check-in</small>
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => navigate(`/invoices?invoice=${r.invoiceId}`)}>Thu tiền</Button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && !rows.length && <tr><td colSpan={7} className="text-center text-muted py-4">Không có hóa đơn nào chờ thu.</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default function CreateInvoice({ packageOnly = false }) {
  return packageOnly ? <SellPackage /> : <Cashier />;
}
