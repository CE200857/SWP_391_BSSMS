import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Container, Card, Form, Button, Row, Col, Alert } from "react-bootstrap";

const lineKey = (appointmentId, serviceId) => `${appointmentId}:${serviceId}`;

const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    return timeStr ? `${date} ${String(timeStr).slice(0, 5)}` : date;
  } catch {
    return `${dateStr} ${timeStr || ""}`;
  }
};

const FeedbackForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({ rating: 5, comment: "" });
  const [options, setOptions] = useState([]);
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);

  const [user] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const customerId = user ? (user.customerId ?? user.accountId) : null;

  useEffect(() => {
    fetch("/api/service")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setServices(data);
      })
      .catch((err) => console.error("Lỗi tải dịch vụ:", err));
  }, []);

  useEffect(() => {
    if (!user || isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/feedback/appointments/${customerId}`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            const list = Array.isArray(data) ? data : [];
            setOptions(list);
            const wanted = new URLSearchParams(window.location.search).get("appointmentServiceId");
            const match = list.find((o) => String(o.appointmentServiceId) === wanted);
            if (match) setSelected(lineKey(match.appointmentId, match.serviceId));
          }
        }
      } catch (err) {
        if (!cancelled) console.error("Lỗi tải dữ liệu:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, customerId, isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    const fetchFeedback = async () => {
      try {
        const response = await fetch(`/api/feedback?id=${id}`);
        if (response.ok) {
          const data = await response.json();
          setFormData({ rating: data.rating ?? 5, comment: data.comment ?? "" });
          setEditTarget({
            appointmentId: data.appointmentId,
            serviceId: data.serviceId,
          });
        } else {
          setError("Không tìm thấy đánh giá này.");
        }
      } catch (err) {
        console.error("Lỗi tải đánh giá:", err);
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

    let target = editTarget;
    if (!isEdit) {
      const option = options.find((o) => lineKey(o.appointmentId, o.serviceId) === selected);
      if (!option) {
        setError("Vui lòng chọn dịch vụ cần đánh giá!");
        return;
      }
      target = { appointmentId: option.appointmentId, serviceId: option.serviceId, appointmentServiceId: option.appointmentServiceId };
    }

    if (!formData.comment.trim()) {
      setError("Vui lòng nhập nội dung đánh giá!");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        rating: parseInt(formData.rating, 10),
        comment: formData.comment,
        appointmentId: target.appointmentId,
        serviceId: target.serviceId,
        appointmentServiceId: target.appointmentServiceId || 0,
        customerId,
      };
      const response = await fetch(isEdit ? `/api/feedback?id=${id}` : "/api/feedback", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccessMsg(
          isEdit
            ? "Cập nhật đánh giá thành công! Đang chuyển hướng..."
            : "Gửi đánh giá thành công! Đang chuyển hướng...",
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

  if (user && user.role !== "Customer") {
    return (
      <Container className="mt-4 px-4">
        <Alert variant="warning">Chỉ khách hàng mới có thể tạo/cập nhật đánh giá.</Alert>
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

  const optionLabel = (o) => {
    const when = formatDateTime(o.appointmentDate, o.startTime);
    return when ? `${o.serviceName} - ${when}` : o.serviceName;
  };

  const editServiceName = editTarget
    ? services.find((s) => s.serviceId === editTarget.serviceId)?.serviceName || `Dịch vụ #${editTarget.serviceId}`
    : "";

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`bi ${
            i <= parseInt(formData.rating, 10) ? "bi-star-fill text-warning" : "bi-star text-secondary"
          }`}
          style={{ fontSize: "32px", cursor: "pointer", marginRight: "6px" }}
          onClick={() => handleRating(i)}
          role="button"
          aria-label={`${i} sao`}
        />,
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
                  <Form.Label className="fw-bold">Dịch vụ đã sử dụng*</Form.Label>
                  {isEdit ? (
                    <>
                      <Form.Control value={editServiceName} disabled readOnly />
                      <Form.Text className="text-muted">
                        Không thể thay đổi dịch vụ khi cập nhật đánh giá.
                      </Form.Text>
                    </>
                  ) : (
                    <>
                      <Form.Select
                        value={selected}
                        onChange={(e) => setSelected(e.target.value)}
                        disabled={isLoading || successMsg !== ""}
                        required
                      >
                        <option value="">-- Chọn dịch vụ --</option>
                        {options.map((o) => (
                          <option key={lineKey(o.appointmentId, o.serviceId)} value={lineKey(o.appointmentId, o.serviceId)}>
                            {optionLabel(o)}
                          </option>
                        ))}
                      </Form.Select>
                      {options.length === 0 ? (
                        <Form.Text className="text-danger">
                          Bạn chưa có dịch vụ nào đã hoàn thành và chưa đánh giá.
                        </Form.Text>
                      ) : (
                        <Form.Text className="text-muted">
                          Mỗi dịch vụ trong mỗi lần đến được đánh giá một lần.
                        </Form.Text>
                      )}
                    </>
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
                placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ..."
                value={formData.comment}
                onChange={handleChange}
                disabled={isLoading || successMsg !== ""}
                required
                maxLength={500}
              />
              <Form.Text className="text-muted">{formData.comment.length}/500 ký tự</Form.Text>
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
                disabled={isLoading || successMsg !== "" || (!isEdit && options.length === 0)}
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
