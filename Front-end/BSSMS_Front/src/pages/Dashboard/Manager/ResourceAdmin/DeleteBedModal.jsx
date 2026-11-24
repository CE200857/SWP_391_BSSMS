// UC Delete Bed — confirmation dialog opened from the Rooms & beds page.
import { useEffect, useState } from "react";
import { del } from "../../../../services/api";
import ConfirmDeleteModal from "../../../../components/ConfirmDeleteModal";

/** bed: the bed to delete (null = closed) */
export default function DeleteBedModal({ bed, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setError(""); }, [bed]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await del(`/api/beds?id=${bed.bedId}`);
      onDeleted(r?.message || "Bed deleted.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmDeleteModal show={Boolean(bed)} title="Delete bed" busy={busy} error={error} onCancel={onClose} onConfirm={confirm}>
      <p className="mb-0">Delete bed <strong>{bed?.bedNumber} ({bed?.roomName})</strong>?</p>
    </ConfirmDeleteModal>
  );
}
