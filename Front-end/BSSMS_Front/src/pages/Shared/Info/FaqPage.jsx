import { Accordion } from "react-bootstrap";
import InfoPage from "./InfoPage";

const FAQ = [
  ["How do I book an appointment?",
   "Log in to your customer account (or register if you don’t have one), choose \"Book\", choose 1 to 4 services (done back to back), an available date and time, and a technician if you like. Online bookings must be made at least 2 hours and at most 30 days in advance; new appointments are in status \"Pending\" until the receptionist confirms."],
  ["What are the spa’s opening hours?",
   "Seoul Center is open 08:30–18:30 daily. Appointments are scheduled within these hours."],
  ["Can I reschedule or cancel my appointment?",
   "You can reschedule or cancel yourself at least 2 hours before the appointment while it is still \"Pending\" or \"Confirmed\" (reason required); after rescheduling, the appointment waits for the receptionist to confirm again. If you have paid, the manager will handle the refund when you cancel."],
  ["What if I am late or do not show up?",
   "If you are more than 15 minutes late, the receptionist may mark the appointment as \"No-show\"; amounts paid for missed appointments are not refunded. For treatment packages, missed or cancelled sessions are not deducted from your sessions."],
  ["How do treatment packages work?",
   "You buy a package at the counter or online via VNPay. A package can be used only after successful payment; the number of sessions and the expiry date are shown on each package; each completed session deducts one session. You can track remaining sessions under \"My packages\"."],
  ["Which payment methods does Seoul Center accept?",
   "Cash, bank transfer at the counter and online payment via VNPay."],
  ["Which member benefits do I get?",
   "Membership tiers (Standard, Silver, Gold, VIP, VVIP) are assigned automatically based on lifetime spending. Each tier has its own discount for services and treatment packages; the voucher (if any) is applied after the tier discount, and the total discount is at most 50% of the invoice. See details under \"Membership benefits\"."],
  ["How do I recover a forgotten password?",
   "Select \"Forgot password\" on the login page, enter your registered email. The system sends a 6-digit verification code to your email; the code is only valid for a short time, so enter it right away."],
    ["Where can I review a service?",
   "After the service is completed, go to \"My reviews\" to write a review. Each service in each visit can be reviewed once; you can edit or delete your reviews at any time. Reviews that break the rules may be hidden by the manager."],
  ["Can invoices be cancelled or refunded?",
   "Invoice cancellations and refunds are done by the manager; invoices are not deleted but moved to status \"Cancelled\" or \"Refunded\". VNPay payments are refunded through VNPay; cash/bank transfer payments are refunded at the counter. Please contact the counter for help."],
];

export default function FaqPage() {
  return (
    <InfoPage title="Frequently asked questions" lead="Common questions customers ask when booking and using services at Seoul Center.">
      <Accordion alwaysOpen>
        {FAQ.map(([question, answer], index) => (
          <Accordion.Item eventKey={String(index)} key={question}>
            <Accordion.Header>{question}</Accordion.Header>
            <Accordion.Body>{answer}</Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </InfoPage>
  );
}
