import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Container,
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
  Modal,
  Form,
} from "react-bootstrap";

import BookingPaymentNotice from "../../../components/BookingPaymentNotice";

const AppointmentDetails = ({ user }) => {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // Feedback cho appointment này (chỉ load khi status = Completed)
  const [feedback, setFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await fetch(`/api/appointments/${id}`);

        if (!response.ok) {
          throw new Error("Không thể lấy thông tin lịch hẹn.");
        }

        const data = await response.json();

        setAppointment(data);
      } catch (error) {
        console.error("Lỗi khi lấy chi tiết lịch hẹn:", error);
        setError("Không thể tải thông tin lịch hẹn.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  // Khi appointment đã Completed -> gọi API lấy feedback (nếu có)
  useEffect(() => {
    if (!appointment || appointment.status !== "Completed") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the view while synchronizing external data for this selection.
      setFeedback(null);
      return;
    }

    let cancelled = false;
    const loadFeedback = async () => {
      try {
        setFeedbackLoading(true);
        const res = await fetch(
          `/api/feedback?appointmentId=${appointment.appointmentId}`,
        );
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Lấy feedback mới nhất của appointment này
            if (!cancelled) setFeedback(data[0]);
          } else if (!cancelled) {
            setFeedback(null);
          }
        } else if (!cancelled) {
          setFeedback(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Lỗi tải feedback:", err);
          setFeedback(null);
        }
      } finally {
        if (!cancelled) setFeedbackLoading(false);
      }
    };

    loadFeedback();

    return () => {
      cancelled = true;
    };
  }, [appointment]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Confirmed":
        return <Badge bg="success">Đã xác nhận</Badge>;

      case "Booked":
        return <Badge bg="primary">Đã đặt</Badge>;

      case "Completed":
        return <Badge bg="info">Hoàn thành</Badge>;

      case "Cancelled":
        return <Badge bg="danger">Đã hủy</Badge>;

      case "No-show":
      case "No Show":
        return <Badge bg="warning" text="dark">Không đến</Badge>;

      case "Pending": return <Badge bg="secondary">Chờ xác nhận</Badge>;
      case "Checked-in": case "Checked In": return <Badge bg="info">Đã đến</Badge>;
      case "In-progress": case "In Progress": return <Badge bg="primary">Đang thực hiện</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Render 5 sao theo rating (filled = vàng, còn lại = xám)
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`bi ${
            i <= rating ? "bi-star-fill text-warning" : "bi-star text-secondary"
          }`}
          style={{ fontSize: "20px", marginRight: "4px" }}
        />,
      );
    }
    return stars;
  };

  const formatFeedbackDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const handleCancel = async () => {
    if (cancelling) return;
    if (!reason.trim()) {
      setCancelError("Vui lòng nhập lý do hủy lịch.");
      return;
    }

    try {
      setCancelling(true);
      setCancelError("");

      const response = await fetch(`/api/appointments/${id}/cancel`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Không thể hủy lịch hẹn. Vui lòng thử lại.");
      }

      setAppointment((prev) => ({
        ...prev,
        status: "Cancelled",
        cancellationReason: reason.trim(),
      }));
      setShowCancel(false);
      setCancelSuccess(true);
    } catch (error) {
      console.error("Lỗi cancel appointment:", error);
      setCancelError(error.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Đang tải thông tin lịch hẹn...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>

        <Button variant="secondary" onClick={() => navigate("/appointments")}>
          Quay lại danh sách
        </Button>
      </Container>
    );
  }

  if (!appointment) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Không tìm thấy lịch hẹn.</Alert>

        <Button variant="secondary" onClick={() => navigate("/appointments")}>
          Quay lại danh sách
        </Button>
      </Container>
    );
  }

  const canModify =
    appointment.status === "Pending" ||
    appointment.status === "Booked" ||
    appointment.status === "Confirmed";

  return (
    <Container className="mt-4 appointment-detail-page">
      <div className="appointment-detail-heading">
        <div>
          <div className="appointment-detail-eyebrow">LỊCH HẸN · #{appointment.appointmentId}</div>
          <h1>Chi tiết lịch hẹn</h1>
          <p>Thông tin dịch vụ và thời gian đặt hẹn</p>
        </div>
        <Button variant="light" className="appointment-detail-back" onClick={() => navigate("/appointments")}>
          <i className="bi bi-arrow-left"></i>
          Quay lại danh sách
        </Button>
      </div>

      {user?.role === "Customer" && (
        <>
          {location.state?.bookingCreated && appointment.status === "Pending" && (
            <Alert variant="success" role="status">
              Đã gửi yêu cầu đặt lịch #{appointment.appointmentId}. Theo dõi
              trạng thái bên dưới để biết khi lễ tân xác nhận.
            </Alert>
          )}
          {appointment.status === "Pending" && <BookingPaymentNotice
            packageBooking={Boolean(appointment.customerPackageId)}
          />}
        </>
      )}
      <Card className="appointment-detail-card">
        <Card.Header className="appointment-detail-card-header">
          <div>
            <span className="appointment-detail-label">MÃ LỊCH HẸN</span>
            <strong>#{appointment.appointmentId}</strong>
          </div>
          {getStatusBadge(appointment.status)}
        </Card.Header>

        <Card.Body className="appointment-detail-card-body">
          <section className="appointment-detail-service">
            <div className="appointment-detail-icon"><i className="bi bi-stars"></i></div>
            <div>
              <span className="appointment-detail-label">DỊCH VỤ</span>
              <h2>{appointment.serviceName}</h2>
            </div>
          </section>

          <div className="appointment-detail-grid">
            <section className="appointment-detail-section">
              <h3><i className="bi bi-calendar2-week"></i> Thời gian</h3>
              <div className="appointment-detail-fields">
                <div className="appointment-detail-field">
                  <span>Ngày hẹn</span>
                  <strong>{appointment.appointmentDate}</strong>
                </div>
                <div className="appointment-detail-field">
                  <span>Thời gian</span>
                  <strong>{String(appointment.startTime || "").slice(0, 5)} – {String(appointment.endTime || "").slice(0, 5)}</strong>
                </div>
              </div>
            </section>

            <section className="appointment-detail-section">
              <h3><i className="bi bi-person-vcard"></i> Thông tin phục vụ</h3>
              <div className="appointment-detail-fields">
                <div className="appointment-detail-field">
                  <span>Khách hàng</span>
                  <strong>{appointment.customerName || "—"}</strong>
                </div>
                <div className="appointment-detail-field">
                  <span>Nhân viên</span>
                  <strong>{appointment.staffName || "Chưa phân công"}</strong>
                </div>
                <div className="appointment-detail-field">
                  <span>Phòng</span>
                  <strong>{appointment.roomName || "Chưa phân phòng"}</strong>
                </div>
              </div>
            </section>
          </div>

          <section className="appointment-detail-note">
            <h3><i className="bi bi-chat-left-text"></i> Ghi chú</h3>
            <p>{appointment.notes || "Không có ghi chú cho lịch hẹn này."}</p>
          </section>

          {cancelSuccess && <Alert variant="success" className="mt-4 mb-0" role="status">Đã hủy lịch hẹn thành công.</Alert>}
          {appointment.cancellationReason && (
            <Alert variant="light" className="appointment-detail-cancellation mb-0">
              <strong>Lý do hủy:</strong> {appointment.cancellationReason}
            </Alert>
          )}
          {cancelError && !showCancel && <Alert variant="danger" className="mt-4 mb-0">{cancelError}</Alert>}

          {canModify && (
            <div className="appointment-detail-actions">
                <Button
                  className="appointment-detail-reschedule"
                onClick={() => navigate(`/appointments/${appointment.appointmentId}/reschedule`)}
              >
                <i aria-hidden="true" className="bi bi-calendar-event"></i>
                Đổi lịch
              </Button>
              <Button
                variant="outline-danger"
                onClick={() => { setCancelError(""); setShowCancel(true); }}
                disabled={cancelling}
              >
                {cancelling ? (
                  <><Spinner size="sm" className="me-2" />Đang hủy...</>
                ) : (
                  <><i aria-hidden="true" className="bi bi-x-circle"></i>Hủy lịch</>
                )}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showCancel} onHide={() => { if (!cancelling) setShowCancel(false); }} centered backdrop={cancelling ? "static" : true} keyboard={!cancelling} aria-labelledby="cancel-title">
        <Modal.Header closeButton={!cancelling}><Modal.Title id="cancel-title">Hủy lịch hẹn #{appointment.appointmentId}</Modal.Title></Modal.Header>
        <Form onSubmit={event => { event.preventDefault(); handleCancel(); }}>
          <Modal.Body>
            <p>Bạn muốn hủy lịch {appointment.serviceName} ngày {appointment.appointmentDate} lúc {String(appointment.startTime || '').slice(0, 5)}?</p>
            <Form.Group controlId="cancel-reason">
              <Form.Label>Lý do hủy <span aria-hidden="true">*</span></Form.Label>
              <Form.Control as="textarea" rows={3} required maxLength={500} value={reason} onChange={e => setReason(e.target.value)} disabled={cancelling} autoFocus />
            </Form.Group>
            {cancelError && <Alert variant="danger" className="mt-3 mb-0" role="alert">{cancelError}</Alert>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" disabled={cancelling} onClick={() => setShowCancel(false)}>Giữ lịch hẹn</Button>
            <Button variant="danger" type="submit" disabled={cancelling || !reason.trim()}>{cancelling ? "Đang hủy…" : "Xác nhận hủy"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ============== PHẦN ĐÁNH GIÁ - chỉ hiển thị khi Completed ============== */}
      {appointment.status === "Completed" && (
        <Card className="appointment-feedback-card">
          <Card.Header className="appointment-feedback-header">
            <i className="bi bi-chat-quote-fill me-2 text-danger"></i>
            Đánh giá từ khách hàng
            {feedback && (
              <Badge bg="warning" text="dark" className="ms-2">
                {feedback.rating} / 5
              </Badge>
            )}
          </Card.Header>
          <Card.Body>
            {feedbackLoading ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" />
                <span className="ms-2 text-muted">Đang tải đánh giá...</span>
              </div>
            ) : feedback ? (
              <div>
                <div className="d-flex align-items-center mb-3">
                  <div
                    className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-3"
                    style={{
                      width: "44px",
                      height: "44px",
                      fontSize: "18px",
                      fontWeight: "bold",
                      flexShrink: 0,
                    }}
                  >
                    {(feedback.customerName || feedback.fullName || "K")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="fw-bold">
                      {feedback.customerName ||
                        feedback.fullName ||
                        "Khách hàng"}
                    </div>
                    <small className="text-muted">
                      {formatFeedbackDate(feedback.createdAt)}
                    </small>
                  </div>
                  <div className="ms-auto">{renderStars(feedback.rating)}</div>
                </div>

                <p
                  className="mb-0 text-dark"
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    padding: "12px 16px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    borderLeft: "4px solid #dc3545",
                  }}
                >
                  {feedback.comment || (
                    <em className="text-muted">
                      (Khách hàng không để lại bình luận)
                    </em>
                  )}
                </p>
              </div>
            ) : (
              <Alert variant="secondary" className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Lịch hẹn này chưa có đánh giá từ khách hàng.
              </Alert>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default AppointmentDetails;
