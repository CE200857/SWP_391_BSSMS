// UC Delete Package — confirmation dialog opened from the package list.
import { useEffect, useState } from "react";
import { del } from "../../../../services/api";
import ConfirmDeleteModal from "../../../../components/ConfirmDeleteModal";

/** pkg: the package to delete (null = closed) */
export default function DeleteTreatmentPackageModal({ pkg, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setError(""); }, [pkg]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await del(`/api/treatment-packages?id=${pkg.treatmentPackageId}`);
      onDeleted(r?.message || "Treatment package deleted.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmDeleteModal show={Boolean(pkg)} title="Delete treatment package" busy={busy} error={error} onCancel={onClose} onConfirm={confirm}>
      <p className="mb-2">Delete <strong>{pkg?.packageName}</strong>?</p>
      <p className="text-muted small mb-0">It is removed from the list and no longer sold. Customers who already bought it can still use it until it expires.</p>
    </ConfirmDeleteModal>
  );
}
