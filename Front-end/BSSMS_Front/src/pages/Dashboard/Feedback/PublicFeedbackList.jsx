import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Card,
  Row,
  Col,
  Form,
  InputGroup,
  Badge,
  Spinner,
  Alert,
} from "react-bootstrap";

const PublicFeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Lấy danh sách dịch vụ
  useEffect(() => {
    fetch("/api/service")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setServices(data);
      })
      .catch((err) => console.error("Lỗi tải dịch vụ:", err));
  }, []);

  // Lấy tất cả feedback công khai
  useEffect(() => {
    const fetchFeedback = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/feedback");
        if (response.ok) {
          const data = await response.json();
          setFeedbacks(Array.isArray(data) ? data : []);
        } else {
          setLoadError("Không tải được danh sách đánh giá.");
        }
      } catch (err) {
        console.error("Lỗi tải feedback:", err);
        setLoadError("Lỗi kết nối đến máy chủ!");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  const getServiceName = (serviceId) => {
    const s = services.find((x) => x.serviceId === serviceId);
    return s ? s.serviceName : `Dịch vụ #${serviceId}`;
  };

  const filteredFeedbacks = feedbacks.filter((fb) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !search ||
      fb.comment?.toLowerCase().includes(search) ||
      (fb.customerName || "").toLowerCase().includes(search) ||
      getServiceName(fb.serviceId).toLowerCase().includes(search);
    const matchesRating =
      ratingFilter === "all" || String(fb.rating) === ratingFilter;
    const matchesService =
      serviceFilter === "all" || String(fb.serviceId) === serviceFilter;
    return matchesSearch && matchesRating && matchesService;
  });

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`bi ${
            i <= rating ? "bi-star-fill text-warning" : "bi-star text-secondary"
          }`}
        />
      );
    }
    return stars;
  };

  const formatDate = (dateStr) => {
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

  const getInitial = (name) => {
    return name && name.length > 0 ? name.charAt(0).toUpperCase() : "K";
  };

  // Tính thống kê tổng quan
  const stats = {
    total: feedbacks.length,
    avg:
      feedbacks.length > 0
        ? (
            feedbacks.reduce((sum, fb) => sum + (fb.rating || 0), 0) /
            feedbacks.length
          ).toFixed(1)
        : 0,
    fiveStar: feedbacks.filter((fb) => fb.rating === 5).length,
  };

  return (
    <Container fluid className="mt-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="fw-bold text-uppercase mb-0">
          Đánh giá từ khách hàng
        </h2>
        <Link to="/my-feedback" className="btn btn-outline-danger">
          <i className="bi bi-list-ul me-1"></i> Đánh giá của tôi
        </Link>
      </div>

      {/* Thẻ thống kê */}
      <Row className="mb-3 g-3">
        <Col md={4}>
          <Card className="shadow-sm border-0" style={{ borderRadius: "12px" }}>
            <Card.Body className="text-center">
              <i className="bi bi-chat-quote-fill text-primary" style={{ fontSize: "32px" }}></i>
              <h3 className="fw-bold mt-2 mb-0">{stats.total}</h3>
              <small className="text-muted">Tổng đánh giá</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0" style={{ borderRadius: "12px" }}>
            <Card.Body className="text-center">
              <i className="bi bi-star-fill text-warning" style={{ fontSize: "32px" }}></i>
              <h3 className="fw-bold mt-2 mb-0">{stats.avg} / 5</h3>
              <small className="text-muted">Điểm trung bình</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0" style={{ borderRadius: "12px" }}>
            <Card.Body className="text-center">
              <i className="bi bi-emoji-laughing-fill text-success" style={{ fontSize: "32px" }}></i>
              <h3 className="fw-bold mt-2 mb-0">{stats.fiveStar}</h3>
              <small className="text-muted">Đánh giá 5 sao</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Bộ lọc */}
      <Card className="shadow-sm border-0 mb-3" style={{ borderRadius: "12px" }}>
        <Card.Body>
          <div className="d-flex flex-wrap gap-3 align-items-center">
            <InputGroup style={{ maxWidth: "320px" }}>
              <InputGroup.Text>
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                placeholder="Tìm theo tên, dịch vụ, nội dung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            <Form.Select
              style={{ maxWidth: "220px" }}
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            >
              <option value="all">Tất cả dịch vụ</option>
              {services.map((s) => (
                <option key={s.serviceId} value={s.serviceId}>
                  {s.serviceName}
                </option>
              ))}
            </Form.Select>

            <Form.Select
              style={{ maxWidth: "180px" }}
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="all">Tất cả số sao</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </Form.Select>

            <Badge bg="secondary" className="px-3 py-2">
              Kết quả: {filteredFeedbacks.length}
            </Badge>
          </div>
        </Card.Body>
      </Card>

      {loadError && <Alert variant="danger">{loadError}</Alert>}

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
          <p className="mt-3 text-muted">Đang tải đánh giá...</p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <Card className="shadow-sm border-0" style={{ borderRadius: "12px" }}>
          <Card.Body className="text-center py-5 text-muted">
            {feedbacks.length === 0
              ? "Chưa có đánh giá nào từ khách hàng."
              : "Không tìm thấy đánh giá phù hợp với bộ lọc hiện tại."}
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {filteredFeedbacks.map((fb) => (
            <Col key={fb.feedbackId} md={6} lg={4}>
              <Card
                className="shadow-sm border-0 h-100"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-3"
                      style={{
                        width: "48px",
                        height: "48px",
                        fontSize: "20px",
                        fontWeight: "bold",
                        flexShrink: 0,
                      }}
                    >
                      {getInitial(fb.customerName || fb.fullName)}
                    </div>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <h6 className="mb-0 fw-bold text-truncate">
                        {fb.customerName || fb.fullName || "Khách hàng ẩn danh"}
                      </h6>
                      <small className="text-muted">{formatDate(fb.createdAt)}</small>
                    </div>
                  </div>

                  <div className="mb-2" style={{ fontSize: "18px" }}>
                    {renderStars(fb.rating)}
                  </div>

                  <Badge bg="info" className="mb-2">
                    <i className="bi bi-scissors me-1"></i>
                    {getServiceName(fb.serviceId)}
                  </Badge>

                  <p
                    className="mb-0 mt-2 text-dark"
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {fb.comment}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default PublicFeedbackList;
