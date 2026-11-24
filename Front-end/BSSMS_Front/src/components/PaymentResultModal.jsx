import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";

// After VNPay, the back-end redirects to /appointments/:id, /invoices or /my-treatment-profile
// with ?payment=success|failed|pending|invalid|error (&invoice=<id>). This pop-up shows the result
// on whichever page the customer lands, then removes ?payment so a refresh does not show it again.
const RESULTS = {
  success: {
    icon: "bi-check-circle-fill", tone: "success", title: "Payment successful",
    text: (inv) => `Your VNPay payment${inv} has been confirmed. Thank you for choosing Seoul Center!`,
  },
  failed: {
    icon: "bi-x-circle-fill", tone: "danger", title: "Payment failed",
    text: (inv) => `The VNPay payment${inv} was not completed. You can try again or pay at the counter.`,
  },
  pending: {
    icon: "bi-hourglass-split", tone: "warning", title: "Waiting for confirmation",
    text: (inv) => `VNPay has not confirmed the payment${inv} yet. Please check again in a few minutes.`,
  },
  invalid: {
    icon: "bi-exclamation-triangle-fill", tone: "warning", title: "Could not confirm the payment",
    text: () => "We could not confirm the payment result. Please contact the counter.",
  },
};

export default function PaymentResultModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const outcome = q.get("payment");
    if (!outcome) return;
    const invoice = q.get("invoice");
    setResult({ ...(RESULTS[outcome] || RESULTS.invalid), invoice });
    q.delete("payment");
    const rest = q.toString();
    navigate({ pathname: location.pathname, search: rest ? `?${rest}` : "" }, { replace: true, state: location.state });
  }, [location.search, location.pathname, location.state, navigate]);

  if (!result) return null;
  const inv = result.invoice ? ` for invoice #${result.invoice}` : "";
  return (
    <Modal show onHide={() => setResult(null)} centered className="payment-result-modal">
      <Modal.Body className="text-center px-4 pt-4 pb-3">
        <i className={`bi ${result.icon} payment-result-icon text-${result.tone}`} aria-hidden="true" />
        <h4 className="fw-bold mt-3 mb-2">{result.title}</h4>
        <p className="text-muted mb-0">{result.text(inv)}</p>
      </Modal.Body>
      <Modal.Footer className="justify-content-center border-0 pb-4">
        <Button variant={result.tone === "success" ? "success" : "outline-secondary"} className="px-5" onClick={() => setResult(null)} autoFocus>
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
