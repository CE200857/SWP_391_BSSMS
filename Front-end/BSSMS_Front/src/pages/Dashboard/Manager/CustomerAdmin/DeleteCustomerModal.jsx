// UC Delete Customer Account — confirmation dialog opened from the customer list.
import { useEffect, useState } from "react";
import ConfirmDeleteModal from "../../../../components/ConfirmDeleteModal";

/** customer: the customer to delete (null = closed) */
export default function DeleteCustomerModal({ customer, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setError(""); }, [customer]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/customers?id=${customer.customerId}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Error: Could not delete this customer.");
      }
      onDeleted();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmDeleteModal show={Boolean(customer)} title="Confirm account deletion" busy={busy} error={error} onCancel={onClose} onConfirm={confirm}>
      Delete customer <span className="fw-bold text-primary">{customer?.fullName}</span>? The account can no longer log in
      and is removed from the customer list. Their appointments, invoices and packages are kept in the database.
      Customers with upcoming appointments or unpaid invoices cannot be deleted.
    </ConfirmDeleteModal>
  );
}
