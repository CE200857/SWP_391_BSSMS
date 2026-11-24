// UC Delete Staff Account — confirmation dialog opened from the staff list.
import { useEffect, useState } from "react";
import ConfirmDeleteModal from "../../../../components/ConfirmDeleteModal";

/** staff: the staff member to delete (null = closed) */
export default function DeleteStaffModal({ staff, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setError(""); }, [staff]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/staff?id=${staff.staffId}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error("Could not delete the staff account.");
      onDeleted(staff, `Permanently deleted staff member ${staff.fullName}!`);
    } catch (err) {
      console.error("Error deleting staff:", err);
      setError(err.message || "Could not connect to the back-end.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmDeleteModal show={Boolean(staff)} title="Confirm staff deletion" busy={busy} error={error} onCancel={onClose} onConfirm={confirm}>
      Delete staff member <span className="fw-bold text-primary">{staff?.fullName}</span>? The account can no longer
      log in and is removed from the staff list. Their work history (appointments, invoices) is kept in the database.
    </ConfirmDeleteModal>
  );
}
