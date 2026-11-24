// UC Update Feedback — Customer edits one of their reviews (route /feedback/edit/:id).
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Form, Button, Row, Col } from "react-bootstrap";
import { getStoredUser, NonCustomerNotice, FeedbackPageShell, StarRating, CommentField } from "./feedbackShared";

const UpdateFeedbackForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ rating: 5, comment: "" });
  const [target, setTarget] = useState(null); // { appointmentId, serviceId }
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [user] = useState(getStoredUser);
  const customerId = user ? (user.customerId ?? user.accountId) : null;

  // Service names (to show which service this review is for)
  useEffect(() => {
    fetch("/api/service")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => { if (Array.isArray(data)) setServices(data); })
      .catch((err) => console.error("Error loading services:", err));
  }, []);

  // The review being edited
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch(`/api/feedback?id=${id}`);
        if (response.ok) {
          const data = await response.json();
          setFormData({ rating: data.rating ?? 5, comment: data.comment ?? "" });
          setTarget({ appointmentId: data.appointmentId, serviceId: data.serviceId });
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
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!user) return setError("You need to log in to do this!");
    if (!target) return setError("This review was not found.");
    if (!formData.comment.trim()) return setError("Please enter the review content!");

    setIsLoading(true);
    try {
      const response = await fetch(`/api/feedback?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: parseInt(formData.rating, 10),
          comment: formData.comment,
          appointmentId: target.appointmentId,
          serviceId: target.serviceId,
          appointmentServiceId: 0,
          customerId,
        }),
      });
      if (response.ok) {
        setSuccessMsg("Review updated! Redirecting...");
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

  if (user && user.role !== "Customer") return <NonCustomerNotice />;
  if (isFetching) {
    return (
      <Container className="text-center mt-5">
        <h5>Loading data...</h5>
      </Container>
    );
  }

  const serviceName = target
    ? services.find((s) => s.serviceId === target.serviceId)?.serviceName || `Service #${target.serviceId}`
    : "";
  const locked = isLoading || successMsg !== "";

  return (
    <FeedbackPageShell title="Update review" error={error} setError={setError} successMsg={successMsg} setSuccessMsg={setSuccessMsg}>
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6} className="mb-3">
            <Form.Group>
              <Form.Label className="fw-bold">Service *</Form.Label>
              <Form.Control value={serviceName} disabled readOnly />
              <Form.Text className="text-muted">The service cannot be changed when updating a review.</Form.Text>
            </Form.Group>
          </Col>
          <Col md={6} className="mb-3">
            <StarRating rating={formData.rating} onChange={(v) => setFormData((p) => ({ ...p, rating: v }))} />
          </Col>
        </Row>

        <CommentField value={formData.comment} onChange={(e) => setFormData((p) => ({ ...p, comment: e.target.value }))} disabled={locked} />

        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={() => navigate("/feedback")} disabled={locked}>Cancel</Button>
          <Button variant="danger" type="submit" disabled={locked} style={{ minWidth: "160px" }}>
            {isLoading ? "Processing..." : successMsg ? "Redirecting..." : "Update"}
          </Button>
        </div>
      </Form>
    </FeedbackPageShell>
  );
};

export default UpdateFeedbackForm;
