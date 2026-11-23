import InfoPage, { InfoSection } from "./InfoPage";

export default function TermsOfUse() {
  return (
    <InfoPage title="Terms of use" lead="By creating an account and using the Seoul Center booking system, you agree to the terms below.">
      <InfoSection title="1. Account">
        <ul>
          <li>You provide accurate information (full name, phone number, email, date of birth) and update it when it changes.</li>
          <li>You are responsible for keeping your password and verification codes secret.</li>
          <li>Each account is for one customer; Seoul Center may deactivate accounts that violate these terms.</li>
        </ul>
      </InfoSection>
      <InfoSection title="2. Booking, rescheduling and cancelling">
        <ul>
          <li>Appointments must be within working hours 08:30–18:30 and are confirmed only when there are technicians with the right skills and beds of the right room type. Each appointment has 1–4 back-to-back services.</li>
          <li>Online bookings are made at least 2 hours and at most 30 days in advance. You can reschedule or cancel at least 2 hours before the appointment, with a reason.</li>
          <li>If you are more than 15 minutes late, the appointment may be recorded as \"No-show\" and are not refunded.</li>
          <li>Please declare your skin condition and allergies accurately so the technician can advise and work safely.</li>
        </ul>
      </InfoSection>
      <InfoSection title="3. Treatment package">
        <ul>
          <li>Each package shows its number of sessions, price and expiry date; the expiry date counts from the purchase date.</li>
          <li>A package can be used only after successful payment. Each completed session deducts one session; sessions cancelled or missed are not deducted.</li>
          <li>Expired or used-up packages cannot be used. Invoices for packages with used sessions cannot be cancelled.</li>
        </ul>
      </InfoSection>
      <InfoSection title="4. Payments, refunds and offers">
        <ul>
          <li>Cash, bank transfer at the counter and online payment via VNPay are accepted.</li>
          <li>Invoices are not deleted; invoice cancellations and refunds are reviewed and done by the manager.</li>
          <li>The membership tier discount is deducted first, then the voucher is applied; total discount up to 50% of the invoice amount. VNPay payments are valid for 15 minutes.</li>
        </ul>
      </InfoSection>
      <InfoSection title="5. Customer reviews">
        <p>You can only review services you have completed. Reviews must be honest and must not contain offensive language or false information; Seoul Center may hide reviews that violate the rules.</p>
      </InfoSection>
      <InfoSection title="6. Responsibilities">
        <p>Care results may vary from person to person. Seoul Center strives to provide accurate services and information, but is not responsible for damage caused by incorrect information you provide or by incidents beyond our control (network, payment gateway, email service).</p>
      </InfoSection>
      <InfoSection title="7. Changes to these terms">
        <p>These terms may be updated when services or rules change. Continuing to use the system after an update means you agree to the new content.</p>
      </InfoSection>
    </InfoPage>
  );
}
