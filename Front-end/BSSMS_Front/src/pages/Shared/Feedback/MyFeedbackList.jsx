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
import FloatingAlert from "../../../components/FloatingAlert";

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
          setLoadError("Could not load the review list.");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading feedback:", err);
          setLoadError("Cannot connect to the server.");
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

  const getServiceLabel = (fb) => fb.serviceName || `Service #${fb.serviceId}`;
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
          console.error("Error reloading after delete:", err);
        }
      } else {
        alert("This review cannot be deleted.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Cannot connect to the server.");
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
          You need to log in to see your reviews.
        </Alert>
      </Container>
    );
  }

  if (user.role !== "Customer") {
    return (
      <Container className="mt-4 px-4">
        <Alert variant="warning">
          This page is for customers only. Please use the review management page for staff.
        </Alert>
        <Link to="/feedback" className="btn btn-secondary">
          View all reviews
        </Link>
      </Container>
    );
  }

  return (
    <div className="public-service-page customer-my-feedback-page">
      <section className="public-service-hero customer-my-feedback-hero">
        <div className="public-service-hero-copy">
          <span className="seoul-eyebrow">SHARE · EXPERIENCE</span>
          <h1>My reviews</h1>
          <p>
            See the reviews you have posted and share more after each
            service experiences.
          </p>
          <span className="public-service-hero-note">
            <i className="bi bi-chat-heart" aria-hidden="true" /> Every review helps Seoul Center care better
          </span>
        </div>
        <img src={servicePhoto04} alt="Care at Seoul Center" />
      </section>

      <section className="public-service-content customer-my-feedback-content">
      <div className="public-service-list-heading customer-my-feedback-heading">
        <div>
          <h2>Your reviews</h2>
          <span className="public-service-count">{filteredFeedbacks.length} reviews</span>
        </div>
        <Link to="/feedback/new" className="btn btn-danger">
          <i className="bi bi-plus-circle me-1"></i> Write a review
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
                placeholder="Search by content or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            <Form.Select
              style={{ maxWidth: "200px" }}
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="all">All ratings</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </Form.Select>

            <Badge bg="secondary" className="px-3 py-2">
              Total: {feedbacks.length}
            </Badge>
          </div>
        </Card.Body>
      </Card>

      <FloatingAlert message={loadError} onClose={() => setLoadError("")} />

      <Card className="shadow-sm border-0 customer-my-feedback-table-card">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="danger" />
              <p className="mt-3 text-muted">Loading reviews...</p>
            </div>
          ) : (
            <Table striped bordered hover responsive className="align-middle mb-0 customer-my-feedback-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Service</th>
                  <th>Usage date</th>
                  <th>Review</th>
                  <th>Content</th>
                  <th>Review date</th>
                  <th style={{ minWidth: "180px" }}>Actions</th>
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
                          title="View services"
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
                          className="btn btn-outline-primary btn-sm me-2"
                        >
                          <i className="bi bi-pencil-square" aria-hidden="true"></i> Edit
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleShowDelete(fb)}
                        >
                          <i className="bi bi-trash"></i> Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      {feedbacks.length === 0
                        ? "You haven’t posted any reviews yet."
                        : "No matching reviews."}
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
            Confirm review deletion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the review for service{" "}
          <span className="fw-bold text-primary">
            {selectedFeedback && getServiceLabel(selectedFeedback)}
          </span>{" "}
          ? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDelete}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete review
          </Button>
        </Modal.Footer>
      </Modal>
      </section>
    </div>
  );
};

export default MyFeedbackList;