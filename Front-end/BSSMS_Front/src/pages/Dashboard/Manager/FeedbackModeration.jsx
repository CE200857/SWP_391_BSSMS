import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  Modal,
  Spinner,
  Table,
} from "react-bootstrap";
import { api } from "../../../services/api";

// 9.3: Manager hides / restores reviews that violate the rules.
export default function FeedbackModeration() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState(null);
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
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Load the moderation list when the page opens.
    load();
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((fb) => {
      const hidden = Boolean(fb.isHidden);
      if (filter === "visible" && hidden) return false;
      if (filter === "hidden" && !hidden) return false;
      if (!term) return true;
      return [fb.customerName, fb.serviceName, fb.comment]
        .filter(Boolean)
        .some((text) => String(text).toLowerCase().includes(term));
    });
  }, [items, filter, search]);

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
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const stars = (rating) => "★".repeat(rating || 0) + "☆".repeat(5 - (rating || 0));

  return (
    <section>
      <div className="ui-page-heading">
        <div>
          <h1>Duyệt đánh giá khách hàng</h1>
          <p>Ẩn đánh giá vi phạm khỏi trang công khai hoặc hiển thị lại khi cần.</p>
        </div>
      </div>
      {error && !target && <Alert variant="danger">{error}</Alert>}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
      <div className="d-flex gap-2 flex-wrap mb-3">
        <Form.Control
          style={{ maxWidth: 320 }}
          placeholder="Tìm theo khách, dịch vụ, nội dung…"
          aria-label="Tìm đánh giá"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Form.Select
          style={{ maxWidth: 220 }}
          aria-label="Lọc trạng thái"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Tất cả</option>
          <option value="visible">Đang hiển thị</option>
          <option value="hidden">Đã ẩn</option>
        </Form.Select>
      </div>
      {loading ? (
        <div className="ui-empty">
          <Spinner animation="border" />
        </div>
      ) : (
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Dịch vụ</th>
                    <th>Đánh giá</th>
                    <th>Nội dung</th>
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
                      <td style={{ maxWidth: 320 }}>{fb.comment || "—"}</td>
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
                        <Button
                          size="sm"
                          variant={fb.isHidden ? "outline-primary" : "outline-danger"}
                          onClick={() => {
                            setError("");
                            setReason("");
                            setTarget(fb);
                          }}
                        >
                          {fb.isHidden ? "Hiển thị lại" : "Ẩn"}
                        </Button>
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
