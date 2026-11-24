// Shared, presentation-only pieces for CreateFeedbackForm and UpdateFeedbackForm. No API calls here.
import { Link } from "react-router-dom";
import { Alert, Card, Container, Form } from "react-bootstrap";
import FloatingAlert from "../../../components/FloatingAlert";

export const lineKey = (appointmentId, serviceId) => `${appointmentId}:${serviceId}`;

export const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    return timeStr ? `${date} ${String(timeStr).slice(0, 5)}` : date;
  } catch {
    return `${dateStr} ${timeStr || ""}`;
  }
};

export const getStoredUser = () => {
  const saved = localStorage.getItem("user");
  return saved ? JSON.parse(saved) : null;
};

export function NonCustomerNotice() {
  return (
    <Container className="mt-4 px-4">
      <Alert variant="warning">Only customers can create/update reviews.</Alert>
      <Link to="/feedback" className="btn btn-secondary">View customer reviews</Link>
    </Container>
  );
}

export function FeedbackPageShell({ title, error, setError, successMsg, setSuccessMsg, children }) {
  return (
    <Container fluid className="mt-4 px-4">
      <Card className="shadow-sm border-0" style={{ borderRadius: "15px" }}>
        <Card.Body className="p-4 p-md-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold text-uppercase mb-0">{title}</h2>
            <Link to="/feedback" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-1"></i> Back
            </Link>
          </div>
          <FloatingAlert message={error} onClose={() => setError("")} />
          <FloatingAlert message={successMsg} variant="success" onClose={() => setSuccessMsg("")} />
          {children}
        </Card.Body>
      </Card>
    </Container>
  );
}

export function StarRating({ rating, onChange }) {
  return (
    <Form.Group>
      <Form.Label className="fw-bold">Rating *</Form.Label>
      <div className="p-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <i
            key={i}
            className={`bi ${i <= parseInt(rating, 10) ? "bi-star-fill text-warning" : "bi-star text-secondary"}`}
            style={{ fontSize: "32px", cursor: "pointer", marginRight: "6px" }}
            onClick={() => onChange(i)}
            role="button"
            aria-label={`${i} sao`}
          />
        ))}
      </div>
    </Form.Group>
  );
}

export function CommentField({ value, onChange, disabled }) {
  return (
    <Form.Group className="mb-4">
      <Form.Label className="fw-bold">Review content*</Form.Label>
      <Form.Control
        as="textarea"
        rows={5}
        name="comment"
        placeholder="Tell us about your experience..."
        value={value}
        onChange={onChange}
        disabled={disabled}
        required
        maxLength={500}
      />
      <Form.Text className="text-muted">{value.length}/500 characters</Form.Text>
    </Form.Group>
  );
}
