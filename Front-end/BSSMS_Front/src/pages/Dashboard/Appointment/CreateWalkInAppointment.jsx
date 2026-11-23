import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge, Button, Card, Col, Container, Form, ListGroup, Row, Spinner } from "react-bootstrap";
import {
  ServiceLinesEditor, SlotGrid, PlanPreview, useSlots, emptyLine, toServiceLines, estimateTotal,
} from "../../../components/BookingPicker";
import { api, post, money, today, viDate } from "../../../services/api";
import FloatingAlert from "../../../components/FloatingAlert";

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
    if (!customer) return setError("Please select a customer.");
    if (!chosen.length) return setError("Please select at least one service.");
    if (!startTime) return setError("Please select an available time.");
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
          <h2 className="manager-page-title fw-bold mb-1">Create appointment at the counter</h2>
          <p className="text-muted mb-0">Appointments created at the counter are confirmed immediately. Up to 4 back-to-back services.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => navigate("/appointments")}>
            <i className="bi bi-arrow-left" /> Appointment list
          </Button>
          <Button variant="outline-primary" onClick={() => navigate("/receptionist/create-walkin")}>
            <i className="bi bi-person-plus" /> Create new customer
          </Button>
        </div>
      </div>
      <FloatingAlert message={error} onClose={() => setError("")} />

      <Form onSubmit={submit}>
        <Row className="g-4">
          <Col lg={8}>
            <Card className="shadow-sm border-0 mb-4">
              <Card.Header className="bg-white fw-bold">1. Customer</Card.Header>
              <Card.Body>
                {customer ? (
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <strong>{customer.fullName}</strong> · {customer.phone}
                      {tier && <Badge bg="info" className="ms-2">{tier.tierName} · discount {Number(tier.discountPercent)}%</Badge>}
                      {packages.length > 0 && <Badge bg="success" className="ms-2">{packages.length} packages with sessions left</Badge>}
                    </div>
                    <Button variant="link" onClick={() => { setCustomer(null); setSearch(""); }}>Change customer</Button>
                  </div>
                ) : (
                  <>
                    <Form.Control placeholder="Search by name, phone number or email..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
                    {matches.length > 0 && (
                      <ListGroup className="mt-2">
                        {matches.map((c) => (
                          <ListGroup.Item action key={c.customerId} onClick={() => setCustomer(c)}>
                            <strong>{c.fullName}</strong> · {c.phone} {c.email ? `· ${c.email}` : ""}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                    {search && !matches.length && <p className="text-muted small mt-2 mb-0">Customer not found. Create a new customer.</p>}
                  </>
                )}
              </Card.Body>
            </Card>

            <Card className="shadow-sm border-0 mb-4">
              <Card.Header className="bg-white fw-bold">2. Service</Card.Header>
              <Card.Body>
                <ServiceLinesEditor services={services} packages={packages} lines={lines} onChange={(next) => { setLines(next); setStartTime(""); }} disabled={saving} />
              </Card.Body>
            </Card>

            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white fw-bold">3. Date, technician & time slots</Card.Header>
              <Card.Body>
                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Label>Appointment date *</Form.Label>
                    <Form.Control type="date" min={today()} value={date} onChange={(e) => { setDate(e.target.value); setStartTime(""); }} />
                  </Col>
                  <Col md={6}>
                    <Form.Label>Requested technician</Form.Label>
                    <Form.Select value={technicianId} onChange={(e) => { setTechnicianId(e.target.value); setStartTime(""); }}>
                      <option value="">No preference (assigned by tour rotation at check-in)</option>
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
              <Card.Header className="bg-white fw-bold">Appointment summary</Card.Header>
              <Card.Body>
                <p className="mb-1"><strong>Customer:</strong> {customer?.fullName || "—"}</p>
                <p className="mb-1"><strong>Date:</strong> {viDate(date)}</p>
                <p className="mb-2"><strong>Time slot:</strong> {selectedSlot ? `${selectedSlot.startTime} – ${selectedSlot.endTime}` : "Not selected"}</p>
                <PlanPreview services={slots.data?.services} startTime={startTime} />
                <p className="mb-1"><strong>Subtotal:</strong> {money(total)}</p>
                {tier && Number(tier.discountPercent) > 0 && (
                  <p className="text-muted small">Tier discount {tier.tierName} are deducted when the invoice is created.</p>
                )}
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control as="textarea" rows={3} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Form.Group>
                <Button type="submit" className="w-100 fw-bold" disabled={saving || !customer || !startTime}>
                  {saving ? <><Spinner size="sm" /> Creating appointment...</> : <><i className="bi bi-calendar-plus" /> Create appointment</>}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}
