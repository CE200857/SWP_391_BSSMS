import { useState, useEffect } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { Container, Card, Form, Button, Row, Col, Alert } from "react-bootstrap";
import FloatingAlert from "../../../components/FloatingAlert";

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
  const { search } = useLocation();
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
      .catch((err) => console.error("Error loading services:", err));
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
            const params = new URLSearchParams(search);
            const wanted = params.get("appointmentServiceId");
            const wantedAppointment = params.get("appointmentId");
            const match =
              list.find((o) => String(o.appointmentServiceId) === wanted) ||
              (wantedAppointment && list.find((o) => String(o.appointmentId) === wantedAppointment));
            setSelected(match ? lineKey(match.appointmentId, match.serviceId) : "");
          }
        }
      } catch (err) {
        if (!cancelled) console.error("Error loading data:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, customerId, isEdit, search]);

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
          setError("This review was not found.");
        }
      } catch (err) {
        console.error("Error loading reviews:", err);
        setError("Cannot connect to the server.");
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
      setError("You need to log in to do this!");
      return;
    }

    let target = editTarget;
    if (!isEdit) {
      const option = options.find((o) => lineKey(o.appointmentId, o.serviceId) === selected);
      if (!option) {
        setError("Please select the service to review!");
        return;
      }
      target = { appointmentId: option.appointmentId, serviceId: option.serviceId, appointmentServiceId: option.appointmentServiceId };
    }

    if (!formData.comment.trim()) {
      setError("Please enter the review content!");
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
            ? "Review updated! Redirecting..."
            : "Thank you! Your review has been posted.",
        );
        setTimeout(() => navigate("/feedback"), 1500);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Something went wrong. Please try again.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Cannot connect to the server.");
      setIsLoading(false);
    }
  };

  if (user && user.role !== "Customer") {
    return (
      <Container className="mt-4 px-4">
        <Alert variant="warning">Only customers can create/update reviews.</Alert>
        <Link to="/feedback" className="btn btn-secondary">
          View customer reviews
        </Link>
      </Container>
    );
  }

  if (isFetching) {
    return (
      <Container className="text-center mt-5">
        <h5>Loading data...</h5>
      </Container>
    );
  }

  // Opened from a specific appointment: only offer that visit's services
  const fromAppointment = new URLSearchParams(search).get("appointmentId");
  const appointmentOptions = fromAppointment
    ? options.filter((o) => String(o.appointmentId) === fromAppointment)
    : [];
  const visibleOptions = appointmentOptions.length > 0 ? appointmentOptions : options;
  const selectedOption = options.find((o) => lineKey(o.appointmentId, o.serviceId) === selected);

  const optionLabel = (o) => {
    const when = formatDateTime(o.appointmentDate, o.startTime);
    return when ? `${o.serviceName} - ${when}` : o.serviceName;
  };

  const editServiceName = editTarget
    ? services.find((s) => s.serviceId === editTarget.serviceId)?.serviceName || `Service #${editTarget.serviceId}`
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
              {isEdit ? "Update review" : "Write a review"}
            </h2>
            <Link to="/feedback" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-1"></i> Back
            </Link>
          </div>

          <FloatingAlert message={error} onClose={() => setError("")} />
          <FloatingAlert message={successMsg} variant="success" onClose={() => setSuccessMsg("")} />

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-bold">Service *</Form.Label>
                  {isEdit ? (
                    <>
                      <Form.Control value={editServiceName} disabled readOnly />
                      <Form.Text className="text-muted">
                        The service cannot be changed when updating a review.
                      </Form.Text>
                    </>
                  ) : appointmentOptions.length === 1 && selectedOption ? (
                    <>
                      <Form.Control value={optionLabel(selectedOption)} disabled readOnly />
                      <Form.Text className="text-muted">From the appointment you chose.</Form.Text>
                    </>
                  ) : (
                    <>
                      <Form.Select
                        value={selected}
                        onChange={(e) => setSelected(e.target.value)}
                        disabled={isLoading || successMsg !== ""}
                        required
                      >
                        <option value="">-- Select service --</option>
                        {visibleOptions.map((o) => (
                          <option key={lineKey(o.appointmentId, o.serviceId)} value={lineKey(o.appointmentId, o.serviceId)}>
                            {optionLabel(o)}
                          </option>
                        ))}
                      </Form.Select>
                      {options.length === 0 ? (
                        <Form.Text className="text-danger">
                          You have no completed services waiting for a review.
                        </Form.Text>
                      ) : (
                        <Form.Text className="text-muted">
                          Each service in each visit can be reviewed once.
                        </Form.Text>
                      )}
                    </>
                  )}
                </Form.Group>
              </Col>

              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label className="fw-bold">Rating *</Form.Label>
                  <div className="p-2">{renderStars()}</div>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">Review content*</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="comment"
                placeholder="Tell us about your experience..."
                value={formData.comment}
                onChange={handleChange}
                disabled={isLoading || successMsg !== ""}
                required
                maxLength={500}
              />
              <Form.Text className="text-muted">{formData.comment.length}/500 characters</Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate("/feedback")}
                disabled={isLoading || successMsg !== ""}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                type="submit"
                disabled={isLoading || successMsg !== "" || (!isEdit && options.length === 0)}
                style={{ minWidth: "160px" }}
              >
                {isLoading
                  ? "Processing..."
                  : successMsg
                    ? "Redirecting..."
                    : isEdit
                      ? "Update"
                      : "Post review"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default FeedbackForm;
