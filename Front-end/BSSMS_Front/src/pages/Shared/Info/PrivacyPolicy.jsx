import InfoPage, { InfoSection } from "./InfoPage";

export default function PrivacyPolicy() {
  return (
    <InfoPage title="Privacy policy" lead="Seoul Center is committed to protecting customers’ personal information. This page explains what we collect, what we use it for and what rights you have.">
      <InfoSection title="1. Information we collect">
        <ul>
          <li>Account and contact information: full name, username, phone number, email, date of birth, gender, address.</li>
          <li>Care information: skin condition, allergies, treatment notes, treatment outcomes and before/after photos (if any).</li>
          <li>Transaction information: your appointments, treatment packages, invoices, payments, vouchers and reviews.</li>
        </ul>
      </InfoSection>
      <InfoSection title="2. How we use it">
        <ul>
          <li>Book appointments, assign technicians, perform and record services.</li>
          <li>Create invoices, take payments, refund and apply member discounts.</li>
          <li>Send verification codes and notifications by email.</li>
          <li>Show service reviews and improve service quality.</li>
        </ul>
      </InfoSection>
      <InfoSection title="3. Sharing information">
        <p>Seoul Center does not sell personal information. We only share what is necessary with the online payment processor (VNPay) and the email service to perform the functions above, or when a competent authority requests it under the law.</p>
      </InfoSection>
      <InfoSection title="4. Who can see your information">
        <p>Staff can only see data that fits their role: receptionists and managers view profiles to serve customers; technicians only see the appointments and profiles of customers assigned to them. Before/after treatment photos can be seen only by that customer and the staff in charge of the appointment. Your name may be shown with public reviews.</p>
      </InfoSection>
      <InfoSection title="5. Storage and security">
        <p>Information is stored in the Seoul Center system and can only be accessed after logging in. Invoices and transaction history are kept for reconciliation and accounting obligations. Please keep your password and verification codes secret; do not share it with others.</p>
      </InfoSection>
      <InfoSection title="6. Your rights">
        <ul>
          <li>View and update your personal information in \"My profile\".</li>
          <li>Change your password at any time; changing the email requires verification with a code sent to the new email.</li>
          <li>Delete your review.</li>
          <li>To stop using or deactivate your account, contact customer care.</li>
        </ul>
      </InfoSection>
      <InfoSection title="7. Policy changes">
        <p>Seoul Center may update this policy when the system changes. The new version takes effect from the time it is posted on this page.</p>
      </InfoSection>
    </InfoPage>
  );
}
