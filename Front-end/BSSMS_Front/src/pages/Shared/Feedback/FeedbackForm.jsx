import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Container, Card, Form, Button, Row, Col, Alert } from "react-bootstrap";

const FeedbackForm = () => {
  const { id } = useParams(); // Nếu có id -> Update, ngược lại -> Create
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    rating: 5,
    comment: "",
  });

  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [existingFeedbacks, setExistingFeedbacks] = useState([]);
  const [appointmentId, setAppointmentId] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);

  const [user] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  // Lấy danh sách services để hiển thị tên trong dropdown appointment
  useEffect(() => {
    fetch("/api/service")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setServices(data);
      })
      .catch((err) => console.error("Lỗi tải dịch vụ:", err));
  }, []);

  // Lấy danh sách appointments đã Completed của customer hiện tại
  // + Lấy danh sách feedback đã tồn tại (để biết appointment nào đã được đánh giá)
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const loadAll = async () => {
      try {
        const [apptRes, fbRes] = await Promise.all([
          fetch(`/api/appointment?customerId=${user.customerId ?? user.accountId}`),
          fetch(`/api/feedback?customerId=${user.customerId ?? user.accountId}`),
        ]);

        if (cancelled) return;

        if (apptRes.ok) {
          const apptData = await apptRes.json();
          if (Array.isArray(apptData)) {
            // Chỉ lấy appointment đã hoàn thành (Completed)
            const completed = apptData.filter((a) => a.status === "Completed");
            if (!cancelled) setAppointments(completed);
          }
        }

        if (fbRes.ok) {
          const fbData = await fbRes.json();
          if (Array.isArray(fbData)) {
            if (!cancelled) setExistingFeedbacks(fbData);
          }
        }
      } catch (err) {
        if (!cancelled) console.error("Lỗi tải dữ liệu:", err);
      }
    };

    loadAll();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Nếu là chế độ Edit, gọi API lấy feedback hiện tại
  useEffect(() => {
    if (!isEdit) return;

    const fetchFeedback = async () => {
      try {
        const response = await fetch(`/api/feedback?id=${id}`);
        if (response.ok) {
          const data = await response.json();
          setFormData({
            rating: data.rating ?? 5,
            comment: data.comment ?? "",
          });
          setAppointmentId(data.appointmentId ? String(data.appointmentId) : "");
        } else {
          setError("Không tìm thấy feedback này.");
        }
      } catch (err) {
        console.error("Lỗi tải feedback:", err);
        setError("Lỗi kết nối đến máy chủ!");
      } finally {
        setIsFetching(false);
      }
    };

    fetchFeedback();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRating = (value) => {
    setFormData((prev) => ({ ...prev, rating: parseInt(value, 10) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!user) {
      setError("Bạn cần đăng nhập để thực hiện thao tác này!");
      return;
    }

    if (!appointmentId) {
      setError("Vui lòng chọn lịch hẹn cần đánh giá!");
      return;
    }

    if (!formData.comment.trim()) {
      setError("Vui lòng nhập nội dung đánh giá!");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        rating: parseInt(formData.rating, 10),
        appointmentId: parseInt(appointmentId, 10),
        customerId: user.customerId ?? user.accountId,
      };

      const url = isEdit ? `/api/feedback?id=${id}` : "/api/feedback";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccessMsg(
          isEdit
            ? "Cập nhật đánh giá thành công! Đang chuyển hướng..."
            : "Gửi đánh giá thành công! Đang chuyển hướng..."
        );
        setTimeout(() => navigate("/my-feedback"), 1500);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Thao tác thất bại, vui lòng thử lại!");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Lỗi submit:", err);
      setError("Lỗi kết nối đến máy chủ!");
      setIsLoading(false);
    }
  };

  // Nếu không phải khách hàng thì không cho phép
  if (user && user.role !== "Customer") {
    return (
      <Container className="mt-4 px-4">
        <Alert variant="warning">
          Chỉ khách hàng mới có thể tạo/cập nhật đánh giá.
        </Alert>
        <Link to="/feedback" className="btn btn-secondary">
          Xem đánh giá của khách hàng
        </Link>
      </Container>
    );
  }

  if (isFetching) {
    return (
      <Container className="text-center mt-5">
        <h5>Đang tải dữ liệu...</h5>
      </Container>
    );
  }

  // Format ngày + giờ để hiển thị trong dropdown
  const formatDateTime = (dateStr, timeStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const formattedDate = d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      return timeStr ? `${formattedDate} ${timeStr}` : formattedDate;
    } catch {
      return `${dateStr} ${timeStr || ""}`;
    }
  };

  const getAppointmentLabel = (appt) => {
    const service = services.find((s) => s.serviceId === appt.serviceId);
    const serviceName = service ? service.serviceName : `Dịch vụ #${appt.serviceId}`;
    const when = formatDateTime(appt.appointmentDate, appt.startTime);
    return when ? `${serviceName} - ${when}` : serviceName;
  };

  // Lấy danh sách appointmentId đã có feedback
  const feedbackAppointmentIds = new Set(
    existingFeedbacks.map((fb) => fb.appointmentId)
  );

  // Khi tạo mới: chỉ hiển thị appointment chưa có feedback
  // Khi edit: hiển thị tất cả appointment Completed (vì cần giữ appointment hiện tại)
  const availableAppointments = isEdit
    ? appointments
    : appointments.filter(
        (appt) => !feedbackAppointmentIds.has(appt.appointmentId)
      );

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`bi ${
            i <= parseInt(formData.rating, 10)
              ? "bi-star-fill text-warning"
              : "bi-star text-secondary"
          }`}
          style={{ fontSize: "32px", cursor: "pointer", marginRight: "6px" }}
          onClick={() => handleRating(i)}
          role="button"
          aria-label={`${i} sao`}
        />
      );
    }
    return stars;
  };

  return (
    <Container fluid className="mt-4 px-4">
      <Card className="shadow-sm border-0" style={{ borderRadius: "15px" }}>
        <Card.Body className="p-4 p-md-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold text-uppercase mb-0">
              {isEdit ? "Cập nhật đánh giá" : "Tạo đánh giá mới"}
            </h2>
            <Link to="/my-feedback" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-1"></i> Quay lại
            </Link>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}
          {successMsg && <Alert variant="success">{successMsg}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-bold">Lịch hẹn*</Form.Label>
                  <Form.Select
                    value={appointmentId}
                    onChange={(e) => setAppointmentId(e.target.value)}
                    disabled={isEdit || isLoading || successMsg !== ""}
                    required
                  >
                    <option value="">-- Chọn lịch hẹn --</option>
                    {availableAppointments.map((appt) => (
                      <option
                        key={appt.appointmentId}
                        value={appt.appointmentId}
                      >
                        {getAppointmentLabel(appt)}
                      </option>
                    ))}
                  </Form.Select>
                  {isEdit ? (
                    <Form.Text className="text-muted">
                      Không thể thay đổi lịch hẹn khi cập nhật.
                    </Form.Text>
                  ) : availableAppointments.length === 0 ? (
                    <Form.Text className="text-danger">
                      Bạn chưa có lịch hẹn nào đã hoàn thành để đánh giá.
                    </Form.Text>
                  ) : (
                    <Form.Text className="text-muted">
                      Chỉ hiển thị các lịch hẹn đã hoàn thành và chưa được đánh
                      giá.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>

              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-bold">Mức đánh giá*</Form.Label>
                  <div className="p-2">{renderStars()}</div>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">Nội dung đánh giá*</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="comment"
                placeholder="Chia sẻ trải nghiệm của bạn về buổi hẹn..."
                value={formData.comment}
                onChange={handleChange}
                disabled={isLoading || successMsg !== ""}
                required
                maxLength={500}
              />
              <Form.Text className="text-muted">
                {formData.comment.length}/500 ký tự
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate("/my-feedback")}
                disabled={isLoading || successMsg !== ""}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="danger"
                type="submit"
                disabled={
                  isLoading ||
                  successMsg !== "" ||
                  (!isEdit && availableAppointments.length === 0)
                }
                style={{ minWidth: "160px" }}
              >
                {isLoading
                  ? "Đang xử lý..."
                  : successMsg
                  ? "Đang chuyển hướng..."
                  : isEdit
                  ? "Cập nhật"
                  : "Gửi đánh giá"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default FeedbackForm;