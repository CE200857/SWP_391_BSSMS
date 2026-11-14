import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { api, put, time5, label } from "../../../services/api";
import "./UpdateRoomBedStatus.css";

const bedVariant = (bed, roomMaintenance) =>
  roomMaintenance || bed.status !== "Active" ? "secondary" : bed.useState === "InUse" ? "danger" : "success";
const roomBg = { Free: "success", Full: "danger", Maintenance: "secondary" };

export default function UpdateRoomBedStatus({ user }) {
  const canEdit = user?.role === "Receptionist";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await api("/api/room-bed-status"));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  const toggle = async (bed) => {
    const next = bed.useState === "InUse" ? "Free" : "InUse";
    setBusy(bed.bedId);
    try {
      await put(`/api/room-bed-status/bed/${bed.bedId}`, { status: next });
      setNotice(`Giường ${bed.bedNumber}: ${label(next)}.`);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const s = data?.summary;
  return (
    <Container fluid className="mt-4 px-4 room-bed-page">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h2 className="manager-page-title fw-bold mb-1">Trạng thái phòng & giường</h2>
          <p className="text-muted mb-0">Cập nhật tự động khi kỹ thuật viên bắt đầu và hoàn thành dịch vụ.</p>
        </div>
        <Button variant="outline-secondary" onClick={load}><i className="bi bi-arrow-clockwise" /> Làm mới</Button>
      </div>
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {notice && <Alert variant="success" dismissible onClose={() => setNotice("")}>{notice}</Alert>}
      {s && (
        <div className="d-flex gap-3 mb-4 flex-wrap">
          <Badge bg="success" className="p-2 fs-6">Trống: {s.free}</Badge>
          <Badge bg="danger" className="p-2 fs-6">Đang dùng: {s.inUse}</Badge>
          <Badge bg="secondary" className="p-2 fs-6">Bảo trì: {s.maintenance}</Badge>
        </div>
      )}
      {!data && !error && <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div>}
      <Row className="g-4">
        {(data?.rooms || []).map((room) => {
          const roomMaintenance = room.status === "Maintenance";
          return (
            <Col key={room.roomId} md={6} xl={4}>
              <Card className="shadow-sm border-0 h-100 room-bed-list-card">
                <Card.Header className="room-bed-list-card-header d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{room.roomName}</strong>
                    <small className="d-block text-muted">{label(room.roomType)}</small>
                  </div>
                  <Badge bg={roomBg[room.state]}>{label(room.state)}</Badge>
                </Card.Header>
                <Card.Body>
                  {room.beds.length === 0 && <p className="text-muted mb-0">Phòng chưa có giường.</p>}
                  {room.beds.map((bed) => (
                    <div key={bed.bedId} className="d-flex justify-content-between align-items-start border-bottom py-2 gap-2">
                      <div>
                        <Badge bg={bedVariant(bed, roomMaintenance)} className="me-2">Giường {bed.bedNumber}</Badge>
                        {roomMaintenance || bed.status !== "Active" ? <small className="text-muted">Bảo trì</small> : (
                          <small>{label(bed.useState)}</small>
                        )}
                        {bed.appointmentId && (
                          <small className="d-block text-muted mt-1">
                            #{bed.appointmentId} · {bed.customerName} · {bed.serviceName} · {time5(bed.startTime)}–{time5(bed.endTime)}{bed.technicianName ? ` · ${bed.technicianName}` : ""}
                          </small>
                        )}
                      </div>
                      {canEdit && !roomMaintenance && bed.status === "Active" && (
                        <Button size="sm" variant="outline-secondary" disabled={busy === bed.bedId} onClick={() => toggle(bed)}>
                          {bed.useState === "InUse" ? "Đặt trống" : "Đặt đang dùng"}
                        </Button>
                      )}
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
}
