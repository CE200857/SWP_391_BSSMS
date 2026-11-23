import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { ServiceLinesEditor, SlotGrid, PlanPreview, useSlots, toServiceLines } from "../../../components/BookingPicker";
import { api, put, today, addDays, viDate, time5 } from "../../../services/api";
import FloatingAlert from "../../../components/FloatingAlert";

export default function RescheduleAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isCustomer = user?.role === "Customer";
  const [appointment, setAppointment] = useState(null);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [lines, setLines] = useState([]);
  const [date, setDate] = useState(today());
  const [startTime, setStartTime] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [detail, all] = await Promise.all([api(`/api/appointments/${id}`), api("/api/service")]);
        setAppointment(detail);
        setServices((all || []).filter((s) => s.status === "Active"));
        setLines((detail.services || []).map((l) => ({ serviceId: String(l.serviceId), customerPackageId: l.customerPackageId ? String(l.customerPackageId) : "" })));
        setDate(String(detail.appointmentDate).slice(0, 10));
        const owned = await api(isCustomer ? "/api/booking/my-packages" : `/api/booking/my-packages?customerId=${detail.customerId}`).catch(() => []);
        setPackages((owned || []).map((p) => ({
          ...p,
          availableSessions: Number(p.availableSessions) + (detail.services || []).filter((l) => String(l.customerPackageId) === String(p.customerPackageId)).length,
        })));
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [id, isCustomer]);

  const slots = useSlots(lines, date, "", id);
  const selected = slots.data?.slots?.find((s) => s.startTime === startTime);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!startTime) return setError("Please choose a new time slot.");
    setSaving(true);
    try {
      await put(`/api/appointments/${id}/reschedule`, {
        services: toServiceLines(lines), appointmentDate: date, startTime, reason: reason.trim() || null,
      });
      navigate(`/appointments/${id}`, { state: { rescheduled: true } });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!appointment && !error) return <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div>;

  return (
    <Container fluid className="mt-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="manager-page-title fw-bold mb-1">Reschedule appointment #{id}</h2>
          {appointment && (
            <p className="text-muted mb-0">
              Current appointment: {viDate(appointment.appointmentDate)} · {time5(appointment.startTime)}–{time5(appointment.endTime)} · {appointment.customerName}
            </p>
          )}
        </div>
        <Button variant="outline-secondary" onClick={() => navigate(`/appointments/${id}`)}><i className="bi bi-arrow-left" /> Back</Button>
      </div>
      <FloatingAlert message={error} onClose={() => setError("")} />
      {isCustomer && <Alert variant="info">After rescheduling, the appointment returns to Pending for the receptionist to approve again.</Alert>}

      {appointment && (
        <Form onSubmit={submit}>
          <Row className="g-4">
            <Col lg={8}>
              <Card className="shadow-sm border-0 mb-4">
                <Card.Header className="bg-white fw-bold">Service</Card.Header>
                <Card.Body>
                  <ServiceLinesEditor services={services} packages={packages} lines={lines} onChange={(next) => { setLines(next); setStartTime(""); }} disabled={saving} />
                </Card.Body>
              </Card>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white fw-bold">Date & new time slots</Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3" style={{ maxWidth: 260 }}>
                    <Form.Label>Appointment date</Form.Label>
                    <Form.Control type="date" min={today()} max={isCustomer ? addDays(today(), 30) : undefined} value={date}
                      onChange={(e) => { setDate(e.target.value); setStartTime(""); }} />
                  </Form.Group>
                  <SlotGrid slots={slots.data?.slots} loading={slots.loading} error={slots.error} value={startTime} onSelect={setStartTime} />
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white fw-bold">Confirm reschedule</Card.Header>
                <Card.Body>
                  <p className="mb-2"><strong>New time slot:</strong> {selected ? `${viDate(date)} · ${selected.startTime}–${selected.endTime}` : "Not selected"}</p>
                  <PlanPreview services={slots.data?.services} startTime={startTime} />
                  <Form.Group className="mb-3">
                    <Form.Label>Reschedule reason</Form.Label>
                    <Form.Control as="textarea" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
                  </Form.Group>
                  <Button type="submit" className="w-100 fw-bold" disabled={saving || !startTime}>
                    {saving ? <><Spinner size="sm" /> Saving...</> : "Confirm reschedule"}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>
      )}
    </Container>
  );
}
