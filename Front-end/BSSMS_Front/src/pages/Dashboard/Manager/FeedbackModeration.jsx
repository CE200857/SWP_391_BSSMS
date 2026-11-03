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

// 9.3: Manager hides / restores reviews that violate the rules.
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
        throw new Error("Dữ liệu tổng quan đánh giá không hợp lệ.");
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
      { key: "customerName", label: "Khách hàng", filterable: false },
      { key: "serviceName", label: "Dịch vụ", filterable: false },
      { key: "comment", label: "Nội dung đánh giá", filterable: false },
      { key: "rating", label: "Số sao" },
      {
        key: "visibility",
        label: "Trạng thái",
        getValue: (feedback) => feedback.isHidden ? "hidden" : "visible",
        formatValue: (value) => value === "hidden" ? "Đã ẩn" : "Đang hiển thị",
      },
      { key: "appointmentDate", label: "Ngày đánh giá", type: "date" },
    ],
    "Tìm theo khách hàng, dịch vụ, nội dung...",
  );

  async function submit() {
    if (!target || busy) return;
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do.");
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
        target.isHidden ? "Đã hiển thị lại đánh giá." : "Đã ẩn đánh giá.",
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
            <h1>Duyệt đánh giá khách hàng</h1>
            <p>Ẩn đánh giá vi phạm khỏi trang công khai hoặc hiển thị lại khi cần.</p>
          </div>
        </div>
      )}
      <section className="feedback-moderation-overview" aria-label="Tổng quan đánh giá">
        {statsError && <Alert variant="danger">{statsError}</Alert>}
        <Row className="g-3 mb-3">
          <Col md={4}>
            <Card className="feedback-stat-card h-100">
              <Card.Body className="text-center">
                <i className="bi bi-chat-quote-fill text-primary" aria-hidden="true" />
                <strong>{statsLoading ? "—" : publicStats.total}</strong>
                <span>Tổng đánh giá công khai</span>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="feedback-stat-card h-100">
              <Card.Body className="text-center">
                <i className="bi bi-star-fill text-warning" aria-hidden="true" />
                <strong>{statsLoading ? "—" : `${publicStats.average} / 5`}</strong>
                <span>Điểm trung bình</span>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="feedback-stat-card h-100">
              <Card.Body className="text-center">
                <i className="bi bi-emoji-laughing-fill text-success" aria-hidden="true" />
                <strong>{statsLoading ? "—" : publicStats.fiveStar}</strong>
                <span>Đánh giá 5 sao</span>
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
                    <th>Khách hàng</th>
                    <th>Dịch vụ</th>
                    <th>Đánh giá</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((fb) => (
                    <tr key={fb.feedbackId}>
                      <td>{fb.customerName}</td>
                      <td>
                        {fb.serviceName || "—"}
                        <div className="small text-muted">
                          {fb.appointmentDate
                            ? String(fb.appointmentDate).slice(0, 10)
                            : ""}
                        </div>
                      </td>
                      <td className="text-warning">{stars(fb.rating)}</td>
                      <td>
                        {fb.isHidden ? (
                          <>
                            <Badge bg="secondary">Đã ẩn</Badge>
                            {fb.moderationReason && (
                              <div className="small text-muted">
                                Lý do: {fb.moderationReason}
                              </div>
                            )}
                          </>
                        ) : (
                          <Badge bg="success">Đang hiển thị</Badge>
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
                          Xem
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
                          {fb.isHidden ? "Hiển thị lại" : "Ẩn"}
                        </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {!visible.length && <p className="ui-empty">Không có đánh giá phù hợp.</p>}
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
          <Modal.Title>Chi tiết đánh giá</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Khách hàng:</strong> {detailFeedback?.customerName || "—"}</p>
          <p><strong>Dịch vụ:</strong> {detailFeedback?.serviceName || "—"}</p>
          <p><strong>Ngày:</strong> {detailFeedback?.appointmentDate ? String(detailFeedback.appointmentDate).slice(0, 10) : "—"}</p>
          <p><strong>Đánh giá:</strong> <span className="text-warning">{stars(detailFeedback?.rating)}</span></p>
          <p className="mb-0"><strong>Nội dung:</strong><br />{detailFeedback?.comment || "Không có nội dung."}</p>
          {detailFeedback?.moderationReason && (
            <p className="mt-3 mb-0"><strong>Lý do kiểm duyệt:</strong> {detailFeedback.moderationReason}</p>
          )}
        </Modal.Body>
      </Modal>
      <Modal show={!!target} onHide={() => !busy && setTarget(null)} centered>
        <Modal.Header closeButton={!busy}>
          <Modal.Title>
            {target?.isHidden ? "Hiển thị lại đánh giá" : "Ẩn đánh giá vi phạm"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <p className="mb-2">
            <strong>{target?.customerName}</strong>: {target?.comment || "(không có nội dung)"}
          </p>
          <Form.Group>
            <Form.Label>Lý do *</Form.Label>
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
            Quay lại
          </Button>
          <Button disabled={busy} onClick={submit}>
            {busy ? "Đang lưu…" : "Xác nhận"}
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
