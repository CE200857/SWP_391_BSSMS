import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Container, Card, Badge, Button, Spinner, Alert, Modal, Form, Table } from "react-bootstrap";
import BookingPaymentNotice from "../../../components/BookingPaymentNotice";
import AppointmentStatusBadge from "../../../components/AppointmentStatusBadge";
import { api, post, put, money, time5, viDate, label } from "../../../services/api";
import { appointmentStatusLabel } from "../../../utils/appointmentStatus";

const lineBadge = { Waiting: "secondary", InProgress: "primary", Done: "success" };

const AppointmentDetails = ({ user }) => {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.created ? "Đã tạo lịch hẹn." : location.state?.rescheduled ? "Đã đổi lịch hẹn." : "");
  const [busy, setBusy] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState("");
  const payment = new URLSearchParams(location.search).get("payment");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAppointment(await api(`/api/appointments/${id}`));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const run = async (key, action, message) => {
    setBusy(key);
    setError("");
    try {
      const result = await action();
      setNotice(typeof message === "function" ? message(result) : message);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const cancel = () =>
    run("cancel", () => put(`/api/appointments/${id}/cancel`, { reason: reason.trim() }), (r) => {
      setShowCancel(false);
      return r?.refundRequired
        ? "Đã hủy lịch hẹn. Hóa đơn đã thanh toán sẽ được quản lý xử lý hoàn tiền."
        : "Đã hủy lịch hẹn.";
    });

  const payOnline = () =>
    run("pay", async () => {
      const r = await post("/api/payments/vnpay/create", { invoiceId: appointment.invoice.invoiceId });
      window.location.assign(r.paymentUrl);
    }, "Đang chuyển sang VNPay...");

  if (loading && !appointment)
    return <div className="text-center py-5"><Spinner animation="border" variant="danger" /><p className="text-muted mt-2">Đang tải lịch hẹn...</p></div>;
  if (!appointment)
    return (
      <Container className="mt-4">
        <Alert variant="warning">{error || "Không tìm thấy lịch hẹn."}</Alert>
        <Button variant="secondary" onClick={() => navigate("/appointments")}>Quay lại danh sách</Button>
      </Container>
    );

  const actions = appointment.actions || [];
  const lines = appointment.services || [];
  const invoice = appointment.invoice;
  const isCustomer = user?.role === "Customer";
  const canPayOnline = isCustomer && invoice?.status === "Unpaid" && Number(invoice.totalAmount) > 0
    && appointment.canPayOnline !== false;

  return (
    <Container className="mt-4 appointment-detail-page">
      <div className="appointment-detail-heading">
        <div>
          <div className="appointment-detail-eyebrow">LỊCH HẸN · #{appointment.appointmentId}</div>
          <h1>Chi tiết lịch hẹn</h1>
          <p>{lines.length} dịch vụ · {viDate(appointment.appointmentDate)} · {time5(appointment.startTime)}–{time5(appointment.endTime)}</p>
        </div>
        <Button variant="light" className="appointment-detail-back" onClick={() => navigate("/appointments")}>
          <i className="bi bi-arrow-left"></i> Quay lại danh sách
        </Button>
      </div>

      {payment === "success" && <Alert variant="success">Thanh toán VNPay thành công.</Alert>}
      {payment === "failed" && <Alert variant="warning">Thanh toán VNPay không thành công. Lịch hẹn chuyển sang thanh toán tại quầy.</Alert>}
      {notice && <Alert variant="success" dismissible onClose={() => setNotice("")}>{notice}</Alert>}
      {!isCustomer && appointment.timingNote && (
        <Alert variant={/Quá hạn|Trễ/.test(appointment.timingNote) ? "warning" : "light"} className="py-2">
          <i className="bi bi-clock-history me-1"></i> {appointment.timingNote}
          {appointment.timingNote === "Quá hạn xác nhận" && " – lịch sẽ tự hủy theo BR-09. Có thể đổi sang giờ khác rồi xác nhận."}
          {appointment.timingNote === "Trễ quá 15 phút" && " – không check-in được nữa; đánh dấu Không đến hoặc đổi lịch (BR-10)."}
        </Alert>
      )}
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {isCustomer && appointment.status === "Pending" && <BookingPaymentNotice packageBooking={lines.every((l) => l.customerPackageId)} />}

      <Card className="appointment-detail-card">
        <Card.Header className="appointment-detail-card-header">
          <div>
            <span className="appointment-detail-label">MÃ LỊCH HẸN</span>
            <strong>#{appointment.appointmentId}</strong>
          </div>
          <AppointmentStatusBadge status={appointment.status} />
        </Card.Header>

        <Card.Body className="appointment-detail-card-body">
          <section className="appointment-detail-service">
            <div className="appointment-detail-icon"><i className="bi bi-stars"></i></div>
            <div>
              <span className="appointment-detail-label">DỊCH VỤ</span>
              <h2>{lines.map((l) => l.serviceName).join(" → ")}</h2>
            </div>
          </section>

          <div className="table-responsive mb-4">
            <Table className="align-middle mb-0 manager-list-table">
              <thead className="table-light">
                <tr>
                  <th>#</th><th>Dịch vụ</th><th>Giờ</th><th>Kỹ thuật viên</th><th>Phòng / giường</th><th>Thanh toán</th><th>Trạng thái</th>
                  {isCustomer && appointment.status === "Completed" && <th>Đánh giá</th>}
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.appointmentServiceId}>
                    <td>{l.lineNo}</td>
                    <td className="fw-semibold">{l.serviceName}<small className="d-block text-muted">{l.duration} phút · {label(l.requiredRoomType)}</small></td>
                    <td>{time5(l.startTime)}–{time5(l.endTime)}</td>
                    <td>{l.technicianName || <span className="text-muted">Phân công khi check-in</span>}{l.isRequestedTechnician ? <Badge bg="info" className="ms-1">Khách yêu cầu</Badge> : null}</td>
                    <td>{l.roomName ? `${l.roomName} · ${l.bedNumber}` : <span className="text-muted">—</span>}</td>
                    <td>{l.customerPackageId ? <Badge bg="success">Gói {l.packageName}</Badge> : money(l.unitPrice)}</td>
                    <td><Badge bg={lineBadge[l.status] || "secondary"}>{label(l.status)}</Badge></td>
                    {isCustomer && appointment.status === "Completed" && (
                      <td>
                        {Number(l.feedbackCount) > 0 ? (
                          <Button size="sm" variant="link" onClick={() => navigate("/my-feedback")}>Xem đánh giá</Button>
                        ) : (
                          <Button size="sm" variant="outline-danger" onClick={() => navigate(`/feedback/new?appointmentServiceId=${l.appointmentServiceId}`)}>Đánh giá</Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="appointment-detail-grid">
            <section className="appointment-detail-section">
              <h3><i className="bi bi-person-vcard"></i> Khách hàng</h3>
              <div className="appointment-detail-fields">
                <div className="appointment-detail-field"><span>Họ tên</span><strong>{appointment.customerName}</strong></div>
                <div className="appointment-detail-field"><span>Điện thoại</span><strong>{appointment.customerPhone}</strong></div>
                <div className="appointment-detail-field"><span>Hạng thành viên</span><strong>{appointment.tierName}</strong></div>
                {!isCustomer && (appointment.allergies || appointment.skinCondition) && (
                  <div className="appointment-detail-field">
                    <span>Lưu ý sức khỏe</span>
                    <strong className="text-danger">{[appointment.skinCondition, appointment.allergies && `Dị ứng: ${appointment.allergies}`].filter(Boolean).join(" · ")}</strong>
                  </div>
                )}
              </div>
            </section>

            <section className="appointment-detail-section">
              <h3><i className="bi bi-receipt"></i> Hóa đơn</h3>
              {invoice ? (
                <div className="appointment-detail-fields">
                  <div className="appointment-detail-field"><span>Mã hóa đơn</span><strong>#{invoice.invoiceId} · {label(invoice.status)}</strong></div>
                  <div className="appointment-detail-field"><span>Tạm tính</span><strong>{money(invoice.subtotal)}</strong></div>
                  <div className="appointment-detail-field"><span>Giảm giá</span><strong>{money(invoice.totalDiscount)}</strong></div>
                  <div className="appointment-detail-field"><span>Phải thanh toán</span><strong className="text-danger">{money(invoice.totalAmount)}</strong></div>
                  <div className="appointment-detail-field"><span>Hình thức</span><strong>{label(appointment.paymentChoice)}</strong></div>
                </div>
              ) : <p className="text-muted mb-0">Chưa có hóa đơn.</p>}
            </section>
          </div>

          <section className="appointment-detail-note">
            <h3><i className="bi bi-chat-left-text"></i> Ghi chú</h3>
            <p>{appointment.notes || "Không có ghi chú cho lịch hẹn này."}</p>
          </section>

          {appointment.cancellationReason && (
            <Alert variant="light" className="appointment-detail-cancellation">
              <strong>Lý do hủy:</strong> {appointment.cancellationReason}
            </Alert>
          )}

          {(actions.length > 0 || canPayOnline) && (
            <div className="appointment-detail-actions">
              {actions.includes("confirm") && (
                <Button disabled={!!busy} onClick={() => run("confirm", () => put(`/api/appointments/${id}/confirm`, {}), "Đã xác nhận lịch hẹn.")}>
                  <i className="bi bi-check2-circle"></i> Xác nhận lịch
                </Button>
              )}
              {actions.includes("checkin") && (
                <Button variant="success" onClick={() => navigate(`/receptionist/coordination?appointmentId=${id}`)}>
                  <i className="bi bi-door-open"></i> Check-in & phân công
                </Button>
              )}
              {actions.includes("serviceStatus") && (
                <Button variant="success" onClick={() => navigate("/treatment-status")}>
                  <i className="bi bi-play-circle"></i> Cập nhật trạng thái dịch vụ
                </Button>
              )}
              {canPayOnline && (
                <Button variant="outline-primary" disabled={!!busy} onClick={payOnline}>
                  <i className="bi bi-credit-card"></i> Thanh toán VNPay {money(invoice.totalAmount)}
                </Button>
              )}
              {actions.includes("reschedule") && (
                <Button className="appointment-detail-reschedule" onClick={() => navigate(`/appointments/${id}/reschedule`)}>
                  <i className="bi bi-calendar-event"></i> Đổi lịch
                </Button>
              )}
              {actions.includes("noShow") && (
                <Button variant="outline-dark" disabled={!!busy} onClick={() => run("noshow", () => put(`/api/appointments/${id}/no-show`, {}), "Đã đánh dấu khách không đến.")}>
                  <i className="bi bi-person-x"></i> Khách không đến
                </Button>
              )}
              {actions.includes("cancel") && (
                <Button variant="outline-danger" disabled={!!busy} onClick={() => { setReason(""); setShowCancel(true); }}>
                  <i className="bi bi-x-circle"></i> Hủy lịch
                </Button>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {appointment.history?.length > 0 && (
        <Card className="appointment-detail-card mt-4">
          <Card.Header className="appointment-detail-card-header"><strong>Lịch sử trạng thái</strong></Card.Header>
          <Card.Body>
            <ul className="list-unstyled mb-0">
              {appointment.history.map((h, i) => (
                <li key={i} className="mb-2">
                  <small className="text-muted">{String(h.changedAt).slice(0, 16).replace("T", " ")}</small>{" · "}
                  {h.oldStatus ? `${appointmentStatusLabel(h.oldStatus)} → ` : ""}<strong>{appointmentStatusLabel(h.newStatus)}</strong>
                  {h.reason ? ` · ${h.reason}` : ""}
                </li>
              ))}
            </ul>
          </Card.Body>
        </Card>
      )}

      <Modal show={showCancel} onHide={() => !busy && setShowCancel(false)} centered>
        <Modal.Header closeButton={!busy}><Modal.Title>Hủy lịch hẹn #{id}</Modal.Title></Modal.Header>
        <Form onSubmit={(e) => { e.preventDefault(); cancel(); }}>
          <Modal.Body>
            <p>Bạn muốn hủy lịch ngày {viDate(appointment.appointmentDate)} lúc {time5(appointment.startTime)}?</p>
            {invoice?.status === "Paid" && <Alert variant="info">Hóa đơn đã thanh toán sẽ được quản lý duyệt hoàn tiền.</Alert>}
            <Form.Group>
              <Form.Label>Lý do hủy *</Form.Label>
              <Form.Control as="textarea" rows={3} required maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" disabled={!!busy} onClick={() => setShowCancel(false)}>Giữ lịch hẹn</Button>
            <Button variant="danger" type="submit" disabled={!!busy || !reason.trim()}>{busy === "cancel" ? "Đang hủy…" : "Xác nhận hủy"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AppointmentDetails;
