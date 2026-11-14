import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Container, Form, Modal, Spinner, Table } from "react-bootstrap";
import { api, post, put, del, today, time5, viDate, label } from "../../../services/api";
import { imageFileToUpload } from "../../../utils/imageUpload";

const lineBadge = { Waiting: "secondary", InProgress: "primary", Done: "success" };

function OutcomeModal({ line, canEdit, onClose, onSaved }) {
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState("");
  const [skinReaction, setSkinReaction] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!line) return;
    try {
      const r = await api(`/api/treatment-outcomes/${line.appointmentServiceId}`);
      setData(r);
      setNotes(r.notes || "");
      setSkinReaction(r.skinReaction || "");
    } catch (e) {
      setError(e.message);
    }
  }, [line]);
  useEffect(() => { setData(null); setError(""); load(); }, [load]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await put(`/api/treatment-outcomes/${line.appointmentServiceId}`, { notes, skinReaction });
      onSaved("Đã lưu kết quả điều trị.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const upload = async (photoType, file) => {
    if (!file) return;
    setError("");
    try {
      const image = await imageFileToUpload(file);
      await post(`/api/treatment-photos/${line.appointmentServiceId}`, { photoType, ...image });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  const removePhoto = async (photoId) => {
    try {
      await del(`/api/treatment-photos/${photoId}`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Modal show={!!line} onHide={() => !saving && onClose()} size="lg" centered>
      <Modal.Header closeButton={!saving}>
        <Modal.Title>Kết quả điều trị · {line?.serviceName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {!data && !error && <div className="text-center py-4"><Spinner animation="border" variant="danger" /></div>}
        {data && (
          <>
            <p className="text-muted">Khách hàng: <strong>{data.customerName}</strong> · Lịch #{data.appointmentId}</p>
            <Form.Group className="mb-3">
              <Form.Label>Kết quả điều trị *</Form.Label>
              <Form.Control as="textarea" rows={4} maxLength={4000} value={notes} disabled={!canEdit} onChange={(e) => setNotes(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phản ứng da</Form.Label>
              <Form.Control as="textarea" rows={2} maxLength={1000} value={skinReaction} disabled={!canEdit} onChange={(e) => setSkinReaction(e.target.value)} />
              <Form.Text>Kết quả chỉ được sửa trong ngày thực hiện dịch vụ.</Form.Text>
            </Form.Group>
            <h6 className="fw-bold">Ảnh trước / sau ({(data.photos || []).length}/10)</h6>
            <div className="d-flex flex-wrap gap-3 mb-2">
              {(data.photos || []).map((p) => (
                <figure key={p.photoId} className="text-center mb-0">
                  <img src={`/api/treatment-photos/file/${p.photoId}`} alt={p.photoType} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }} />
                  <figcaption className="small">
                    {p.photoType === "Before" ? "Trước" : "Sau"}
                    {canEdit && <Button variant="link" size="sm" className="text-danger p-0 ms-2" onClick={() => removePhoto(p.photoId)}>Xóa</Button>}
                  </figcaption>
                </figure>
              ))}
            </div>
            {canEdit && (
              <div className="d-flex gap-3 flex-wrap">
                <Form.Group><Form.Label className="small">Thêm ảnh trước</Form.Label>
                  <Form.Control type="file" size="sm" accept="image/jpeg,image/png,image/webp" onChange={(e) => { upload("Before", e.target.files[0]); e.target.value = ""; }} /></Form.Group>
                <Form.Group><Form.Label className="small">Thêm ảnh sau</Form.Label>
                  <Form.Control type="file" size="sm" accept="image/jpeg,image/png,image/webp" onChange={(e) => { upload("After", e.target.files[0]); e.target.value = ""; }} /></Form.Group>
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose} disabled={saving}>Đóng</Button>
        {canEdit && <Button onClick={save} disabled={saving || !notes.trim()}>{saving ? "Đang lưu..." : "Lưu kết quả"}</Button>}
      </Modal.Footer>
    </Modal>
  );
}

export default function TreatmentStatus({ outcomeOnly = false }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isTechnician = user?.role === "Technician";
  const [date, setDate] = useState(today());
  const [status, setStatus] = useState(outcomeOnly ? "Done" : "");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(null);
  const [outcome, setOutcome] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (date) { params.set("fromDate", date); params.set("toDate", date); }
      if (status) params.set("status", status);
      setRows(await api(`/api/treatment-status?${params}`));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [date, status]);
  useEffect(() => { load(); }, [load]);

  const act = async (line, action) => {
    setBusy(line.appointmentServiceId);
    setError("");
    try {
      const r = await put(`/api/treatment-status/${line.appointmentServiceId}/${action}`, {});
      setNotice(action === "start" ? `Đã bắt đầu ${line.serviceName}.` : r?.appointmentCompleted
        ? `Đã hoàn thành ${line.serviceName}. Lịch hẹn #${line.appointmentId} đã hoàn tất.`
        : `Đã hoàn thành ${line.serviceName}.`);
      await load();
      if (action === "done") setOutcome(line);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Container fluid className="mt-4 px-4">
      <h2 className="manager-page-title fw-bold mb-1">{outcomeOnly ? "Ghi nhận kết quả điều trị" : "Trạng thái dịch vụ"}</h2>
      <p className="text-muted mb-4">
        {isTechnician
          ? "Bắt đầu và hoàn thành từng dịch vụ được giao theo đúng thứ tự. Hoàn thành dịch vụ dùng gói sẽ trừ 1 buổi."
          : "Theo dõi tiến độ thực hiện từng dịch vụ trong ngày."}
      </p>
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {notice && <Alert variant="success" dismissible onClose={() => setNotice("")}>{notice}</Alert>}

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="d-flex flex-wrap gap-3 align-items-center">
          <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 180 }} />
          <Form.Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 200 }}>
            <option value="">Tất cả trạng thái</option>
            <option value="Waiting">Chờ thực hiện</option>
            <option value="InProgress">Đang làm</option>
            <option value="Done">Hoàn thành</option>
          </Form.Select>
          <Button variant="outline-secondary" onClick={load}><i className="bi bi-arrow-clockwise" /> Làm mới</Button>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table hover responsive className="align-middle mb-0 manager-list-table">
            <thead className="table-dark">
              <tr><th>Giờ</th><th>Khách hàng</th><th>Dịch vụ</th><th>Phòng / giường</th>{!isTechnician && <th>KTV</th>}<th>Trạng thái</th><th className="text-center">Thao tác</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4"><Spinner animation="border" size="sm" /> Đang tải...</td></tr>
              ) : rows.length ? rows.map((l) => (
                <tr key={l.appointmentServiceId}>
                  <td className="fw-bold">{time5(l.startTime)}–{time5(l.endTime)}<small className="d-block text-muted">{viDate(l.appointmentDate)}</small></td>
                  <td>
                    {l.customerName}
                    {(l.allergies || l.skinCondition) && (
                      <small className="d-block text-danger"><i className="bi bi-exclamation-triangle" /> {[l.skinCondition, l.allergies && `Dị ứng: ${l.allergies}`].filter(Boolean).join(" · ")}</small>
                    )}
                  </td>
                  <td>{l.serviceName}{l.customerPackageId ? <Badge bg="success" className="ms-1">Gói</Badge> : null}<small className="d-block text-muted">Lịch #{l.appointmentId} · dịch vụ {l.lineNo}</small></td>
                  <td>{l.roomName ? `${l.roomName} · ${l.bedNumber}` : "—"}</td>
                  {!isTechnician && <td>{l.technicianName || "—"}</td>}
                  <td><Badge bg={lineBadge[l.status]}>{label(l.status)}</Badge></td>
                  <td className="text-center">
                    <div className="manager-list-actions">
                      {isTechnician && l.status === "Waiting" && (l.canStart === false ? (
                        <small className="text-muted d-inline-block text-start" style={{ maxWidth: 220 }}>
                          <i className="bi bi-hourglass-split me-1" />{l.startNote}
                        </small>
                      ) : (
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" disabled={busy === l.appointmentServiceId} onClick={() => act(l, "start")}>
                          <i className="bi bi-play-circle" /> Bắt đầu
                        </Button>
                      ))}
                      {isTechnician && l.status === "InProgress" && (
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" disabled={busy === l.appointmentServiceId} onClick={() => act(l, "done")}>
                          <i className="bi bi-check2-circle" /> Hoàn thành
                        </Button>
                      )}
                      {l.status === "Done" && (
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--view" onClick={() => setOutcome(l)}>
                          <i className="bi bi-journal-medical" /> {isTechnician ? "Kết quả" : "Xem kết quả"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="text-center text-muted py-4">Không có dịch vụ nào trong ngày đã chọn.</td></tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <OutcomeModal
        line={outcome}
        canEdit={isTechnician}
        onClose={() => setOutcome(null)}
        onSaved={(m) => { setOutcome(null); setNotice(m); load(); }}
      />
    </Container>
  );
}
