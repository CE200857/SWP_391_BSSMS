import { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { Card, Form, Badge, Spinner, Alert } from "react-bootstrap";
import { ServiceLinesEditor, useSlots, emptyLine } from "../../../components/BookingPicker";
import { api, today, viDate } from "../../../services/api";

const CheckSlotAvailability = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role || "Guest";
  const initialService = new URLSearchParams(location.search).get("serviceId") || "";

  const [services, setServices] = useState([]);
  const [lines, setLines] = useState([{ ...emptyLine(), serviceId: initialService }]);
  const [selectedDate, setSelectedDate] = useState(today());
  const [selectedTechId, setSelectedTechId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api("/api/service")
      .then((rows) => {
        const active = (rows || []).filter((s) => s.status === "Active");
        setServices(active);
        setLines((current) => current[0].serviceId || !active.length ? current : [{ ...emptyLine(), serviceId: String(active[0].serviceId) }]);
      })
      .catch(() => setError("Could not load the service list. Please try again."));
  }, [user]);

  const { data: slotData, loading, error: slotError } = useSlots(lines, selectedDate, selectedTechId);
  const serviceIds = lines.filter((l) => l.serviceId).map((l) => l.serviceId);
  const title = slotData?.services?.map((s) => s.serviceName).join(" → ");

  const handleSelectSlot = (slot) => {
    if (!slot.available) return;
    const chosen = { serviceIds, appointmentDate: selectedDate, startTime: slot.startTime, technicianId: selectedTechId };
    if (role === "Customer") navigate("/appointments/online", { state: chosen });
    else navigate("/appointments/create", { state: chosen });
  };

  if (!user) return <Navigate to="/login" state={{ from: "/slots" + location.search }} replace />;

  const filters = (
    <>
      <ServiceLinesEditor services={services} lines={lines} onChange={(next) => { setLines(next); setSelectedTechId(""); }} />
      <div className="public-slot-filter-fields mt-3">
        <Form.Group>
          <Form.Label>Appointment date *</Form.Label>
          <Form.Control type="date" min={today()} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required />
        </Form.Group>
        <Form.Group>
          <Form.Label>Technician (optional)</Form.Label>
          <Form.Select value={selectedTechId} onChange={(e) => setSelectedTechId(e.target.value)}>
            <option value="">All technicians</option>
            {slotData?.technicians?.map((t) => (
              <option key={t.staffId} value={t.staffId}>{t.fullName}</option>
            ))}
          </Form.Select>
        </Form.Group>
      </div>
    </>
  );

  if (role === "Customer") {
    return (
      <main className="public-slot-page">
        <section className="customer-page-banner public-slot-banner">
          <div className="customer-page-container">
            <div className="customer-breadcrumb">
              <button type="button" onClick={() => navigate("/customer/home")}>Home</button>
              <i className="bi bi-chevron-right" aria-hidden="true" />
              <strong>Check available times</strong>
            </div>
            <div className="public-slot-banner-row">
              <div>
                <span className="home-eyebrow">TAKE SOME TIME FOR YOURSELF</span>
                <h1>Check available times</h1>
                <p>Choose up to 4 services, an appointment date and your preferred technician.<br />Find a time that suits you for your next visit to Seoul Center.</p>
              </div>
              <div className="customer-summary-card public-slot-summary">
                <span><i className="bi bi-calendar2-check" aria-hidden="true" /> Time slots on {viDate(selectedDate)}</span>
                <strong>{slotData?.slots?.filter((s) => s.available).length ?? "—"}</strong>
                <small>available time slots</small>
              </div>
            </div>
          </div>
        </section>

        <div className="customer-page-container public-slot-content">
          {(error || slotError) && <Alert variant="danger">{error || slotError}</Alert>}
          <section className="public-slot-filter-panel">
            <div className="customer-filter-title">
              <strong><i className="bi bi-sliders" aria-hidden="true" /> Find a time that suits you</strong>
              <small>* Required information</small>
            </div>
            {filters}
          </section>

          {loading ? (
            <div className="customer-empty-state public-slot-loading" role="status">
              <Spinner animation="border" variant="danger" />
              <strong>Checking availability...</strong>
            </div>
          ) : slotData ? (
            <section className="public-slot-results">
              <div className="public-slot-results-heading">
                <div>
                  <h2>Available times <span>{slotData.slots?.filter((s) => s.available).length || 0} time slots</span></h2>
                  <strong>{title}</strong>
                  <small><i className="bi bi-calendar3" aria-hidden="true" /> {viDate(selectedDate)} <i className="bi bi-clock" aria-hidden="true" /> Total duration: {slotData.totalDuration} minutes</small>
                </div>
                <div className="public-slot-legend">
                  <span><i className="is-available" /> Available</span>
                  <span><i className="is-unavailable" /> Unavailable</span>
                </div>
              </div>
              {slotData.slots?.length ? (
                <div className="public-slot-grid">
                  {slotData.slots.map((slot) => (
                    <button key={slot.startTime} type="button" className={`public-slot-card${slot.available ? "" : " is-unavailable"}`}
                      disabled={!slot.available} onClick={() => handleSelectSlot(slot)}>
                      <strong>{slot.startTime}–{slot.endTime}</strong>
                      <span className="public-slot-status">{slot.available ? "Available" : slot.reason}</span>
                      <small><i className="bi bi-person" aria-hidden="true" /> {slot.availableTechnicianCount} available technicians</small>
                      {slot.available && <span className="public-slot-cta">Book online <i className="bi bi-arrow-right" aria-hidden="true" /></span>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="customer-empty-state">
                  <i className="bi bi-calendar-x" aria-hidden="true" />
                  <strong>No times available</strong>
                  <span>The total duration exceeds opening hours. Try removing a service.</span>
                </div>
              )}
              <div className="public-slot-footer-note">
                <span>Online bookings must be made at least 2 hours and at most 30 days in advance.</span>
                <span>Select a time to book online.</span>
              </div>
            </section>
          ) : (
            <div className="customer-empty-state">
              <i className="bi bi-calendar2-week" aria-hidden="true" />
              <strong>Select a service to check available times</strong>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <section className="staff-slot-availability">
      <div className="ui-page-heading">
        <div>
          <h1>Check available times</h1>
          <p className="text-muted mb-0">Check available time slots for 1–4 back-to-back services by date and technician.</p>
        </div>
      </div>

      <Card className="staff-slot-filter-card mb-4">
        <Card.Header className="staff-slot-card-heading">
          <strong>Search criteria</strong>
          <span>A time slot is available only when there are enough skilled technicians on shift and free beds of the right room type.</span>
        </Card.Header>
        <Card.Body>{filters}</Card.Body>
      </Card>

      {(error || slotError) && <Alert variant="danger">{error || slotError}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
          <p className="mt-2 text-muted">Checking availability...</p>
        </div>
      ) : slotData ? (
        <Card className="staff-slot-results-card">
          <Card.Header className="staff-slot-results-heading">
            <div>
              <h2>{title}</h2>
              <Badge bg="primary">Total duration: {slotData.totalDuration} minutes</Badge>
            </div>
            <div className="staff-slot-results-meta">
              <span className="staff-slot-date"><i className="bi bi-calendar3" aria-hidden="true" />{viDate(selectedDate)}</span>
              <div className="staff-slot-legend">
                <span className="is-available"><i aria-hidden="true" /> Available</span>
                <span className="is-unavailable"><i aria-hidden="true" /> Unavailable</span>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="staff-slot-grid">
              {slotData.slots?.map((slot) => (
                <button key={slot.startTime} onClick={() => handleSelectSlot(slot)} type="button" disabled={!slot.available || role !== "Receptionist"}
                  className={`staff-slot-card${slot.available ? "" : " is-unavailable"}`}>
                  <strong className="staff-slot-time">{slot.startTime} – {slot.endTime}</strong>
                  <span className="staff-slot-status">{slot.available ? "Available" : slot.reason}</span>
                  <span className="staff-slot-capacity"><i className="bi bi-person-check" aria-hidden="true" />
                    {slot.freeTechnicians ? `Can take ${slot.availableTechnicianCount} more` : `${slot.availableTechnicianCount} available technicians`}
                  </span>
                  {slot.available && (slot.freeTechnicians || []).map((part, i, all) => (
                    <span key={i} className="staff-slot-techs" title={part.map((t) => t.fullName).join(", ")}>
                      <b>{all.length > 1 ? `Part ${i + 1} – ` : ""}Available technicians: </b>
                      {part.length ? part.map((t) => t.fullName.split(" ").slice(-2).join(" ")).join(", ") : "—"}
                    </span>
                  ))}
                  {slot.available && slot.waitingAppointments > 0 && (
                    <span className="staff-slot-techs text-muted">{slot.waitingAppointments} other appointments are waiting for a technician</span>
                  )}
                  {slot.available && role === "Receptionist" && (
                    <span className="staff-slot-action">Book at the counter <i className="bi bi-arrow-right" aria-hidden="true" /></span>
                  )}
                </button>
              ))}
            </div>
          </Card.Body>
        </Card>
      ) : null}
    </section>
  );
};

export default CheckSlotAvailability;
