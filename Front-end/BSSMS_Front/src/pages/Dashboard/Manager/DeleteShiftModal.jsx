// Delete a staff shift — confirmation dialog opened from UpdateShiftModal.
import { useEffect, useState } from "react";
import { viDate } from "../../../services/api";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";
import { writeScheduling } from "./operationsWrite";

/** shift: the shift to delete (null = closed) */
export default function DeleteShiftModal({ shift, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setError(""); }, [shift]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await writeScheduling({ action: "deleteShift", id: shift.staffShiftId });
      onDeleted(r.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmDeleteModal show={Boolean(shift)} title="Delete shift" busy={busy} error={error} onCancel={onClose} onConfirm={confirm}>
      Delete the shift of <strong>{shift?.fullName}</strong> on <strong>{viDate(shift?.shiftDate)}</strong>?
    </ConfirmDeleteModal>
  );
}
