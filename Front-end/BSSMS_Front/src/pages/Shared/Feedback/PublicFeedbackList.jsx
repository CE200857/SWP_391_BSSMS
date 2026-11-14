
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Form,
  InputGroup,
  Badge,
  Spinner,
  Alert,
  Modal,
  Table,
} from "react-bootstrap";
import servicePhoto02 from "../../../assets/figma/service-card-exact-02.png";
import { useManagerSearchFilter } from "../../../components/ManagerSearchFilter";

const PublicFeedbackList = ({ user, managerCompact = false }) => {
  const location = useLocation();
  const [feedbacks, setFeedbacks] = useState([]);
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [detailFeedback, setDetailFeedback] = useState(null);
  const isStaffManagementView = managerCompact || user?.role === "Manager";

  useEffect(() => {
    fetch("/api/service")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setServices(data);
      })
      .catch((err) => console.error("Lỗi tải dịch vụ:", err));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchFeedback = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/feedback");
        if (cancelled) return;
        if (response.ok) {
          const data = await response.json();
          if (!cancelled) setFeedbacks(Array.isArray(data) ? data : []);
        } else if (!cancelled) {
          setLoadError("Không tải được danh sách đánh giá.");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Lỗi tải feedback:", err);
          setLoadError("Lỗi kết nối đến máy chủ!");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchFeedback();

    return () => {
      cancelled = true;
    };
  }, []);

  const serviceLink = (serviceId) =>
    location.pathname.startsWith("/guest")
      ? `/guest/services/${serviceId}`
      : `/services/detail/${serviceId}`;

  const serviceScoped = feedbacks.filter(
    (fb) => serviceFilter === "all" || String(fb.serviceId) === serviceFilter,
  );
  const stats = {
    total: serviceScoped.length,
    avg:
      serviceScoped.length > 0
        ? (
            serviceScoped.reduce((sum, fb) => sum + (fb.rating || 0), 0) /
            serviceScoped.length
          ).toFixed(1)
        : 0,
    fiveStar: serviceScoped.filter((fb) => fb.rating === 5).length,
  };

  const filteredFeedbacks = feedbacks.filter((fb) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !search ||
      fb.comment?.toLowerCase().includes(search) ||
      (fb.customerName || "").toLowerCase().includes(search) ||
      (fb.serviceName || "").toLowerCase().includes(search);

    const matchesRating =
      ratingFilter === "all" || String(fb.rating) === ratingFilter;

    const matchesService =
      serviceFilter === "all" || String(fb.serviceId) === serviceFilter;

    return matchesSearch && matchesRating && matchesService;
  });
  const { filteredRows: managerFeedbacks, toolbar } = useManagerSearchFilter(
    feedbacks,
    [
      { key: "customerName", label: "Khách hàng", getValue: (feedback) => feedback.customerName || feedback.fullName, filterable: false },
      { key: "serviceName", label: "Dịch vụ" },
      { key: "comment", label: "Nội dung đánh giá", filterable: false },
      { key: "rating", label: "Số sao" },
      { key: "createdAt", label: "Ngày đánh giá", type: "date" },
    ],
    "Tìm theo khách hàng, dịch vụ, nội dung...",
  );
  const visibleFeedbacks = isStaffManagementView
    ? managerFeedbacks
    : filteredFeedbacks;

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

  const formatFeedbackTime = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return null;
    return {
      date: date.toLocaleDateString("vi-VN"),
      time: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getInitial = (name) => {
    return name && name.length > 0 ? name.charAt(0).toUpperCase() : "K";
  };

  return (
    <div className={managerCompact ? "feedback-manager-compact" : "public-service-page feedback-public-page"}>
      {managerCompact && (
        <div className="feedback-staff-page-heading">
          <div className="ui-page-heading">
            <div>
              <h1>Đánh giá khách hàng</h1>
              <p>Theo dõi điểm đánh giá và phản hồi công khai về dịch vụ.</p>
            </div>
          </div>
        </div>
      )}
      {!managerCompact && <section className="public-service-hero feedback-public-hero">
        <div className="public-service-hero-copy">
          <span className="seoul-eyebrow">CHIA SẺ · TRẢI NGHIỆM</span>
          <h1>Đánh giá từ khách hàng</h1>
          <p>
            Những chia sẻ chân thực về trải nghiệm dịch vụ tại Seoul Center giúp
            bạn lựa chọn chăm sóc phù hợp.
          </p>
          <span className="public-service-hero-note">
            <i className="bi bi-chat-heart" aria-hidden="true" /> Lắng nghe để phục vụ bạn tốt hơn
          </span>
        </div>
        <img src={servicePhoto02} alt="Trải nghiệm chăm sóc tại Seoul Center" />
      </section>}

      <section className={`${managerCompact ? "feedback-manager-compact-content" : "public-service-content"} feedback-page feedback-management-page`}>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="fw-bold mb-0">Tổng quan đánh giá</h2>
      </div>

      <Row className={`feedback-summary-stats mb-3 g-3${managerCompact ? " feedback-summary-stats-compact" : ""}`}>
        <Col md={4}>
          <Card className="shadow-sm border-0 feedback-stat-card" style={{ borderRadius: "12px" }}>
            <Card.Body className="text-center">
              <i className="bi bi-chat-quote-fill text-primary" style={{ fontSize: "32px" }}></i>
              <h3 className="fw-bold mt-2 mb-0">{stats.total}</h3>
              <small className="text-muted">Tổng đánh giá</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0 feedback-stat-card" style={{ borderRadius: "12px" }}>
            <Card.Body className="text-center">
              <i className="bi bi-star-fill text-warning" style={{ fontSize: "32px" }}></i>
              <h3 className="fw-bold mt-2 mb-0">{stats.avg} / 5</h3>
              <small className="text-muted">Điểm trung bình</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0 feedback-stat-card" style={{ borderRadius: "12px" }}>
            <Card.Body className="text-center">
              <i className="bi bi-emoji-laughing-fill text-success" style={{ fontSize: "32px" }}></i>
              <h3 className="fw-bold mt-2 mb-0">{stats.fiveStar}</h3>
              <small className="text-muted">Đánh giá 5 sao</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-0 mb-3 feedback-filter-card" style={{ borderRadius: "12px" }}>
        <Card.Body>
          {isStaffManagementView ? (
            <div className="manager-list-toolbar">{toolbar}</div>
          ) : (
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
          )}
        </Card.Body>
      </Card>

      <div className="public-service-list-heading feedback-review-heading">
        <div>
          <h2>{managerCompact ? "Danh sách đánh giá" : "Cảm nhận từ khách hàng"}</h2>
          <span className="public-service-count">{visibleFeedbacks.length} đánh giá</span>
        </div>
      </div>

      {loadError && <Alert variant="danger">{loadError}</Alert>}

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
          <p className="mt-3 text-muted">Đang tải đánh giá...</p>
        </div>
      ) : visibleFeedbacks.length === 0 ? (
        <Card className="shadow-sm border-0" style={{ borderRadius: "12px" }}>
          <Card.Body className="text-center py-5 text-muted">
            {feedbacks.length === 0
              ? "Chưa có đánh giá nào từ khách hàng."
              : "Không tìm thấy đánh giá phù hợp với bộ lọc hiện tại."}
          </Card.Body>
        </Card>
      ) : managerCompact ? (
        <Card className="feedback-staff-list-card">
          <Card.Body>
            <div className="table-responsive">
              <Table hover className="manager-list-table feedback-staff-table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Dịch vụ</th>
                    <th>Thời gian</th>
                    <th>Đánh giá</th>
                    <th>Trạng thái</th>
                    <th className="feedback-staff-action-column">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleFeedbacks.map((fb) => {
                    const feedbackTime = formatFeedbackTime(fb.createdAt);
                    return (
                      <tr key={fb.feedbackId}>
                        <td>{fb.customerName || fb.fullName || "Khách hàng ẩn danh"}</td>
                        <td className="feedback-staff-service-column">{fb.serviceName || "—"}</td>
                        <td className="feedback-staff-time-column">
                          {feedbackTime ? (
                            <>
                              <div>{feedbackTime.time}</div>
                              <div className="small text-muted">{feedbackTime.date}</div>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="feedback-staff-rating" aria-label={`${fb.rating || 0} trên 5 sao`}>
                          {renderStars(fb.rating)}
                        </td>
                        <td>
                          <Badge bg="success">Đang hiển thị</Badge>
                        </td>
                        <td className="feedback-staff-action-column">
                          <div className="manager-list-actions">
                            <button
                              type="button"
                              className="btn manager-list-action manager-list-action--view"
                              onClick={() => setDetailFeedback(fb)}
                              aria-label={`Xem đánh giá của ${fb.customerName || fb.fullName || "khách hàng"}`}
                            >
                              <i className="bi bi-eye-fill" aria-hidden="true" />
                              Xem
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {visibleFeedbacks.map((fb) => {
            return (
              <Col key={fb.feedbackId} md={6} lg={4}>
                <Card
                  className="shadow-sm border-0 h-100 feedback-review-card"
                  style={{ borderRadius: "12px" }}
                >
                  <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                      <div
                        className="feedback-review-avatar text-white rounded-circle d-flex justify-content-center align-items-center me-3"
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

                    <Badge bg="info" className="mb-2 feedback-service-badge">
                      <Link
                        to={serviceLink(fb.serviceId)}
                        className="text-white text-decoration-none"
                        title="Xem dịch vụ"
                      >
                        <i className="bi bi-stars me-1"></i>
                        {fb.serviceName || `Dịch vụ #${fb.serviceId}`}
                      </Link>
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
            );
          })}
        </Row>
      )}
      <Modal
        show={!!detailFeedback}
        onHide={() => setDetailFeedback(null)}
        centered
        className="feedback-staff-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết đánh giá</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>Khách hàng:</strong>{" "}
            {detailFeedback?.customerName || detailFeedback?.fullName || "Khách hàng ẩn danh"}
          </p>
          <p><strong>Dịch vụ:</strong> {detailFeedback?.serviceName || "—"}</p>
          <p>
            <strong>Ngày đánh giá:</strong>{" "}
            {detailFeedback?.createdAt ? formatDate(detailFeedback.createdAt) : "—"}
          </p>
          <p>
            <strong>Đánh giá:</strong>{" "}
            <span className="feedback-staff-rating">
              {renderStars(detailFeedback?.rating)}
            </span>
          </p>
          <p className="mb-0">
            <strong>Nội dung:</strong>
            <br />
            {detailFeedback?.comment || "Không có nội dung."}
          </p>
        </Modal.Body>
      </Modal>
      </section>
    </div>
  );
};

export default PublicFeedbackList;