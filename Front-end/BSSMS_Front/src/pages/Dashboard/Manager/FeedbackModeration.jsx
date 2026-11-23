import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  Modal,
  Col,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { api } from "../../../services/api";
import { useManagerSearchFilter } from "../../../components/ManagerSearchFilter";
import FloatingAlert from "../../../components/FloatingAlert";

export default function FeedbackModeration({ managerCompact = false }) {
  const [items, setItems] = useState([]);
  const [publicStats, setPublicStats] = useState({
    total: 0,
    average: 0,
    fiveStar: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statsError, setStatsError] = useState("");
  const [success, setSuccess] = useState("");
  const [target, setTarget] = useState(null);
  const [detailFeedback, setDetailFeedback] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/feedback/moderation");
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPublicStats() {
    setStatsLoading(true);
    setStatsError("");
    try {
      const data = await api("/api/feedback");
      if (!Array.isArray(data)) {
        throw new Error("Invalid review summary data.");
      }
      const totalRating = data.reduce(
        (sum, feedback) => sum + Number(feedback.rating || 0),
        0,
      );
      setPublicStats({
        total: data.length,
        average: data.length ? (totalRating / data.length).toFixed(1) : "0.0",
        fiveStar: data.filter((feedback) => Number(feedback.rating) === 5).length,
      });
    } catch (e) {
      setStatsError(e.message);
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Load the moderation list when the page opens.
    load();
    loadPublicStats();
  }, []);

  const { filteredRows: visible, toolbar } = useManagerSearchFilter(
    items,
    [
      { key: "customerName", label: "Customer", filterable: false },
      { key: "serviceName", label: "Service", filterable: false },
      { key: "comment", label: "Review content", filterable: false },
      { key: "rating", label: "Stars" },
      {
        key: "visibility",
        label: "Status",
        getValue: (feedback) => feedback.isHidden ? "hidden" : "visible",
        formatValue: (value) => value === "hidden" ? "Hidden" : "Visible",
      },
      { key: "appointmentDate", label: "Review date", type: "date" },
    ],
    "Search by customer, service, content...",
  );

  async function submit() {
    if (!target || busy) return;
    if (!reason.trim()) {
      setError("Please enter a reason.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api(`/api/feedback/${target.feedbackId}/moderate`, {
        method: "PUT",
        body: JSON.stringify({
          hidden: !target.isHidden,
          reason: reason.trim(),
        }),
      });
      setSuccess(
        target.isHidden ? "Review shown again." : "Review hidden.",
      );
      setTarget(null);
      setReason("");
      await Promise.all([load(), loadPublicStats()]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const stars = (rating) => "★".repeat(rating || 0) + "☆".repeat(5 - (rating || 0));

  return (
    <section>
      {!managerCompact && (
        <div className="ui-page-heading">
          <div>
            <h1>Moderate customer reviews</h1>
            <p>Hide violating reviews from the public page, or show them again when needed.</p>
          </div>
        </div>
      )}
      <section className="feedback-moderation-overview" aria-label="Review overview">
        <FloatingAlert message={statsError} onClose={() => setStatsError("")} />
        <Row className="g-3 mb-3">
          <Col md={4}>
            <Card className="feedback-stat-card h-100">
              <Card.Body className="text-center">
                <i className="bi bi-chat-quote-fill text-primary" aria-hidden="true" />
                <strong>{statsLoading ? "—" : publicStats.total}</strong>
                <span>Total public reviews</span>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="feedback-stat-card h-100">
              <Card.Body className="text-center">
                <i className="bi bi-star-fill text-warning" aria-hidden="true" />
                <strong>{statsLoading ? "—" : `${publicStats.average} / 5`}</strong>
                <span>Average rating</span>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="feedback-stat-card h-100">
              <Card.Body className="text-center">
                <i className="bi bi-emoji-laughing-fill text-success" aria-hidden="true" />
                <strong>{statsLoading ? "—" : publicStats.fiveStar}</strong>
                <span>5-star review</span>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </section>
      {error && !target && <Alert variant="danger">{error}</Alert>}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
      <div className="manager-list-toolbar mb-3">{toolbar}</div>
      {loading ? (
        <div className="ui-empty">
          <Spinner animation="border" />
        </div>
      ) : (
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <Table hover className="manager-list-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Review</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((fb) => (
                    <tr key={fb.feedbackId}>
                      <td>{fb.customerName}</td>
                      <td title={fb.appointmentDate ? `Visit ${String(fb.appointmentDate).slice(0, 10)}` : undefined}>
                        {fb.serviceName || "—"}
                      </td>
                      <td className="text-warning">{stars(fb.rating)}</td>
                      <td>
                        {fb.isHidden ? (
                          <>
                            <Badge bg="secondary">Hidden</Badge>
                            {fb.moderationReason && (
                              <div className="small text-muted">
                                Reason: {fb.moderationReason}
                              </div>
                            )}
                          </>
                        ) : (
                          <Badge bg="success">Visible</Badge>
                        )}
                      </td>
                      <td>
                        <div className="manager-list-actions">
                        <Button
                          size="sm"
                          variant="link"
                          className="manager-list-action manager-list-action--view"
                          onClick={() => setDetailFeedback(fb)}
                        >
                          <i className="bi bi-eye-fill" aria-hidden="true" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="link"
                          className={`manager-list-action ${fb.isHidden ? "manager-list-action--view" : "manager-list-action--delete"}`}
                          onClick={() => {
                            setError("");
                            setReason("");
                            setTarget(fb);
                          }}
                        >
                          <i
                            className={`bi ${fb.isHidden ? "bi-eye" : "bi-eye-slash"}`}
                            aria-hidden="true"
                          />
                          {fb.isHidden ? "Show again" : "Hide"}
                        </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {!visible.length && <p className="ui-empty">No matching reviews.</p>}
            </div>
          </Card.Body>
        </Card>
      )}
      <Modal
        show={!!detailFeedback}
        onHide={() => setDetailFeedback(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Review details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Customer:</strong> {detailFeedback?.customerName || "—"}</p>
          <p><strong>Service:</strong> {detailFeedback?.serviceName || "—"}</p>
          <p><strong>Date:</strong> {detailFeedback?.appointmentDate ? String(detailFeedback.appointmentDate).slice(0, 10) : "—"}</p>
          <p><strong>Rating:</strong> <span className="text-warning">{stars(detailFeedback?.rating)}</span></p>
          <p className="mb-0"><strong>Content:</strong><br />{detailFeedback?.comment || "No content."}</p>
          {detailFeedback?.moderationReason && (
            <p className="mt-3 mb-0"><strong>Moderation reason:</strong> {detailFeedback.moderationReason}</p>
          )}
        </Modal.Body>
      </Modal>
      <Modal show={!!target} onHide={() => !busy && setTarget(null)} centered>
        <Modal.Header closeButton={!busy}>
          <Modal.Title>
            {target?.isHidden ? "Show review again" : "Hide violating reviews"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FloatingAlert message={error} onClose={() => setError("")} />
          <p className="mb-2">
            <strong>{target?.customerName}</strong>: {target?.comment || "(no content)"}
          </p>
          <Form.Group>
            <Form.Label>Reason *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={busy}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" disabled={busy} onClick={() => setTarget(null)}>
            Back
          </Button>
          <Button disabled={busy} onClick={submit}>
            {busy ? "Saving…" : "Confirm"}
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
