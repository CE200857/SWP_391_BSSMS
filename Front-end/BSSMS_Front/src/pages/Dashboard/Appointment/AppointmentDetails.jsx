import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Container, Card, Badge, Button, Spinner, Alert, Modal, Form, Table } from "react-bootstrap";
import BookingPaymentNotice from "../../../components/BookingPaymentNotice";
import AppointmentStatusBadge from "../../../components/AppointmentStatusBadge";
import { api, post, put, money, time5, viDate, label } from "../../../services/api";
import { appointmentStatusLabel } from "../../../utils/appointmentStatus";
import FloatingAlert from "../../../components/FloatingAlert";

const lineBadge = { Waiting: "secondary", InProgress: "primary", Done: "success" };

const AppointmentDetails = ({ user }) => {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.created ? "Appointment created." : location.state?.rescheduled ? "Appointment rescheduled." : "");
  const [busy, setBusy] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAppointment(await api(`/api/appointments/${id}`));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const run = async (key, action, message) => {
    setBusy(key);
    setError("");
    try {
      const result = await action();
      setNotice(typeof message === "function" ? message(result) : message);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const cancel = () =>
    run("cancel", () => put(`/api/appointments/${id}/cancel`, { reason: reason.trim() }), (r) => {
      setShowCancel(false);
      return r?.refundRequired
        ? "Appointment cancelled. Paid invoices will be refunded by the manager."
        : "Appointment cancelled.";
    });

  const payOnline = () =>
    run("pay", async () => {
      const r = await post("/api/payments/vnpay/create", { invoiceId: appointment.invoice.invoiceId });
      window.location.assign(r.paymentUrl);
    }, "Redirecting to VNPay...");

  if (loading && !appointment)
    return <div className="text-center py-5"><Spinner animation="border" variant="danger" /><p className="text-muted mt-2">Loading appointments...</p></div>;
  if (!appointment)
    return (
      <Container className="mt-4">
        <Alert variant="warning">{error || "Appointment not found."}</Alert>
        <Button variant="secondary" onClick={() => navigate("/appointments")}>Back to list</Button>
      </Container>
    );

  const actions = appointment.actions || [];
  const lines = appointment.services || [];
  const invoice = appointment.invoice;
  const isCustomer = user?.role === "Customer";
  const canPayOnline = isCustomer && invoice?.status === "Unpaid" && Number(invoice.totalAmount) > 0
    && appointment.canPayOnline !== false;

  return (
    <Container className="mt-4 appointment-detail-page">
      <div className="appointment-detail-heading">
        <div>
          <div className="appointment-detail-eyebrow">APPOINTMENT · #{appointment.appointmentId}</div>
          <h1>Appointment details</h1>
          <p>{lines.length} services · {viDate(appointment.appointmentDate)} · {time5(appointment.startTime)}–{time5(appointment.endTime)}</p>
        </div>
        <Button variant="light" className="appointment-detail-back" onClick={() => navigate("/appointments")}>
          <i className="bi bi-arrow-left"></i> Back to list
        </Button>
      </div>

      <FloatingAlert message={notice} variant="success" onClose={() => setNotice("")} />
      {!isCustomer && appointment.timingNote && (
        <Alert variant={/Confirmation deadline passed|More than 15 minutes late/.test(appointment.timingNote) ? "warning" : "light"} className="py-2">
          <i className="bi bi-clock-history me-1"></i> {appointment.timingNote}
          {appointment.timingNote === "Confirmation deadline passed" && " – the appointment will be auto-cancelled. You can move it to another time and then confirm."}
          {appointment.timingNote === "More than 15 minutes late" && " – check-in is no longer possible; mark as No-show or reschedule."}
        </Alert>
      )}
      <FloatingAlert message={error} onClose={() => setError("")} />
      {isCustomer && appointment.status === "Pending" && <BookingPaymentNotice packageBooking={lines.every((l) => l.customerPackageId)} />}

      <Card className="appointment-detail-card">
        <Card.Header className="appointment-detail-card-header">
          <div>
            <span className="appointment-detail-label">APPOINTMENT ID</span>
            <strong>#{appointment.appointmentId}</strong>
          </div>
          <AppointmentStatusBadge status={appointment.status} />
        </Card.Header>

        <Card.Body className="appointment-detail-card-body">
          <section className="appointment-detail-service">
            <div className="appointment-detail-icon"><i className="bi bi-stars"></i></div>
            <div>
              <span className="appointment-detail-label">SERVICES</span>
              <h2>{lines.map((l) => l.serviceName).join(" → ")}</h2>
            </div>
          </section>

          <div className="table-responsive mb-4">
            <Table className="align-middle mb-0 manager-list-table">
              <thead className="table-light">
                <tr>
                  <th>#</th><th>Service</th><th>Time</th><th>Technician</th><th>Room / bed</th><th>Payment</th><th>Status</th>
                  {isCustomer && appointment.status === "Completed" && <th>Review</th>}
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.appointmentServiceId}>
                    <td>{l.lineNo}</td>
                    <td className="fw-semibold">{l.serviceName}<small className="d-block text-muted">{l.duration} minutes · {label(l.requiredRoomType)}</small></td>
                    <td>{time5(l.startTime)}–{time5(l.endTime)}</td>
                    <td>{l.technicianName || <span className="text-muted">Assigned at check-in</span>}{l.isRequestedTechnician ? <Badge bg="info" className="ms-1">Customer request</Badge> : null}</td>
                    <td>{l.roomName ? `${l.roomName} · ${l.bedNumber}` : <span className="text-muted">—</span>}</td>
                    <td>{l.customerPackageId ? <Badge bg="success">Package {l.packageName}</Badge> : money(l.unitPrice)}</td>
                    <td><Badge bg={lineBadge[l.status] || "secondary"}>{label(l.status)}</Badge></td>
                    {isCustomer && appointment.status === "Completed" && (
                      <td>
                        {Number(l.feedbackCount) > 0 ? (
                          <Button size="sm" variant="link" onClick={() => navigate("/my-feedback")}>View reviews</Button>
                        ) : (
                          <Button size="sm" variant="outline-danger" onClick={() => navigate(`/feedback/new?appointmentServiceId=${l.appointmentServiceId}`)}>Review</Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="appointment-detail-grid">
            <section className="appointment-detail-section">
              <h3><i className="bi bi-person-vcard"></i> Customer</h3>
              <div className="appointment-detail-fields">
                <div className="appointment-detail-field"><span>Full name</span><strong>{appointment.customerName}</strong></div>
                <div className="appointment-detail-field"><span>Phone</span><strong>{appointment.customerPhone}</strong></div>
                <div className="appointment-detail-field"><span>Membership tier</span><strong>{appointment.tierName}</strong></div>
                {!isCustomer && (appointment.allergies || appointment.skinCondition) && (
                  <div className="appointment-detail-field">
                    <span>Skin & allergy notes</span>
                    <strong className="text-danger">{[appointment.skinCondition, appointment.allergies && `Allergies: ${appointment.allergies}`].filter(Boolean).join(" · ")}</strong>
                  </div>
                )}
              </div>
            </section>

            <section className="appointment-detail-section">
              <h3><i className="bi bi-receipt"></i> Invoice</h3>
              {invoice ? (
                <div className="appointment-detail-fields">
                  <div className="appointment-detail-field"><span>Invoice ID</span><strong>#{invoice.invoiceId} · {label(invoice.status)}</strong></div>
                  <div className="appointment-detail-field"><span>Subtotal</span><strong>{money(invoice.subtotal)}</strong></div>
                  <div className="appointment-detail-field"><span>Discount</span><strong>{money(invoice.totalDiscount)}</strong></div>
                  <div className="appointment-detail-field"><span>Amount to pay</span><strong className="text-danger">{money(invoice.totalAmount)}</strong></div>
                  <div className="appointment-detail-field"><span>Type</span><strong>{label(appointment.paymentChoice)}</strong></div>
                </div>
              ) : <p className="text-muted mb-0">No invoices yet.</p>}
            </section>
          </div>

          <section className="appointment-detail-note">
            <h3><i className="bi bi-chat-left-text"></i> Notes</h3>
            <p>{appointment.notes || "There are no notes for this appointment."}</p>
          </section>

          {appointment.cancellationReason && (
            <Alert variant="light" className="appointment-detail-cancellation">
              <strong>Cancellation reason:</strong> {appointment.cancellationReason}
            </Alert>
          )}

          {(actions.length > 0 || canPayOnline) && (
            <div className="appointment-detail-actions">
              {actions.includes("confirm") && (
                <Button disabled={!!busy} onClick={() => run("confirm", () => put(`/api/appointments/${id}/confirm`, {}), "Appointment confirmed.")}>
                  <i className="bi bi-check2-circle"></i> Confirm appointment
                </Button>
              )}
              {actions.includes("checkin") && (
                <Button variant="success" onClick={() => navigate(`/receptionist/dashboard?appointmentId=${id}`)}>
                  <i className="bi bi-door-open"></i> Check-in & assignment
                </Button>
              )}
              {actions.includes("serviceStatus") && (
                <Button variant="success" onClick={() => navigate("/treatment-status")}>
                  <i className="bi bi-play-circle"></i> Update service status
                </Button>
              )}
              {canPayOnline && (
                <Button variant="outline-primary" disabled={!!busy} onClick={payOnline}>
                  <i className="bi bi-credit-card"></i> VNPay payment {money(invoice.totalAmount)}
                </Button>
              )}
              {actions.includes("reschedule") && (
                <Button className="appointment-detail-reschedule" onClick={() => navigate(`/appointments/${id}/reschedule`)}>
                  <i className="bi bi-calendar-event"></i> Reschedule
                </Button>
              )}
              {actions.includes("noShow") && (
                <Button variant="outline-dark" disabled={!!busy} onClick={() => run("noshow", () => put(`/api/appointments/${id}/no-show`, {}), "Marked as No-show.")}>
                  <i className="bi bi-person-x"></i> No-show
                </Button>
              )}
              {actions.includes("cancel") && (
                <Button variant="outline-danger" disabled={!!busy} onClick={() => { setReason(""); setShowCancel(true); }}>
                  <i className="bi bi-x-circle"></i> Cancel appointment
                </Button>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {appointment.history?.length > 0 && (
        <Card className="appointment-detail-card mt-4">
          <Card.Header className="appointment-detail-card-header"><strong>Status history</strong></Card.Header>
          <Card.Body>
            <ul className="list-unstyled mb-0">
              {appointment.history.map((h, i) => (
                <li key={i} className="mb-2">
                  <small className="text-muted">{String(h.changedAt).slice(0, 16).replace("T", " ")}</small>{" · "}
                  {h.oldStatus ? `${appointmentStatusLabel(h.oldStatus)} → ` : ""}<strong>{appointmentStatusLabel(h.newStatus)}</strong>
                  {h.reason ? ` · ${h.reason}` : ""}
                </li>
              ))}
            </ul>
          </Card.Body>
        </Card>
      )}

      <Modal show={showCancel} onHide={() => !busy && setShowCancel(false)} centered>
        <Modal.Header closeButton={!busy}><Modal.Title>Cancel appointment #{id}</Modal.Title></Modal.Header>
        <Form onSubmit={(e) => { e.preventDefault(); cancel(); }}>
          <Modal.Body>
            <p>Do you want to cancel the appointment on {viDate(appointment.appointmentDate)} at {time5(appointment.startTime)}?</p>
            {invoice?.status === "Paid" && <Alert variant="info">Paid invoices are refunded after manager approval.</Alert>}
            <Form.Group>
              <Form.Label>Cancellation reason *</Form.Label>
              <Form.Control as="textarea" rows={3} required maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" disabled={!!busy} onClick={() => setShowCancel(false)}>Keep appointment</Button>
            <Button variant="danger" type="submit" disabled={!!busy || !reason.trim()}>{busy === "cancel" ? "Cancelling…" : "Confirm cancellation"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AppointmentDetails;
