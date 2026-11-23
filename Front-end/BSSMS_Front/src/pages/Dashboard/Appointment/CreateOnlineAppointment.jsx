import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Form, Button, Spinner } from "react-bootstrap";
import FloatingAlert from "../../../components/FloatingAlert";
import {
  ServiceLinesEditor, SlotGrid, useSlots, emptyLine, toServiceLines, estimateTotal,
} from "../../../components/BookingPicker";
import { api, post, money, today, addDays, viDate } from "../../../services/api";

const CreateOnlineAppointment = () => {
  const navigate = useNavigate();
  const prefill = useLocation().state || {};
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [lines, setLines] = useState(() =>
    prefill.serviceIds?.length
      ? prefill.serviceIds.map((id) => ({ serviceId: String(id), customerPackageId: "" }))
      : prefill.serviceId
        ? [{ serviceId: String(prefill.serviceId), customerPackageId: "" }]
        : [emptyLine()],
  );
  const [appointmentDate, setAppointmentDate] = useState(() => {
    if (prefill.appointmentDate) return prefill.appointmentDate;
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes() >= 16 * 60 ? addDays(today(), 1) : today();
  });
  const [technicianId, setTechnicianId] = useState("");
  const [startTime, setStartTime] = useState(prefill.startTime || "");
  const [notes, setNotes] = useState("");
  const [paymentChoice, setPaymentChoice] = useState("Counter");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [packageId, setPackageId] = useState(prefill.customerPackageId ? String(prefill.customerPackageId) : "");
  const bookedPackage = packages.find((p) => String(p.customerPackageId) === packageId);
  const [tier, setTier] = useState(null);

  useEffect(() => {
    api("/api/membership-tiers?mine=1").then(setTier).catch(() => setTier(null));
  }, []);

  useEffect(() => {
    api("/api/service")
      .then((rows) => setServices((rows || []).filter((s) => s.status === "Active")))
      .catch((e) => setError(e.message));
    api("/api/booking/my-packages")
      .then((rows) => {
        const list = rows || [];
        setPackages(list);
        if (!prefill.customerPackageId) return;
        const pkg = list.find((p) => String(p.customerPackageId) === String(prefill.customerPackageId));
        if (!pkg || !pkg.services?.length || Number(pkg.availableSessions) <= 0) {
          setPackageId("");
          setError("The treatment package has no sessions left, has expired or no longer covers this service. Please choose another service.");
          return;
        }
        setLines([{ serviceId: String(pkg.services[0].serviceId), customerPackageId: String(pkg.customerPackageId) }]);
      })
      .catch(() => setPackages([]));
  }, [prefill.customerPackageId]);

  const leavePackageMode = (keep) => {
    setPackageId("");
    setLines((current) => (keep ? [...current, emptyLine()] : [emptyLine()]));
    setStartTime("");
  };

  const slots = useSlots(lines, appointmentDate, technicianId);
  const selectedSlot = slots.data?.slots?.find((s) => s.startTime === startTime);
  const chosen = toServiceLines(lines);
  const total = useMemo(() => estimateTotal(lines, services), [lines, services]);
  const allPackage = chosen.length > 0 && chosen.every((l) => l.customerPackageId);

  const changeLines = (next) => { setLines(next); setStartTime(""); };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!chosen.length) {
      document.getElementById("booking-service-0")?.focus();
      return setError("Please choose at least one service in step 1.");
    }
    if (!startTime) {
      document.getElementById("booking-time-step")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return setError("Please choose an available time in step 3.");
    }
    setSubmitting(true);
    try {
      const data = await post("/api/booking/online", {
        services: chosen,
        appointmentDate,
        startTime,
        technicianId: technicianId ? Number(technicianId) : null,
        paymentChoice: allPackage ? "Counter" : paymentChoice,
        notes: notes.trim() || null,
      });
      setResult({ ...data, appointmentDate, startTime, endTime: selectedSlot?.endTime });
      if (!allPackage && paymentChoice === "Online" && data.invoiceId) {
        const pay = await post("/api/payments/vnpay/create", { invoiceId: data.invoiceId });
        if (pay?.paymentUrl) {
          window.location.assign(pay.paymentUrl);
          return;
        }
      }
      // Booked: show the confirmation in the summary card, then open the new appointment
      setTimeout(() => navigate(`/appointments/${data.appointmentId}`, { state: { created: true } }), 1500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const days = Array.from({ length: 14 }, (_, i) => addDays(today(), i));
  const dayDate = new Date(`${appointmentDate}T00:00:00`);
  const shortDay = dayDate.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "2-digit" });
  const longDay = dayDate.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
  const technicianName = technicianId
    ? slots.data?.technicians?.find((t) => String(t.staffId) === String(technicianId))?.fullName || "Selected technician"
    : "Any available";
  const tierPercent = Number(tier?.discountPercent || 0);
  const tierDiscount = Math.round((Number(total) || 0) * tierPercent / 100);

  return (
    <div className="sc-page">
      <section className="customer-booking-banner">
        <div className="customer-booking-container">
          <div className="customer-breadcrumb">
            <button type="button" onClick={() => navigate("/customer/home")}>Home</button>
            <i className="bi bi-chevron-right" aria-hidden="true" />
            <strong>Book an appointment</strong>
          </div>
          <div className="customer-booking-banner-row">
            <div>
              <span className="home-eyebrow">TAKE SOME TIME FOR YOURSELF</span>
              <h1>Book an appointment</h1>
              <p>
                Choose up to 4 back-to-back services. Book at least 2 hours and at most 30 days ahead —
                the receptionist will confirm your appointment.
              </p>
            </div>
            <Button variant="light" onClick={() => navigate("/appointments")}>
              <i className="bi bi-list-ul" aria-hidden="true" /> My Appointments
            </Button>
          </div>
        </div>
      </section>

      <div className="sc-container sc-section-tight">
        <FloatingAlert message={error} onClose={() => setError("")} />

        <Form noValidate onSubmit={handleSubmit} className="sc-booking">
          <div className="sc-booking-steps">
            <section className="sc-step-card">
              <span className="sc-step-title">1 · {packageId ? "Service from your package" : "Services"}</span>
              {packageId && bookedPackage ? (
                <div className="booking-package-locked">
                  <div className="booking-package-locked-head">
                    <span><i className="bi bi-box-seam" aria-hidden="true" /> Book with a package</span>
                    <strong>{bookedPackage.packageName}</strong>
                    <small>{bookedPackage.availableSessions} sessions left · Expires {viDate(bookedPackage.expiryDate)} · This session is free of charge</small>
                  </div>
                  {bookedPackage.services.length > 1 ? (
                    <Form.Group className="mt-3">
                      <Form.Label>Services in the package</Form.Label>
                      <Form.Select
                        value={lines[0]?.serviceId || ""}
                        disabled={submitting || !!result}
                        onChange={(e) => changeLines([{ serviceId: e.target.value, customerPackageId: packageId }])}
                      >
                        {bookedPackage.services.map((s) => (
                          <option key={s.serviceId} value={s.serviceId}>{s.serviceName} · {s.duration} minutes</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  ) : (
                    <p className="mt-3 mb-0">
                      Service: <strong>{bookedPackage.services[0].serviceName}</strong> · {bookedPackage.services[0].duration} minutes
                    </p>
                  )}
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <Button variant="outline-secondary" size="sm" disabled={submitting || !!result} onClick={() => leavePackageMode(true)}>
                      <i className="bi bi-plus-lg" aria-hidden="true" /> Add another service
                    </Button>
                    <Button variant="link" size="sm" className="p-0" disabled={submitting || !!result} onClick={() => leavePackageMode(false)}>
                      Don’t use a package
                    </Button>
                  </div>
                </div>
              ) : packageId ? (
                <div className="sc-muted"><Spinner size="sm" /> Loading treatment packages…</div>
              ) : (
                <ServiceLinesEditor services={services} packages={packages} lines={lines} onChange={changeLines} disabled={submitting || !!result} />
              )}
              <Form.Group className="mt-3" controlId="booking-technician">
                <Form.Label>Technician</Form.Label>
                <Form.Select value={technicianId} onChange={(e) => { setTechnicianId(e.target.value); setStartTime(""); }}>
                  <option value="">Any available technician</option>
                  {slots.data?.technicians?.map((t) => (
                    <option key={t.staffId} value={t.staffId}>{t.fullName}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </section>

            <section className="sc-step-card">
              <span className="sc-step-title">2 · Date</span>
              <div className="sc-day-chips" role="group" aria-label="Appointment date">
                {days.map((d) => {
                  const dt = new Date(`${d}T00:00:00`);
                  return (
                    <button
                      type="button"
                      key={d}
                      className={`sc-day-chip${appointmentDate === d ? " is-active" : ""}`}
                      aria-pressed={appointmentDate === d}
                      onClick={() => { setAppointmentDate(d); setStartTime(""); }}
                    >
                      <small>{d === today() ? "Today" : dt.toLocaleDateString("en-GB", { weekday: "short" })}</small>
                      <strong>{dt.getDate()}</strong>
                      <small>{dt.toLocaleDateString("en-GB", { month: "short" })}</small>
                    </button>
                  );
                })}
              </div>
              <label className="sc-other-date">
                Other date
                <Form.Control
                  type="date"
                  size="sm"
                  min={today()}
                  max={addDays(today(), 30)}
                  value={appointmentDate}
                  onChange={(e) => { if (e.target.value) { setAppointmentDate(e.target.value); setStartTime(""); } }}
                />
              </label>
            </section>

            <section className="sc-step-card" id="booking-time-step" tabIndex={-1}>
              <span className="sc-step-title">
                3 · Time · {shortDay}
                <small>Crossed out = no free technician or bed</small>
              </span>
              <SlotGrid
                slots={slots.data?.slots}
                loading={slots.loading}
                error={slots.error}
                value={startTime}
                onSelect={setStartTime}
              />
            </section>

            {!allPackage && (
              <section className="sc-step-card">
                <span className="sc-step-title">4 · Payment</span>
                <div className="sc-pay-cards">
                  <label className={`sc-pay-card${paymentChoice === "Counter" ? " is-active" : ""}`}>
                    <input type="radio" name="paymentChoice" checked={paymentChoice === "Counter"}
                      onChange={() => setPaymentChoice("Counter")} disabled={submitting || !!result} />
                    <span><strong>Pay at the counter</strong><small>Pending until our receptionist confirms</small></span>
                  </label>
                  <label className={`sc-pay-card${paymentChoice === "Online" ? " is-active" : ""}`}>
                    <input type="radio" name="paymentChoice" checked={paymentChoice === "Online"}
                      onChange={() => setPaymentChoice("Online")} disabled={submitting || !!result} />
                    <span><strong>Pay now with VNPay</strong><small>Confirmed as soon as payment succeeds</small></span>
                  </label>
                </div>
                <p className="sc-pay-note">
                  <i className="bi bi-info-circle" aria-hidden="true" />
                  Booking is free. Your appointment stays <strong>Pending</strong> until the receptionist confirms it
                  {paymentChoice === "Online" ? " — or is confirmed as soon as your VNPay payment succeeds." : "."}
                </p>
              </section>
            )}

            <section className="sc-step-card">
              <label className="sc-step-title" htmlFor="booking-notes">{allPackage ? "4" : "5"} · Notes (optional)</label>
              <Form.Control
                id="booking-notes"
                as="textarea"
                rows={2}
                maxLength={1000}
                placeholder="Skin concerns, allergies or special requests…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </section>
          </div>

          <aside className="sc-summary">
            <div className="sc-summary-card">
              <span className="sc-summary-label">YOUR BOOKING</span>
              <h2 className="sc-summary-title">
                {slots.data?.services?.map((s) => s.serviceName).join(" + ") || "Choose a service"}
              </h2>
              <dl className="sc-summary-lines">
                <div><dt>Date</dt><dd>{longDay}</dd></div>
                <div><dt>Time</dt><dd>{selectedSlot ? `${selectedSlot.startTime} – ${selectedSlot.endTime}` : "—"}</dd></div>
                <div><dt>Technician</dt><dd>{technicianName}</dd></div>
                <div><dt>Price</dt><dd>{chosen.length ? money(total) : "—"}</dd></div>
                {tierPercent > 0 && total > 0 && (
                  <div className="is-discount"><dt>{tier.tierName} member ({tierPercent}%)</dt><dd>−{money(tierDiscount)}</dd></div>
                )}
              </dl>
              <div className="sc-summary-total">
                <span>Estimated total</span>
                <strong>{chosen.length ? money(total - tierDiscount) : "—"}</strong>
              </div>
              {result ? (
                <div className="sc-summary-success" role="status" aria-live="polite">
                  <span className="sc-success-icon"><i className="bi bi-check-lg" aria-hidden="true" /></span>
                  <div>
                    <strong>Appointment booked!</strong>
                    <small>#{result.appointmentId} · {viDate(result.appointmentDate)} · {result.startTime}{result.endTime ? ` – ${result.endTime}` : ""}</small>
                    <small>{paymentChoice === "Online" && !allPackage ? "Opening VNPay…" : "Opening your appointment…"}</small>
                  </div>
                </div>
              ) : (
                <>
                  <button type="submit" className="sc-btn sc-btn-light sc-btn-block" disabled={submitting || slots.loading}>
                    {submitting ? <><Spinner size="sm" /> Processing…</> : paymentChoice === "Online" && !allPackage ? "Confirm & pay with VNPay" : "Confirm booking"}
                  </button>
                  <small className="sc-summary-caption">
                    {!startTime ? "Choose a time to continue." : "Free reschedule or cancel up to 2 hours before your appointment."}
                  </small>
                </>
              )}
            </div>
          </aside>
        </Form>
      </div>
    </div>
  );
};

export default CreateOnlineAppointment;
