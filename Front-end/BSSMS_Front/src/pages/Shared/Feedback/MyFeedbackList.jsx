import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Card,
  Table,
  Badge,
  Button,
  Form,
  InputGroup,
  Modal,
  Spinner,
  Alert,
} from "react-bootstrap";
import servicePhoto04 from "../../../assets/figma/service-card-exact-04.png";

const MyFeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const [user] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch(
          `/api/feedback?customerId=${user.customerId ?? user.accountId}`
        );
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

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const getServiceLabel = (fb) => fb.serviceName || `Dịch vụ #${fb.serviceId}`;
  const getVisitDate = (fb) => formatDateTime(fb.appointmentDate, fb.startTime);

  const handleShowDelete = (fb) => {
    setSelectedFeedback(fb);
    setShowDeleteModal(true);
  };

  const handleCloseDelete = () => {
    setShowDeleteModal(false);
    setSelectedFeedback(null);
  };

  const confirmDelete = async () => {
    if (!selectedFeedback || !user) return;

    try {
      const response = await fetch(
        `/api/feedback?id=${selectedFeedback.feedbackId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        try {
          const res = await fetch(
            `/api/feedback?customerId=${user.customerId ?? user.accountId}`
          );
          if (res.ok) {
            const data = await res.json();
            setFeedbacks(Array.isArray(data) ? data : []);
          }
        } catch (err) {
          console.error("Lỗi reload sau khi xóa:", err);
        }
      } else {
        alert("Không thể xóa đánh giá này.");
      }
    } catch (err) {
      console.error("Lỗi xóa:", err);
      alert("Lỗi kết nối đến máy chủ!");
    } finally {
      handleCloseDelete();
    }
  };

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

  const filteredFeedbacks = feedbacks.filter((fb) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !search ||
      fb.comment?.toLowerCase().includes(search) ||
      getServiceLabel(fb).toLowerCase().includes(search);
    const matchesRating =
      ratingFilter === "all" || String(fb.rating) === ratingFilter;
    return matchesSearch && matchesRating;
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

  if (!user) {
    return (
      <Container className="mt-4 px-4">
        <Alert variant="warning">
          Bạn cần đăng nhập để xem đánh giá của mình.
        </Alert>
      </Container>
    );
  }

  if (user.role !== "Customer") {
    return (
      <Container className="mt-4 px-4">
        <Alert variant="warning">
          Trang này chỉ dành cho khách hàng. Vui lòng truy cập trang quản lý đánh giá dành cho nhân viên.
        </Alert>
        <Link to="/feedback" className="btn btn-secondary">
          Xem tất cả đánh giá
        </Link>
      </Container>
    );
  }

  return (
    <div className="public-service-page customer-my-feedback-page">
      <section className="public-service-hero customer-my-feedback-hero">
        <div className="public-service-hero-copy">
          <span className="seoul-eyebrow">CHIA SẺ · TRẢI NGHIỆM</span>
          <h1>Đánh giá của tôi</h1>
          <p>
            Theo dõi những đánh giá bạn đã gửi và chia sẻ thêm cảm nhận sau mỗi
            lần trải nghiệm dịch vụ.
          </p>
          <span className="public-service-hero-note">
            <i className="bi bi-chat-heart" aria-hidden="true" /> Mỗi chia sẻ giúp Seoul Center chăm sóc tốt hơn
          </span>
        </div>
        <img src={servicePhoto04} alt="Chăm sóc tại Seoul Center" />
      </section>

      <section className="public-service-content customer-my-feedback-content">
      <div className="public-service-list-heading customer-my-feedback-heading">
        <div>
          <h2>Những đánh giá của bạn</h2>
          <span className="public-service-count">{filteredFeedbacks.length} đánh giá</span>
        </div>
        <Link to="/feedback/new" className="btn btn-danger">
          <i className="bi bi-plus-circle me-1"></i> Tạo đánh giá mới
        </Link>
      </div>

      <Card className="shadow-sm border-0 mb-3 customer-my-feedback-filter">
        <Card.Body>
          <div className="d-flex flex-wrap gap-3 align-items-center">
            <InputGroup style={{ maxWidth: "360px" }}>
              <InputGroup.Text>
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                placeholder="Tìm theo nội dung hoặc dịch vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            <Form.Select
              style={{ maxWidth: "200px" }}
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
              Tổng: {feedbacks.length}
            </Badge>
          </div>
        </Card.Body>
      </Card>

      {loadError && <Alert variant="danger">{loadError}</Alert>}

      <Card className="shadow-sm border-0 customer-my-feedback-table-card">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="danger" />
              <p className="mt-3 text-muted">Đang tải đánh giá...</p>
            </div>
          ) : (
            <Table striped bordered hover responsive className="align-middle mb-0 customer-my-feedback-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Dịch vụ</th>
                  <th>Ngày sử dụng</th>
                  <th>Đánh giá</th>
                  <th>Nội dung</th>
                  <th>Ngày đánh giá</th>
                  <th style={{ minWidth: "180px" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.length > 0 ? (
                  filteredFeedbacks.map((fb) => (
                    <tr key={fb.feedbackId}>
                      <td>{fb.feedbackId}</td>
                      <td>
                        <Link
                          to={`/services/detail/${fb.serviceId}`}
                          className="text-decoration-none"
                          title="Xem dịch vụ"
                        >
                          <span className="fw-semibold customer-my-feedback-service">
                            <i className="bi bi-stars me-1"></i>
                            {getServiceLabel(fb)}
                          </span>
                        </Link>
                      </td>
                      <td>{getVisitDate(fb)}</td>
                      <td style={{ fontSize: "18px" }}>{renderStars(fb.rating)}</td>
                      <td>
                        <div
                          style={{
                            maxWidth: "320px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={fb.comment}
                        >
                          {fb.comment}
                        </div>
                      </td>
                      <td>{formatDate(fb.createdAt)}</td>
                      <td>
                        <Link
                          to={`/feedback/edit/${fb.feedbackId}`}
                          className="btn btn-warning btn-sm me-2 text-white"
                        >
                          <i className="bi bi-pencil-square"></i> Sửa
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleShowDelete(fb)}
                        >
                          <i className="bi bi-trash"></i> Xóa
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      {feedbacks.length === 0
                        ? "Bạn chưa có đánh giá nào. Hãy tạo đánh giá mới!"
                        : "Không tìm thấy đánh giá phù hợp."}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showDeleteModal} onHide={handleCloseDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger fw-bold">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Xác nhận xóa đánh giá
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn xóa đánh giá cho dịch vụ{" "}
          <span className="fw-bold text-primary">
            {selectedFeedback && getServiceLabel(selectedFeedback)}
          </span>{" "}
          không? Hành động này không thể hoàn tác.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDelete}>
            Hủy bỏ
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Xóa đánh giá
          </Button>
        </Modal.Footer>
      </Modal>
      </section>
    </div>
  );
};

export default MyFeedbackList;