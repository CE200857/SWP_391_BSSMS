// UC Create Feedback — Customer writes a review for a completed service (route /feedback/new).
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Form, Button, Row, Col } from "react-bootstrap";
import {
  lineKey, formatDateTime, getStoredUser,
  NonCustomerNotice, FeedbackPageShell, StarRating, CommentField,
} from "./feedbackShared";

const CreateFeedbackForm = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [formData, setFormData] = useState({ rating: 5, comment: "" });
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user] = useState(getStoredUser);
  const customerId = user ? (user.customerId ?? user.accountId) : null;

  // Completed services of this customer that are still waiting for a review
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/feedback/appointments/${customerId}`);
        if (cancelled || !res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setOptions(list);
        const params = new URLSearchParams(search);
        const wanted = params.get("appointmentServiceId");
        const wantedAppointment = params.get("appointmentId");
        const match =
          list.find((o) => String(o.appointmentServiceId) === wanted) ||
          (wantedAppointment && list.find((o) => String(o.appointmentId) === wantedAppointment));
        setSelected(match ? lineKey(match.appointmentId, match.serviceId) : "");
      } catch (err) {
        if (!cancelled) console.error("Error loading data:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [user, customerId, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!user) return setError("You need to log in to do this!");
    const option = options.find((o) => lineKey(o.appointmentId, o.serviceId) === selected);
    if (!option) return setError("Please select the service to review!");
    if (!formData.comment.trim()) return setError("Please enter the review content!");

    setIsLoading(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: parseInt(formData.rating, 10),
          comment: formData.comment,
          appointmentId: option.appointmentId,
          serviceId: option.serviceId,
          appointmentServiceId: option.appointmentServiceId || 0,
          customerId,
        }),
      });
      if (response.ok) {
        setSuccessMsg("Thank you! Your review has been posted.");
        setTimeout(() => navigate("/feedback"), 1500);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Something went wrong. Please try again.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Cannot connect to the server.");
      setIsLoading(false);
    }
  };

  if (user && user.role !== "Customer") return <NonCustomerNotice />;

  // Opened from a specific appointment: only offer that visit's services
  const fromAppointment = new URLSearchParams(search).get("appointmentId");
  const appointmentOptions = fromAppointment ? options.filter((o) => String(o.appointmentId) === fromAppointment) : [];
  const visibleOptions = appointmentOptions.length > 0 ? appointmentOptions : options;
  const selectedOption = options.find((o) => lineKey(o.appointmentId, o.serviceId) === selected);
  const optionLabel = (o) => {
    const when = formatDateTime(o.appointmentDate, o.startTime);
    return when ? `${o.serviceName} - ${when}` : o.serviceName;
  };
  const locked = isLoading || successMsg !== "";

  return (
    <FeedbackPageShell title="Write a review" error={error} setError={setError} successMsg={successMsg} setSuccessMsg={setSuccessMsg}>
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6} className="mb-3">
            <Form.Group>
              <Form.Label className="fw-bold">Service *</Form.Label>
              {appointmentOptions.length === 1 && selectedOption ? (
                <>
                  <Form.Control value={optionLabel(selectedOption)} disabled readOnly />
                  <Form.Text className="text-muted">From the appointment you chose.</Form.Text>
                </>
              ) : (
                <>
                  <Form.Select value={selected} onChange={(e) => setSelected(e.target.value)} disabled={locked} required>
                    <option value="">-- Select service --</option>
                    {visibleOptions.map((o) => (
                      <option key={lineKey(o.appointmentId, o.serviceId)} value={lineKey(o.appointmentId, o.serviceId)}>
                        {optionLabel(o)}
                      </option>
                    ))}
                  </Form.Select>
                  {options.length === 0 ? (
                    <Form.Text className="text-danger">You have no completed services waiting for a review.</Form.Text>
                  ) : (
                    <Form.Text className="text-muted">Each service in each visit can be reviewed once.</Form.Text>
                  )}
                </>
              )}
            </Form.Group>
          </Col>
          <Col md={6} className="mb-3">
            <StarRating rating={formData.rating} onChange={(v) => setFormData((p) => ({ ...p, rating: v }))} />
          </Col>
        </Row>

        <CommentField value={formData.comment} onChange={(e) => setFormData((p) => ({ ...p, comment: e.target.value }))} disabled={locked} />

        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={() => navigate("/feedback")} disabled={locked}>Cancel</Button>
          <Button variant="danger" type="submit" disabled={locked || options.length === 0} style={{ minWidth: "160px" }}>
            {isLoading ? "Processing..." : successMsg ? "Redirecting..." : "Post review"}
          </Button>
        </div>
      </Form>
    </FeedbackPageShell>
  );
};

export default CreateFeedbackForm;
