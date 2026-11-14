import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Card, Col, Container, Form, ListGroup, Row, Spinner } from "react-bootstrap";
import {
  ServiceLinesEditor, SlotGrid, PlanPreview, useSlots, emptyLine, toServiceLines, estimateTotal,
} from "../../../components/BookingPicker";
import { api, post, money, today, viDate } from "../../../services/api";

export default function CreateWalkInAppointment() {
  const navigate = useNavigate();
  const prefill = useLocation().state || {};
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState(null);
  const [packages, setPackages] = useState([]);
  const [lines, setLines] = useState(() =>
    prefill.serviceIds?.length ? prefill.serviceIds.map((id) => ({ serviceId: String(id), customerPackageId: "" })) : [emptyLine()],
  );
  const [date, setDate] = useState(prefill.appointmentDate || today());
  const [technicianId, setTechnicianId] = useState(prefill.technicianId || "");
  const [startTime, setStartTime] = useState(prefill.startTime || "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/api/customers").then((rows) => setCustomers((rows || []).filter((c) => c.status === "Active"))).catch((e) => setError(e.message));
    api("/api/service").then((rows) => setServices((rows || []).filter((s) => s.status === "Active"))).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setPackages([]);
    if (!customer) return;
    api(`/api/booking/my-packages?customerId=${customer.customerId}`).then((rows) => setPackages(rows || [])).catch(() => setPackages([]));
    setLines((current) => current.map((l) => ({ ...l, customerPackageId: "" })));
  }, [customer]);

  const matches = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("vi-VN");
    if (!q) return [];
    return customers.filter((c) => `${c.fullName} ${c.phone} ${c.email || ""}`.toLocaleLowerCase("vi-VN").includes(q)).slice(0, 8);
  }, [customers, search]);

  const slots = useSlots(lines, date, technicianId);
  const chosen = toServiceLines(lines);
  const selectedSlot = slots.data?.slots?.find((s) => s.startTime === startTime);
  const total = estimateTotal(lines, services);
  const tier = customer?.membership;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!customer) return setError("Vui lòng chọn khách hàng.");
    if (!chosen.length) return setError("Vui lòng chọn ít nhất một dịch vụ.");
    if (!startTime) return setError("Vui lòng chọn khung giờ còn trống.");
    setSaving(true);
    try {
      const data = await post("/api/appointments", {
        customerId: customer.customerId,
        services: chosen,
        appointmentDate: date,
        startTime,
        technicianId: technicianId ? Number(technicianId) : null,
        paymentChoice: "Counter",
        notes: notes.trim() || null,
      });
      navigate(`/appointments/${data.appointmentId}`, { state: { created: true } });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container fluid className="mt-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="manager-page-title fw-bold mb-1">Tạo lịch hẹn tại quầy</h2>
          <p className="text-muted mb-0">Lịch tạo tại quầy được xác nhận ngay. Tối đa 4 dịch vụ làm liên tiếp.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => navigate("/appointments")}>
            <i className="bi bi-arrow-left" /> Danh sách lịch hẹn
          </Button>
          <Button variant="outline-primary" onClick={() => navigate("/receptionist/create-walkin")}>
            <i className="bi bi-person-plus" /> Tạo khách hàng mới
          </Button>
        </div>
      </div>
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

      <Form onSubmit={submit}>
        <Row className="g-4">
          <Col lg={8}>
            <Card className="shadow-sm border-0 mb-4">
              <Card.Header className="bg-white fw-bold">1. Khách hàng</Card.Header>
              <Card.Body>
                {customer ? (
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <strong>{customer.fullName}</strong> · {customer.phone}
                      {tier && <Badge bg="info" className="ms-2">{tier.tierName} · giảm {Number(tier.discountPercent)}%</Badge>}
                      {packages.length > 0 && <Badge bg="success" className="ms-2">{packages.length} gói còn buổi</Badge>}
                    </div>
                    <Button variant="link" onClick={() => { setCustomer(null); setSearch(""); }}>Đổi khách hàng</Button>
                  </div>
                ) : (
                  <>
                    <Form.Control placeholder="Tìm theo họ tên, số điện thoại hoặc email..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
                    {matches.length > 0 && (
                      <ListGroup className="mt-2">
                        {matches.map((c) => (
                          <ListGroup.Item action key={c.customerId} onClick={() => setCustomer(c)}>
                            <strong>{c.fullName}</strong> · {c.phone} {c.email ? `· ${c.email}` : ""}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                    {search && !matches.length && <p className="text-muted small mt-2 mb-0">Không tìm thấy khách hàng. Hãy tạo khách hàng mới.</p>}
                  </>
                )}
              </Card.Body>
            </Card>

            <Card className="shadow-sm border-0 mb-4">
              <Card.Header className="bg-white fw-bold">2. Dịch vụ</Card.Header>
              <Card.Body>
                <ServiceLinesEditor services={services} packages={packages} lines={lines} onChange={(next) => { setLines(next); setStartTime(""); }} disabled={saving} />
              </Card.Body>
            </Card>

            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white fw-bold">3. Ngày, kỹ thuật viên & khung giờ</Card.Header>
              <Card.Body>
                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Label>Ngày hẹn *</Form.Label>
                    <Form.Control type="date" min={today()} value={date} onChange={(e) => { setDate(e.target.value); setStartTime(""); }} />
                  </Col>
                  <Col md={6}>
                    <Form.Label>Kỹ thuật viên khách yêu cầu</Form.Label>
                    <Form.Select value={technicianId} onChange={(e) => { setTechnicianId(e.target.value); setStartTime(""); }}>
                      <option value="">Không yêu cầu (xếp theo lượt tour khi check-in)</option>
                      {slots.data?.technicians?.map((t) => <option key={t.staffId} value={t.staffId}>{t.fullName}</option>)}
                    </Form.Select>
                  </Col>
                </Row>
                <SlotGrid slots={slots.data?.slots} loading={slots.loading} error={slots.error} value={startTime} onSelect={setStartTime} />
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="shadow-sm border-0 position-sticky" style={{ top: 16 }}>
              <Card.Header className="bg-white fw-bold">Tóm tắt lịch hẹn</Card.Header>
              <Card.Body>
                <p className="mb-1"><strong>Khách:</strong> {customer?.fullName || "—"}</p>
                <p className="mb-1"><strong>Ngày:</strong> {viDate(date)}</p>
                <p className="mb-2"><strong>Khung giờ:</strong> {selectedSlot ? `${selectedSlot.startTime} – ${selectedSlot.endTime}` : "Chưa chọn"}</p>
                <PlanPreview services={slots.data?.services} startTime={startTime} />
                <p className="mb-1"><strong>Tạm tính:</strong> {money(total)}</p>
                {tier && Number(tier.discountPercent) > 0 && (
                  <p className="text-muted small">Giảm theo hạng {tier.tierName} được trừ khi lập hóa đơn.</p>
                )}
                <Form.Group className="mb-3">
                  <Form.Label>Ghi chú</Form.Label>
                  <Form.Control as="textarea" rows={3} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Form.Group>
                <Button type="submit" className="w-100 fw-bold" disabled={saving || !customer || !startTime}>
                  {saving ? <><Spinner size="sm" /> Đang tạo lịch...</> : <><i className="bi bi-calendar-plus" /> Tạo lịch hẹn</>}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}
