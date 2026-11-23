import { Link } from "react-router-dom";

export default function BookingPaymentNotice({ packageBooking = false }) {
  return (
    <aside className="booking-payment-notice" aria-label="Payment information">
      <i className="bi bi-info-circle" aria-hidden="true" />
      <div>
        <p className="mt-0">
          {packageBooking
            ? "This visit uses a session from your package, so there is nothing to pay."
            : "Booking is free. Pay at the counter after your visit, or prepay online with VNPay."}
          {" "}Your appointment stays <strong>Pending</strong> until the receptionist confirms it.
          {" "}<Link to="/appointments">View my appointments</Link>
        </p>
      </div>
    </aside>
  );
}
