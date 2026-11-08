import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import { api, money, post } from "../services/api";

const MAX_LINES = 6;
const hhmm = (value) => String(value || "").slice(0, 5);

/**
 * Các dịch vụ trong một lịch hẹn (một lịch có thể có nhiều dịch vụ nối tiếp nhau).
 * Khách thêm/xóa dịch vụ khi lịch còn chờ xác nhận hoặc đã xác nhận; lễ tân đến khi đang thực hiện.
 * Quy tắc chi tiết (giờ trống, phòng, thiết bị, trước 18:30...) do máy chủ kiểm tra và trả thông báo lỗi.
 */
export default function AppointmentServices({ appointment, role, onLoaded }) {
  const appointmentId = appointment?.appointmentId;
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [now] = useState(() => Date.now()); // mốc "bây giờ" lúc mở trang, dùng để biết lịch đã qua giờ chưa

  useEffect(() => {
    if (!appointmentId) return undefined;
    let active = true;
    api(`/api/appointment-services?appointmentId=${appointmentId}`)
      .then((data) => {
        if (active) {
          const list = Array.isArray(data) ? data : [];
          setLines(list);
          setError("");
          if (onLoaded) onLoaded(list); // trang chi tiết dùng để tổng hợp nhân viên, phòng của mọi dịch vụ
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [appointmentId, revision, onLoaded]);

  const startsAt = appointment?.appointmentDate
    ? new Date(`${String(appointment.appointmentDate).slice(0, 10)}T${hhmm(appointment.startTime) || "00:00"}:00`)
    : null;
  const canEdit =
    (role === "Customer" &&
      ["Pending", "Confirmed"].includes(appointment?.status) &&
      startsAt !== null &&
      startsAt.getTime() > now) ||
    (role === "Receptionist" && ["Pending", "Confirmed", "Checked-in", "In-progress"].includes(appointment?.status));

  const openAdd = useCallback(async () => {
    setError("");
    setServiceId("");
    setShowAdd(true);
    try {
      const data = await api("/api/service");
      setServices((Array.isArray(data) ? data : []).filter((s) => s.status === "Active"));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  async function addService(event) {
    event.preventDefault();
    if (!serviceId || busy) return;
    setBusy(true);
    setError("");
    try {
      await post("/api/appointment-services", { appointmentId, serviceId: Number(serviceId) });
      setShowAdd(false);
      setRevision((value) => value + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeService(line) {
    if (busy || !window.confirm(`Xóa dịch vụ "${line.serviceName}" khỏi lịch hẹn?`)) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/appointment-services?appointmentId=${appointmentId}&serviceId=${line.serviceId}`, { method: "DELETE" });
      setRevision((value) => value + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!appointmentId) return null;
  const inLines = new Set(lines.map((line) => line.serviceId));
  const addable = services.filter((s) => !inLines.has(s.serviceId));
  const total = lines.reduce((sum, line) => sum + Number(line.unitPrice || 0), 0);

  return (
    <section className="appointment-detail-section mt-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h3 className="mb-0">
          <i className="bi bi-list-check" aria-hidden="true" /> Dịch vụ trong lịch hẹn ({lines.length})
        </h3>
        {canEdit && lines.length < MAX_LINES && (
          <Button size="sm" variant="outline-primary" onClick={openAdd} disabled={busy}>
            <i className="bi bi-plus-lg" aria-hidden="true" /> Thêm dịch vụ
          </Button>
        )}
      </div>
      {error && !showAdd && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <Spinner animation="border" size="sm" />
      ) : (
        <div className="table-responsive">
          <Table size="sm" className="mb-1">
            <thead>
              <tr>
                <th>#</th>
                <th>Dịch vụ</th>
                <th>Giờ</th>
                <th>Phòng</th>
                <th>Kỹ thuật viên</th>
                <th className="text-end">Giá</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.lineNo}>
                  <td>{line.lineNo}</td>
                  <td>{line.serviceName}</td>
                  <td>
                    {hhmm(line.startTime)} – {hhmm(line.endTime)}
                  </td>
                  <td>{line.roomName ? `${line.roomName}${line.bedNumber ? ` · ${line.bedNumber}` : ""}` : "—"}</td>
                  <td>
                    {(line.staff || []).length === 0
                      ? "—"
                      : line.staff.map((s) => `${s.fullName}${s.role === "Main" ? "" : " (phụ)"}`).join(", ")}
                  </td>
                  <td className="text-end">{money(line.unitPrice)}</td>
                  {canEdit && (
                    <td className="text-end">
                      {line.lineNo > 1 && (
                        <Button size="sm" variant="link" className="text-danger p-0" disabled={busy} onClick={() => removeService(line)}>
                          Xóa
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            {lines.length > 1 && (
              <tfoot>
                <tr>
                  <th colSpan={5} className="text-end">
                    Tổng giá niêm yết
                  </th>
                  <th className="text-end">{money(total)}</th>
                  {canEdit && <th />}
                </tr>
              </tfoot>
            )}
          </Table>
        </div>
      )}
      {lines.length > 1 && appointment?.customerPackageId && (
        <small className="text-muted">Dịch vụ đầu tiên dùng buổi trong gói; các dịch vụ thêm vào tính tiền lẻ.</small>
      )}

      <Modal show={showAdd} onHide={() => !busy && setShowAdd(false)} centered>
        <Form onSubmit={addService}>
          <Modal.Header closeButton={!busy}>
            <Modal.Title>Thêm dịch vụ vào lịch hẹn #{appointmentId}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group>
              <Form.Label>Dịch vụ</Form.Label>
              <Form.Select required value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                <option value="">Chọn dịch vụ</option>
                {addable.map((s) => (
                  <option key={s.serviceId} value={s.serviceId}>
                    {s.serviceName} · {s.duration} phút · {money(s.price)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <p className="text-muted small mt-3 mb-0">
              Dịch vụ mới được xếp ngay sau dịch vụ cuối của lịch hẹn. Hệ thống tự chọn phòng và giường trống đúng loại
              (ví dụ nặn mụn ở phòng chăm sóc da, massage ở phòng massage) và kỹ thuật viên đang rảnh. Tất cả phải kết thúc trước 18:30.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAdd(false)} disabled={busy}>
              Hủy
            </Button>
            <Button type="submit" disabled={busy || !serviceId}>
              {busy ? "Đang thêm…" : "Thêm dịch vụ"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </section>
  );
}
